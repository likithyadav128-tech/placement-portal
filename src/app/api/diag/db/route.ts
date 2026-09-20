import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

/**
 * Redacts credentials from error messages.
 */
function sanitize(msg: string): string {
  return msg
    .replace(/postgres(?:ql)?:\/\/[^@\s]+@([^\s/:]+)(?::\d+)?(?:\/[^\s?#]*)?(?:\?[^\s]*)?/gi, "postgresql://[REDACTED]@$1")
    .replace(/([a-zA-Z0-9_-]+):([a-zA-Z0-9!@#$%^&*()_+=-]+)@/g, "[REDACTED_USER]:[REDACTED_PASS]@")
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[REDACTED_JWT]");
}

function getSafeHost(urlStr?: string): string {
  if (!urlStr) return "NOT_SET";
  try {
    return new URL(urlStr).hostname || "unknown";
  } catch {
    return "invalid-url";
  }
}

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const hasDbUrl = Boolean(dbUrl);
  const dbHost = getSafeHost(dbUrl);

  if (!dbUrl) {
    return NextResponse.json(
      {
        success: false,
        phase: "env_check",
        hasDbUrl: false,
        dbHost: "NOT_SET",
        error: "DATABASE_URL is not set",
      },
      { status: 500 }
    );
  }

  // Normalize URL parameters for PgBouncer / serverless
  let fixedUrl = dbUrl;
  if (fixedUrl.includes(":6543") && !fixedUrl.includes("pgbouncer=true")) {
    fixedUrl += (fixedUrl.includes("?") ? "&" : "?") + "pgbouncer=true";
  }

  const isLocal = fixedUrl.includes("localhost") || fixedUrl.includes("127.0.0.1");

  // Pattern A: Per-request Pool + PrismaPg + PrismaClient/wasm
  let pool: Pool | null = null;
  let client: PrismaClient | null = null;

  try {
    pool = new Pool({
      connectionString: fixedUrl,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 15000,
    });

    const adapter = new PrismaPg(pool);
    client = new PrismaClient({ adapter });

    const result = await client.$queryRaw<unknown[]>`SELECT 1 as test`;

    return NextResponse.json({
      success: true,
      phase: "select_1",
      hasDbUrl: true,
      dbHost,
      result,
      engine: "wasm",
    });
  } catch (err: unknown) {
    const errObj = err as Record<string, unknown> | null;
    const name = typeof errObj?.name === "string" ? errObj.name : "Error";
    const code = typeof errObj?.code === "string" ? errObj.code : undefined;
    const rawMsg = err instanceof Error ? err.message : String(err);
    const message = sanitize(rawMsg);

    return NextResponse.json(
      {
        success: false,
        phase: "select_1",
        hasDbUrl: true,
        dbHost,
        name,
        code,
        message,
        engine: "wasm",
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.$disconnect().catch(() => {});
    }
    if (pool) {
      await pool.end().catch(() => {});
    }
  }
}
