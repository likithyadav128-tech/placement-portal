import { NextResponse } from "next/server";
import { Client, Pool } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export const dynamic = "force-dynamic";

/**
 * Strictly sanitizes error messages and objects to prevent credential or secret leakage.
 */
function sanitize(msg: string): string {
  return msg
    .replace(/postgres(?:ql)?:\/\/[^@\s]+@([^\s/:]+)(?::\d+)?(?:\/[^\s?#]*)?(?:\?[^\s]*)?/gi, "postgresql://[REDACTED]@$1")
    .replace(/([a-zA-Z0-9_-]+):([a-zA-Z0-9!@#$%^&*()_+=-]+)@/g, "[REDACTED_USER]:[REDACTED_PASS]@")
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[REDACTED_JWT]");
}

type DiagnosticClassification =
  | "connection_string_issue"
  | "ssl_tls_issue"
  | "pooler_transaction_mode_issue"
  | "pooler_session_mode_issue"
  | "postgres_authentication_issue"
  | "cloudflare_tcp_issue"
  | "connection_lifecycle_issue"
  | "pg_driver_issue"
  | "prisma_adapter_issue"
  | "unknown";

function classifyError(err: unknown, stage: string, port: number): DiagnosticClassification {
  const errObj = err as Record<string, unknown> | null;
  const rawMsg = err instanceof Error ? err.message : String(err);
  const msg = rawMsg.toLowerCase();
  const code = typeof errObj?.code === "string" ? errObj.code : "";

  if (code === "28P01" || code === "28000" || msg.includes("password authentication failed") || msg.includes("authentication failed")) {
    return "postgres_authentication_issue";
  }
  if (msg.includes("connection terminated unexpectedly") || msg.includes("connection terminated") || msg.includes("unexpected eof")) {
    if (stage.includes("prisma_adapter")) {
      return "prisma_adapter_issue";
    }
    if (port === 6543) {
      return "pooler_transaction_mode_issue";
    }
    if (port === 5432) {
      return "pooler_session_mode_issue";
    }
    return "connection_lifecycle_issue";
  }
  if (
    code === "ERR_TLS_CERT_ALTNAME_INVALID" ||
    code === "DEPTH_ZERO_SELF_SIGNED_CERT" ||
    msg.includes("ssl") ||
    msg.includes("tls") ||
    msg.includes("cert") ||
    msg.includes("handshake") ||
    msg.includes("starttls")
  ) {
    return "ssl_tls_issue";
  }
  if (
    code === "ENOTFOUND" ||
    code === "ECONNREFUSED" ||
    code === "EHOSTUNREACH" ||
    code === "ENETUNREACH" ||
    msg.includes("enotfound") ||
    msg.includes("econnrefused") ||
    msg.includes("can't reach database server")
  ) {
    return "cloudflare_tcp_issue";
  }
  if (code === "42P05" || code === "26000" || msg.includes("prepared statement")) {
    return "pooler_transaction_mode_issue";
  }
  if (msg.includes("cannot perform i/o on behalf of a different request")) {
    return "connection_lifecycle_issue";
  }
  if (msg.includes("driver adapter") || msg.includes("adapter") || msg.includes("wasm query compiler")) {
    return "prisma_adapter_issue";
  }
  if (msg.includes("invalid connection string") || msg.includes("missing url") || msg.includes("not set")) {
    return "connection_string_issue";
  }
  if (msg.includes("stream") || msg.includes("socket") || msg.includes("cloudflare:sockets")) {
    return "pg_driver_issue";
  }
  return "unknown";
}

interface TestStepResult {
  stage: string;
  success: boolean;
  host: string;
  port: number;
  sslConfig: string;
  error?: {
    name: string;
    code?: string;
    message: string;
  };
  classification?: DiagnosticClassification;
  data?: unknown;
}

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  // 1. Parse and inspect DATABASE_URL structure safely (NO credentials logged or exposed)
  let parsedDbUrl: URL | null = null;
  let dbHost = "NOT_SET";
  let dbPort = 0;
  let dbName = "unknown";
  let hasSslMode = false;
  let sslModeValue: string | null = null;
  let hasPgBouncer = false;
  let pgbouncerValue: string | null = null;
  let poolerType: "transaction_pooler" | "session_pooler" | "direct_db" | "unknown" = "unknown";

  if (dbUrl) {
    try {
      parsedDbUrl = new URL(dbUrl);
      dbHost = parsedDbUrl.hostname;
      dbPort = parseInt(parsedDbUrl.port || "5432", 10);
      dbName = parsedDbUrl.pathname.replace(/^\//, "");
      hasSslMode = parsedDbUrl.searchParams.has("sslmode");
      sslModeValue = parsedDbUrl.searchParams.get("sslmode");
      hasPgBouncer = parsedDbUrl.searchParams.has("pgbouncer");
      pgbouncerValue = parsedDbUrl.searchParams.get("pgbouncer");

      if (dbPort === 6543) {
        poolerType = "transaction_pooler";
      } else if (dbPort === 5432) {
        poolerType = dbHost.includes("pooler.supabase.com") ? "session_pooler" : "direct_db";
      }
    } catch {
      dbHost = "invalid-url";
    }
  }

  // Parse DIRECT_URL safely
  let directHost = "NOT_SET";
  let directPort = 0;
  if (directUrl) {
    try {
      const p = new URL(directUrl);
      directHost = p.hostname;
      directPort = parseInt(p.port || "5432", 10);
    } catch {
      directHost = "invalid-url";
    }
  }

  const urlMetadata = {
    hasDbUrl: Boolean(dbUrl),
    dbHost,
    dbPort,
    dbName,
    hasSslMode,
    sslModeValue,
    hasPgBouncer,
    pgbouncerValue,
    poolerType,
    hasDirectUrl: Boolean(directUrl),
    directHost,
    directPort,
  };

  if (!dbUrl || !parsedDbUrl) {
    return NextResponse.json(
      {
        success: false,
        urlMetadata,
        tests: [],
        error: "DATABASE_URL is not set or invalid",
      },
      { status: 500 }
    );
  }

  const results: TestStepResult[] = [];

  // =========================================================================
  // TEST A: Plain pg.Client using exact DATABASE_URL (Port 6543)
  // Stage A1: connect()
  // Stage A2: SELECT 1
  // =========================================================================
  let clientA: Client | null = null;
  try {
    clientA = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    await clientA.connect();
    results.push({
      stage: "test_a_plain_client_connect",
      success: true,
      host: dbHost,
      port: dbPort,
      sslConfig: "rejectUnauthorized:false",
    });

    const resA = await clientA.query("SELECT 1 as test");
    results.push({
      stage: "test_a_plain_client_select_1",
      success: true,
      host: dbHost,
      port: dbPort,
      sslConfig: "rejectUnauthorized:false",
      data: resA.rows,
    });
  } catch (err: unknown) {
    const errObj = err as Record<string, unknown> | null;
    const rawMsg = err instanceof Error ? err.message : String(err);
    const stage = results.length === 0 ? "test_a_plain_client_connect" : "test_a_plain_client_select_1";
    results.push({
      stage,
      success: false,
      host: dbHost,
      port: dbPort,
      sslConfig: "rejectUnauthorized:false",
      error: {
        name: typeof errObj?.name === "string" ? errObj.name : "Error",
        code: typeof errObj?.code === "string" ? errObj.code : undefined,
        message: sanitize(rawMsg),
      },
      classification: classifyError(err, stage, dbPort),
    });
  } finally {
    if (clientA) {
      await clientA.end().catch(() => {});
    }
  }

  // =========================================================================
  // TEST B: Plain pg.Client on Port 5432 (Session Pooler Alternative)
  // Constructs alternative port 5432 URL from DATABASE_URL or DIRECT_URL
  // =========================================================================
  let sessionPoolerUrl: string | null = null;
  if (directUrl) {
    sessionPoolerUrl = directUrl;
  } else if (parsedDbUrl.port === "6543") {
    const alt = new URL(dbUrl);
    alt.port = "5432";
    alt.searchParams.delete("pgbouncer");
    sessionPoolerUrl = alt.toString();
  }

  if (sessionPoolerUrl) {
    let clientB: Client | null = null;
    try {
      clientB = new Client({
        connectionString: sessionPoolerUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });

      await clientB.connect();
      results.push({
        stage: "test_b_session_pooler_5432_connect",
        success: true,
        host: dbHost,
        port: 5432,
        sslConfig: "rejectUnauthorized:false",
      });

      const resB = await clientB.query("SELECT 1 as test");
      results.push({
        stage: "test_b_session_pooler_5432_select_1",
        success: true,
        host: dbHost,
        port: 5432,
        sslConfig: "rejectUnauthorized:false",
        data: resB.rows,
      });
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown> | null;
      const rawMsg = err instanceof Error ? err.message : String(err);
      const stage = results.some((r) => r.stage === "test_b_session_pooler_5432_connect")
        ? "test_b_session_pooler_5432_select_1"
        : "test_b_session_pooler_5432_connect";
      results.push({
        stage,
        success: false,
        host: dbHost,
        port: 5432,
        sslConfig: "rejectUnauthorized:false",
        error: {
          name: typeof errObj?.name === "string" ? errObj.name : "Error",
          code: typeof errObj?.code === "string" ? errObj.code : undefined,
          message: sanitize(rawMsg),
        },
        classification: classifyError(err, stage, 5432),
      });
    } finally {
      if (clientB) {
        await clientB.end().catch(() => {});
      }
    }
  }

  // =========================================================================
  // TEST C: PrismaPg + PrismaClient using exact DATABASE_URL (Port 6543)
  // =========================================================================
  let poolC: Pool | null = null;
  let prismaC: PrismaClient | null = null;
  try {
    let fixedDbUrl = dbUrl;
    if (fixedDbUrl.includes(":6543") && !fixedDbUrl.includes("pgbouncer=true")) {
      fixedDbUrl += (fixedDbUrl.includes("?") ? "&" : "?") + "pgbouncer=true";
    }

    poolC = new Pool({
      connectionString: fixedDbUrl,
      ssl: { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 10000,
    });

    const adapterC = new PrismaPg(poolC);
    prismaC = new PrismaClient({ adapter: adapterC });

    const resultC = await prismaC.$queryRaw<unknown[]>`SELECT 1 as test`;
    results.push({
      stage: "test_c_prisma_pg_select_1_port_6543",
      success: true,
      host: dbHost,
      port: dbPort,
      sslConfig: "rejectUnauthorized:false",
      data: resultC,
    });
  } catch (err: unknown) {
    const errObj = err as Record<string, unknown> | null;
    const rawMsg = err instanceof Error ? err.message : String(err);
    results.push({
      stage: "test_c_prisma_pg_select_1_port_6543",
      success: false,
      host: dbHost,
      port: dbPort,
      sslConfig: "rejectUnauthorized:false",
      error: {
        name: typeof errObj?.name === "string" ? errObj.name : "Error",
        code: typeof errObj?.code === "string" ? errObj.code : undefined,
        message: sanitize(rawMsg),
      },
      classification: classifyError(err, "prisma_adapter_select_1", dbPort),
    });
  } finally {
    if (prismaC) {
      await prismaC.$disconnect().catch(() => {});
    }
    if (poolC) {
      await poolC.end().catch(() => {});
    }
  }

  // =========================================================================
  // TEST D: PrismaPg + PrismaClient using Port 5432 (Session Pooler)
  // =========================================================================
  if (sessionPoolerUrl) {
    let poolD: Pool | null = null;
    let prismaD: PrismaClient | null = null;
    try {
      poolD = new Pool({
        connectionString: sessionPoolerUrl,
        ssl: { rejectUnauthorized: false },
        max: 1,
        connectionTimeoutMillis: 10000,
      });

      const adapterD = new PrismaPg(poolD);
      prismaD = new PrismaClient({ adapter: adapterD });

      const resultD = await prismaD.$queryRaw<unknown[]>`SELECT 1 as test`;
      results.push({
        stage: "test_d_prisma_pg_select_1_port_5432",
        success: true,
        host: dbHost,
        port: 5432,
        sslConfig: "rejectUnauthorized:false",
        data: resultD,
      });
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown> | null;
      const rawMsg = err instanceof Error ? err.message : String(err);
      results.push({
        stage: "test_d_prisma_pg_select_1_port_5432",
        success: false,
        host: dbHost,
        port: 5432,
        sslConfig: "rejectUnauthorized:false",
        error: {
          name: typeof errObj?.name === "string" ? errObj.name : "Error",
          code: typeof errObj?.code === "string" ? errObj.code : undefined,
          message: sanitize(rawMsg),
        },
        classification: classifyError(err, "prisma_adapter_select_1", 5432),
      });
    } finally {
      if (prismaD) {
        await prismaD.$disconnect().catch(() => {});
      }
      if (poolD) {
        await poolD.end().catch(() => {});
      }
    }
  }

  const anySuccess = results.some((r) => r.success && r.stage.includes("select_1"));

  return NextResponse.json(
    {
      success: anySuccess,
      urlMetadata,
      results,
      engine: "wasm",
    },
    { status: anySuccess ? 200 : 500 }
  );
}

