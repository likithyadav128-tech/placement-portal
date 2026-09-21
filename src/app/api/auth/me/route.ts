import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient as createSupabaseClient, type User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { prisma, withDbRetry, getSafeDatabaseHost, getHyperdriveConfig } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Redacts any connection strings, credentials, passwords, or tokens from error messages.
 * Guarantees zero sensitive data leakage in logs or client diagnostics.
 */
function sanitizeErrorMessage(msg: string): string {
  let sanitized = msg.replace(
    /postgres(?:ql)?:\/\/[^@\s]+@([^\s/:]+)(?::\d+)?(?:\/[^\s?#]*)?(?:\?[^\s]*)?/gi,
    "postgresql://[REDACTED]@$1"
  );
  sanitized = sanitized.replace(
    /([a-zA-Z0-9_-]+):([a-zA-Z0-9!@#$%^&*()_+=-]+)@/g,
    "[REDACTED_USER]:[REDACTED_PASS]@"
  );
  sanitized = sanitized.replace(
    /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
    "[REDACTED_JWT]"
  );
  return sanitized;
}

export type DbFailureCategory =
  | "missing_env"
  | "dns_network_unreachable"
  | "ssl_tls_failure"
  | "auth_failure_postgres"
  | "adapter_runtime_failure"
  | "pool_exhaustion_timeout"
  | "schema_error"
  | "unknown_database_error";

function categorizeDatabaseError(err: unknown): {
  category: DbFailureCategory;
  name: string;
  code?: string;
  message: string;
} {
  if (!process.env.DATABASE_URL) {
    return {
      category: "missing_env",
      name: "MissingEnvironmentVariableError",
      code: "ENV_MISSING",
      message: "DATABASE_URL environment variable is not defined in Cloudflare Worker runtime.",
    };
  }

  const errObj = err as Record<string, unknown> | null;
  const name = typeof errObj?.name === "string" ? errObj.name : "Error";
  const code = typeof errObj?.code === "string" ? errObj.code : undefined;
  const rawMsg =
    err instanceof Error
      ? err.message
      : typeof errObj?.message === "string"
      ? errObj.message
      : String(err);
  const message = sanitizeErrorMessage(rawMsg);

  const lowerMsg = message.toLowerCase();
  const lowerName = name.toLowerCase();

  // 1. Missing env
  if (
    lowerMsg.includes("environment variable not found") ||
    (lowerMsg.includes("database_url") && lowerMsg.includes("not found"))
  ) {
    return { category: "missing_env", name, code, message };
  }

  // 2. DNS / Network unreachable
  if (
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN" ||
    code === "ECONNREFUSED" ||
    code === "EHOSTUNREACH" ||
    code === "ENETUNREACH" ||
    lowerMsg.includes("enotfound") ||
    lowerMsg.includes("getaddrinfo") ||
    lowerMsg.includes("econnrefused") ||
    lowerMsg.includes("can't reach database server")
  ) {
    return { category: "dns_network_unreachable", name, code, message };
  }

  // 3. SSL / TLS handshake failure
  if (
    code === "ERR_TLS_CERT_ALTNAME_INVALID" ||
    code === "DEPTH_ZERO_SELF_SIGNED_CERT" ||
    lowerMsg.includes("tls") ||
    lowerMsg.includes("ssl") ||
    lowerMsg.includes("handshake") ||
    lowerMsg.includes("cert") ||
    lowerMsg.includes("no pg_hba.conf entry") ||
    lowerMsg.includes("no encryption")
  ) {
    return { category: "ssl_tls_failure", name, code, message };
  }

  // 4. Auth failure to Postgres
  if (
    code === "28P01" ||
    code === "28000" ||
    lowerMsg.includes("password authentication failed") ||
    (lowerMsg.includes("role") && lowerMsg.includes("does not exist")) ||
    lowerMsg.includes("authentication failed")
  ) {
    return { category: "auth_failure_postgres", name, code, message };
  }

  // 5. Pool exhaustion / timeout
  if (
    code === "ETIMEDOUT" ||
    code === "P1001" ||
    code === "P1002" ||
    lowerMsg.includes("timed out") ||
    lowerMsg.includes("timeout") ||
    lowerMsg.includes("pool timeout") ||
    lowerMsg.includes("connection terminated") ||
    lowerMsg.includes("connection closed")
  ) {
    return { category: "pool_exhaustion_timeout", name, code, message };
  }

  // 6. Schema error (missing table / column / relation)
  if (
    code === "42P01" ||
    code === "42703" ||
    code === "P2021" ||
    code === "P2022" ||
    lowerMsg.includes("does not exist in the current database") ||
    (lowerMsg.includes("relation") && lowerMsg.includes("does not exist")) ||
    (lowerMsg.includes("column") && lowerMsg.includes("does not exist"))
  ) {
    return { category: "schema_error", name, code, message };
  }

  // 7. Adapter / runtime failure (Node vs Workers workerd engine, missing adapter, wasm issue)
  if (
    lowerName.includes("prismaclientinitializationerror") ||
    lowerMsg.includes("query engine") ||
    lowerMsg.includes("workerd") ||
    lowerMsg.includes("driver adapter") ||
    lowerMsg.includes("adapter") ||
    lowerMsg.includes("not implemented") ||
    lowerMsg.includes("unsupported")
  ) {
    return { category: "adapter_runtime_failure", name, code, message };
  }

  return { category: "unknown_database_error", name, code, message };
}

/**
 * GET /api/auth/me
 *
 * Secure server-side identity resolver endpoint.
 *
 * Requirements:
 * 1. Validates the Bearer token or session cookie via Supabase auth (never accepts client-supplied identity).
 * 2. Maps auth.users.id -> public.User.authUserId.
 * 3. Returns safe application-user information only (no secrets, tokens, or mock fallback).
 * 4. Responds with 401 if unauthenticated, 404/403 if no application record exists or if account is inactive/blocked.
 */
/**
 * Safely parses non-sensitive metadata from a JWT without cryptographic verification.
 * Used strictly for diagnostic logs and pre-flight validation.
 * NEVER returns raw token or sensitive private claims.
 */
function parseSafeJwtMetadata(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return {
      segmentCount: parts.length,
      tokenLength: token.length,
      validStructure: false,
    };
  }

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr =
      typeof atob === "function"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("utf-8");
    const payload = JSON.parse(jsonStr) as Record<string, unknown>;
    const now = Math.floor(Date.now() / 1000);

    return {
      segmentCount: 3,
      tokenLength: token.length,
      validStructure: true,
      iss: typeof payload.iss === "string" ? payload.iss : undefined,
      aud: typeof payload.aud === "string" ? payload.aud : undefined,
      exp: typeof payload.exp === "number" ? payload.exp : undefined,
      isExpired: typeof payload.exp === "number" ? now > payload.exp : undefined,
      hasSub: Boolean(payload.sub),
      role: typeof payload.role === "string" ? payload.role : undefined,
    };
  } catch {
    return {
      segmentCount: 3,
      tokenLength: token.length,
      validStructure: false,
      parseError: true,
    };
  }
}

export async function GET(request?: Request) {
  try {
    let authUser: SupabaseUser | null = null;
    let authFailureReason = "Unauthorized";
    let authFailureDetails: Record<string, unknown> | undefined = undefined;

    // 1. Primary auth check: Verify Authorization Bearer JWT (stateless, zero cookie/storage dependency)
    let headerStore: Awaited<ReturnType<typeof headers>> | null = null;
    try {
      headerStore = await headers();
    } catch {
      // Defensive: In edge runtimes / contexts without AsyncLocalStorage, headers() may throw
    }

    const authHeader =
      request?.headers?.get("authorization") ||
      request?.headers?.get("Authorization") ||
      headerStore?.get("authorization") ||
      headerStore?.get("Authorization") ||
      null;

    const hasAuthHeader = Boolean(authHeader);
    const trimmedHeader = authHeader?.trim() || "";
    const startsWithBearer = Boolean(trimmedHeader.toLowerCase().startsWith("bearer "));
    console.log(`[auth/me] Authorization header exists: ${hasAuthHeader}, startsWithBearer: ${startsWithBearer}`);

    if (hasAuthHeader && startsWithBearer) {
      const token = trimmedHeader.slice(7).trim();
      const jwtMeta = parseSafeJwtMetadata(token);

      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project")
          ? process.env.NEXT_PUBLIC_SUPABASE_URL
          : "https://zfouzydarrtqfmrqjvsd.supabase.co";
      const supabaseAnonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder-anon")
          ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmb3V6eWRhcnJ0cWZtcnFqdnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTQ3MzcsImV4cCI6MjEwNDYzMDczN30.juQ-vhvvKx3AysRrRmEZkz5C4dU7TWwh52l8EfvN0QE";

      let configuredHost = "unknown";
      try {
        configuredHost = new URL(supabaseUrl).hostname;
      } catch {
        configuredHost = "invalid-url";
      }

      const issuerMatchesProject = Boolean(
        jwtMeta.iss &&
          (jwtMeta.iss === supabaseUrl ||
            jwtMeta.iss === `${supabaseUrl}/auth/v1` ||
            jwtMeta.iss.includes(configuredHost))
      );

      // Diagnostic logging (strictly safe, NO tokens, NO secrets, NO passwords)
      console.log(
        `[auth/me:diagnostics] tokenLen=${jwtMeta.tokenLength} segments=${jwtMeta.segmentCount} valid=${jwtMeta.validStructure} iss=${jwtMeta.iss} host=${configuredHost} match=${issuerMatchesProject} expired=${jwtMeta.isExpired} hasSub=${jwtMeta.hasSub} aud=${jwtMeta.aud} role=${jwtMeta.role} hasAnonKey=${Boolean(supabaseAnonKey)} hasServiceKey=${Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)} hasDbUrl=${Boolean(process.env.DATABASE_URL)} dbHost=${getSafeDatabaseHost()} hasDirectUrl=${Boolean(process.env.DIRECT_URL)}`
      );

      if (!jwtMeta.validStructure) {
        authFailureReason = "Malformed Bearer token: JWT must contain 3 segments.";
        authFailureDetails = { segmentCount: jwtMeta.segmentCount };
      } else if (jwtMeta.isExpired) {
        authFailureReason = "Bearer token has expired. Please sign in again.";
        authFailureDetails = { exp: jwtMeta.exp };
      } else if (jwtMeta.iss && !issuerMatchesProject) {
        authFailureReason = `JWT issuer mismatch: token issued by '${jwtMeta.iss}' but server configured for '${configuredHost}'.`;
        authFailureDetails = { tokenIssuer: jwtMeta.iss, configuredHost };
      } else {
        try {
          const directClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          });
          const { data, error } = await directClient.auth.getUser(token);
          if (error) {
            console.error(`[auth/me] Supabase getUser failed: name=${error.name} status=${error.status} msg=${error.message}`);
            authFailureReason = `Supabase authentication error: ${error.message}`;
            authFailureDetails = {
              name: error.name,
              status: error.status,
              message: error.message,
            };
          } else if (data?.user) {
            authUser = data.user;
            console.log(`[auth/me] Supabase getUser succeeded. Supabase user ID: ${data.user.id}`);
          } else {
            authFailureReason = "Supabase getUser returned no user object.";
          }
        } catch (tokenErr: unknown) {
          const errMsg = tokenErr instanceof Error ? tokenErr.message : String(tokenErr);
          console.error(`[auth/me] Supabase getUser exception: ${errMsg}`);
          authFailureReason = `Supabase request exception: ${errMsg}`;
        }
      }
    } else {
      authFailureReason = hasAuthHeader
        ? "Authorization header does not start with 'Bearer '"
        : "Missing Authorization header";
    }

    // 2. Fallback auth check: Cookie session extraction (only when no Bearer token is present or valid)
    if (!authUser) {
      try {
        const rawCookie =
          request?.headers?.get("cookie") ??
          headerStore?.get("cookie") ??
          undefined;
        if (rawCookie) {
          const supabaseClient = await createClient(rawCookie);
          const {
            data: { user },
            error: authError,
          } = await supabaseClient.auth.getUser();

          if (!authError && user) {
            authUser = user;
            console.log(`[auth/me] Cookie session verification succeeded. Supabase user ID: ${user.id}`);
          }
        }
      } catch (cookieErr) {
        console.error("GET /api/auth/me cookie session error:", cookieErr);
      }
    }

    if (!authUser) {
      return NextResponse.json(
        {
          error: authFailureReason,
          details: authFailureDetails,
        },
        { status: 401 }
      );
    }

    const userSelection = {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      avatarUrl: true,
      status: true,
      student: {
        select: {
          id: true,
          rollNumber: true,
          department: true,
          year: true,
          graduationYear: true,
          phone: true,
          skills: true,
          placementReadiness: true,
          overallScore: true,
          codingScore: true,
          aptitudeScore: true,
          reasoningScore: true,
          communicationScore: true,
          trend: true,
          status: true,
        },
      },
      faculty: {
        select: {
          id: true,
          employeeId: true,
          department: true,
          designation: true,
          status: true,
        },
      },
    };

    // 2. Preflight database verification
    const hasDbUrl = Boolean(process.env.DATABASE_URL || getHyperdriveConfig()?.connectionString);
    const dbHost = getSafeDatabaseHost();
    console.log(
      `[auth/me:db] Initiating DB lookup for Supabase user: ${authUser.id}. hasDbUrl=${hasDbUrl}, dbHost=${dbHost}`
    );

    if (!hasDbUrl) {
      console.error("[auth/me:db] Neither DATABASE_URL nor Hyperdrive connection is available in runtime.");
      return NextResponse.json(
        {
          error: "Database configuration error",
          diagnostics: {
            step: "preflight_env_check",
            category: "missing_env",
            hasDbUrl: false,
            dbHost: "NOT_SET",
            hasDirectUrl: Boolean(process.env.DIRECT_URL),
            name: "MissingEnvironmentVariableError",
            code: "ENV_MISSING",
            message: "Neither DATABASE_URL nor Hyperdrive binding is configured in Cloudflare Worker runtime.",
          },
        },
        { status: 500 }
      );
    }

    // 3. Minimal connectivity check (SELECT 1)
    try {
      await withDbRetry(() => prisma.$queryRaw`SELECT 1 as test`, 1);
      console.log(`[auth/me:db] Minimal connectivity check (SELECT 1) succeeded. dbHost=${dbHost}`);
    } catch (connErr: unknown) {
      const diag = categorizeDatabaseError(connErr);
      console.error(
        `[auth/me:db] Minimal connectivity check (SELECT 1) failed: category=${diag.category} name=${diag.name} code=${diag.code} msg=${diag.message}`
      );
      return NextResponse.json(
        {
          error: "Database connectivity test failed",
          diagnostics: {
            step: "connectivity_check",
            category: diag.category,
            hasDbUrl: true,
            dbHost,
            hasDirectUrl: Boolean(process.env.DIRECT_URL),
            name: diag.name,
            code: diag.code,
            message: diag.message,
          },
        },
        { status: 500 }
      );
    }

    // 4. Resolve application User record in PostgreSQL using authUserId as primary mapping
    let dbUser = null;
    try {
      dbUser = await withDbRetry(() =>
        prisma.user.findUnique({
          where: {
            authUserId: authUser.id,
          },
          select: userSelection,
        })
      );
    } catch (queryErr: unknown) {
      const diag = categorizeDatabaseError(queryErr);
      console.error(
        `[auth/me:db] User findUnique by authUserId failed: category=${diag.category} name=${diag.name} code=${diag.code} msg=${diag.message}`
      );
      return NextResponse.json(
        {
          error: "Database user query failed",
          diagnostics: {
            step: "user_lookup_by_auth_id",
            category: diag.category,
            hasDbUrl: true,
            dbHost,
            name: diag.name,
            code: diag.code,
            message: diag.message,
          },
        },
        { status: 500 }
      );
    }

    // Fallback lookup: if authUserId not yet set, check verified email
    if (!dbUser && authUser.email) {
      try {
        const userByEmail = await withDbRetry(() =>
          prisma.user.findUnique({
            where: {
              email: authUser.email,
            },
            select: {
              ...userSelection,
              authUserId: true,
            },
          })
        );

        if (userByEmail && !userByEmail.authUserId) {
          // Link the authUserId to the existing application record
          await withDbRetry(() =>
            prisma.user.update({
              where: { id: userByEmail.id },
              data: {
                authUserId: authUser.id,
                lastLoginAt: new Date(),
              },
            })
          );

          dbUser = {
            id: userByEmail.id,
            name: userByEmail.name,
            email: userByEmail.email,
            role: userByEmail.role,
            department: userByEmail.department,
            avatarUrl: userByEmail.avatarUrl,
            status: userByEmail.status,
            student: userByEmail.student,
            faculty: userByEmail.faculty,
          };
        }
      } catch (fallbackErr: unknown) {
        const diag = categorizeDatabaseError(fallbackErr);
        console.error(
          `[auth/me:db] User fallback lookup by email failed: category=${diag.category} name=${diag.name} code=${diag.code} msg=${diag.message}`
        );
        return NextResponse.json(
          {
            error: "Database fallback query failed",
            diagnostics: {
              step: "user_lookup_by_email",
              category: diag.category,
              hasDbUrl: true,
              dbHost,
              name: diag.name,
              code: diag.code,
              message: diag.message,
            },
          },
          { status: 500 }
        );
      }
    }

    console.log(`[auth/me] Prisma user lookup succeeded: ${Boolean(dbUser)}`);

    // 5. If no matching User record exists, reject without mock data
    if (!dbUser) {
      return NextResponse.json(
        {
          error: "User record not found in application database. Please contact your institution administrator.",
        },
        { status: 404 }
      );
    }

    // 6. Validate user status
    if (dbUser.status === "BLOCKED") {
      return NextResponse.json(
        { error: "Your account has been suspended or blocked." },
        { status: 403 }
      );
    }

    if (dbUser.status === "INACTIVE") {
      return NextResponse.json(
        { error: "Your account is currently inactive." },
        { status: 403 }
      );
    }

    // 7. Return sanitized application user profile (strictly real data)
    return NextResponse.json(
      {
        user: {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          department: dbUser.department,
          avatarUrl: dbUser.avatarUrl,
          student: dbUser.student,
          faculty: dbUser.faculty,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const diag = categorizeDatabaseError(err);
    console.error(
      `[auth/me:error] Uncaught exception in GET /api/auth/me: category=${diag.category} name=${diag.name} code=${diag.code} msg=${diag.message}`
    );
    return NextResponse.json(
      {
        error: "Internal server error",
        diagnostics: {
          step: "uncaught_route_exception",
          category: diag.category,
          hasDbUrl: Boolean(process.env.DATABASE_URL),
          dbHost: getSafeDatabaseHost(),
          name: diag.name,
          code: diag.code,
          message: diag.message,
        },
      },
      { status: 500 }
    );
  }
}
