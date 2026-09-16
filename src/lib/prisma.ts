import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Normalizes the database URL with connection limits, timeouts, and PgBouncer parameters.
 */
function getDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  let fixedUrl = url;
  // If connecting to Supabase PgBouncer (port 6543) without pgbouncer=true,
  // append it to prevent PostgreSQL error 42P05 / 26000 ("prepared statement already exists / does not exist")
  if (fixedUrl.includes(":6543") && !fixedUrl.includes("pgbouncer=true")) {
    const separator = fixedUrl.includes("?") ? "&" : "?";
    fixedUrl = `${fixedUrl}${separator}pgbouncer=true`;
  }
  if (!fixedUrl.includes("connection_limit=")) {
    const separator = fixedUrl.includes("?") ? "&" : "?";
    fixedUrl = `${fixedUrl}${separator}connection_limit=10`;
  }
  // Supabase PgBouncer TLS connection can take 5-15s on cold connections
  if (!fixedUrl.includes("connect_timeout=")) {
    const separator = fixedUrl.includes("?") ? "&" : "?";
    fixedUrl = `${fixedUrl}${separator}connect_timeout=30`;
  }
  if (!fixedUrl.includes("pool_timeout=")) {
    const separator = fixedUrl.includes("?") ? "&" : "?";
    fixedUrl = `${fixedUrl}${separator}pool_timeout=30`;
  }
  return fixedUrl;
}

/**
 * Creates an edge-compatible PrismaClient instance using the PostgreSQL Driver Adapter.
 * Avoids any dependency on native C++ binary query engines (which fail in Cloudflare Workers / workerd).
 */
function createPrismaClient(): PrismaClient {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    // Return standard client as fallback if DATABASE_URL is not yet available
    return new PrismaClient();
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl:
      dbUrl.includes("supabase.co") || dbUrl.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined,
    max: 10,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

/**
 * Lazily resolves or initializes the singleton PrismaClient.
 * This guarantees that process.env is read at runtime / request time rather than module evaluation time.
 */
export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Transparent proxy to the lazily-initialized PrismaClient singleton.
 * Callers can use `prisma.user.findUnique(...)` normally without manual initialization.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const val = Reflect.get(client, prop, receiver);
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});

/**
 * Safely executes a Prisma database query with automatic retry on transient pooler connection drops.
 * Specifically mitigates PgBouncer/Supabase idle TCP socket termination (P1001) and cold handshake timeouts.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err: unknown) {
      lastError = err;
      const isTransient =
        err !== null &&
        typeof err === "object" &&
        (("code" in err && (err as { code: string }).code === "P1001") ||
          ("name" in err &&
            (err as { name: string }).name === "PrismaClientInitializationError") ||
          ("message" in err &&
            typeof (err as { message: unknown }).message === "string" &&
            ((err as { message: string }).message.includes("Can't reach database server") ||
              (err as { message: string }).message.includes("Connection closed") ||
              (err as { message: string }).message.includes("connection reset") ||
              (err as { message: string }).message.includes("broken pipe") ||
              (err as { message: string }).message.includes("timed out"))));

      if (isTransient && attempt < maxRetries) {
        const delayMs = attempt * 1000;
        console.warn(
          `[Prisma] Transient connection error on attempt ${attempt}/${maxRetries}. Resetting connection and retrying in ${delayMs}ms...`
        );
        // Flush any stale sockets in the Prisma client pool before next attempt
        await prisma.$disconnect().catch(() => {});
        globalForPrisma.prisma = undefined;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export default prisma;
