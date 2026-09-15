import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

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
  // Supabase PgBouncer TLS connection from client/Wi-Fi can take 5-15s on initial connect.
  // Prisma's default connect_timeout is 5s, which causes P1001 on cold connections.
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

const resolvedDbUrl = getDatabaseUrl();

/**
 * Singleton instance of PrismaClient.
 * In development, assigns to `globalThis` to prevent exhausting connection limits
 * across Next.js Hot Module Reloading (HMR).
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: resolvedDbUrl ? { db: { url: resolvedDbUrl } } : undefined,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

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
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export default prisma;
