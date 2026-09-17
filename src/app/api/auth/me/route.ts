import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient as createSupabaseClient, type User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
export async function GET(request?: Request) {
  try {
    let authUser: SupabaseUser | null = null;

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
    const startsWithBearer = Boolean(authHeader && authHeader.startsWith("Bearer "));
    console.log(`[auth/me] Authorization header exists: ${hasAuthHeader}, startsWithBearer: ${startsWithBearer}`);

    if (authHeader && startsWithBearer) {
      const token = authHeader.substring(7).trim();
      if (token) {
        try {
          const supabaseUrl =
            process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project")
              ? process.env.NEXT_PUBLIC_SUPABASE_URL
              : "https://zfouzydarrtqfmrqjvsd.supabase.co";
          const supabaseAnonKey =
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder-anon")
              ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
              : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmb3V6eWRhcnJ0cWZtcnFqdnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTQ3MzcsImV4cCI6MjEwNDYzMDczN30.juQ-vhvvKx3AysRrRmEZkz5C4dU7TWwh52l8EfvN0QE";

          const directClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          });
          const { data, error } = await directClient.auth.getUser(token);
          if (error) {
            console.log(`[auth/me] Bearer token verification failed: ${error.message}`);
          } else if (data?.user) {
            authUser = data.user;
            console.log(`[auth/me] Bearer token verification succeeded. Supabase user ID: ${data.user.id}`);
          }
        } catch (tokenErr) {
          console.error("GET /api/auth/me bearer token error:", tokenErr);
        }
      }
    }

    // 2. Fallback auth check: Cookie session extraction (only when no Bearer token is present or valid)
    if (!authUser) {
      try {
        const rawCookie =
          request?.headers?.get("cookie") ??
          headerStore?.get("cookie") ??
          undefined;
        const supabaseClient = await createClient(rawCookie);
        const {
          data: { user },
          error: authError,
        } = await supabaseClient.auth.getUser();

        if (!authError && user) {
          authUser = user;
          console.log(`[auth/me] Cookie session verification succeeded. Supabase user ID: ${user.id}`);
        }
      } catch (cookieErr) {
        console.error("GET /api/auth/me cookie session error:", cookieErr);
      }
    }

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
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

    // 2. Resolve application User record in PostgreSQL using authUserId as primary mapping
    let dbUser = await withDbRetry(() =>
      prisma.user.findUnique({
        where: {
          authUserId: authUser.id,
        },
        select: userSelection,
      })
    );

    // Fallback lookup: if authUserId not yet set, check verified email
    if (!dbUser && authUser.email) {
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
    }

    console.log(`[auth/me] Prisma user lookup succeeded: ${Boolean(dbUser)}`);

    // 3. If no matching User record exists, reject without mock data
    if (!dbUser) {
      return NextResponse.json(
        {
          error: "User record not found in application database. Please contact your institution administrator.",
        },
        { status: 404 }
      );
    }

    // 4. Validate user status
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

    // 5. Return sanitized application user profile (strictly real data)
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
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
