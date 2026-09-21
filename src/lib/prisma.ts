import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { AsyncLocalStorage } from "node:async_hooks";

export interface HyperdriveBinding {
  connectionString: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

export interface RequestDatabaseContext {
  prisma?: PrismaClient;
  pool?: Pool;
  hyperdrive?: HyperdriveBinding;
}

// Global scope storage to prevent duplicate AsyncLocalStorage instances across bundled chunks
const globalStorage = globalThis as unknown as {
  __requestDatabaseStorage?: AsyncLocalStorage<RequestDatabaseContext>;
  __HYPERDRIVE_CONNECTION_STRING?: string;
  env?: { HYPERDRIVE?: HyperdriveBinding };
};

export const requestDatabaseStorage: AsyncLocalStorage<RequestDatabaseContext> =
  globalStorage.__requestDatabaseStorage ||
  (globalStorage.__requestDatabaseStorage = new AsyncLocalStorage<RequestDatabaseContext>());

/**
 * Retrieves the Hyperdrive configuration if running within a Cloudflare Worker request
 * context or if bridged via environment variables.
 */
export function getHyperdriveConfig(): HyperdriveBinding | undefined {
  const store = requestDatabaseStorage.getStore();
  if (store?.hyperdrive?.connectionString) {
    return store.hyperdrive;
  }
  if (process.env.HYPERDRIVE_CONNECTION_STRING) {
    return {
      connectionString: process.env.HYPERDRIVE_CONNECTION_STRING,
    };
  }
  if (globalStorage.__HYPERDRIVE_CONNECTION_STRING) {
    return {
      connectionString: globalStorage.__HYPERDRIVE_CONNECTION_STRING,
    };
  }
  if (globalStorage.env?.HYPERDRIVE?.connectionString) {
    return globalStorage.env.HYPERDRIVE;
  }
  return undefined;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  hasAdapter: boolean | undefined;
  pool: Pool | undefined;
};

/**
 * Safely extracts the database hostname for diagnostics without leaking credentials,
 * passwords, or query string parameters.
 */
export function getSafeDatabaseHost(urlStr?: string): string {
  const hyperdrive = getHyperdriveConfig();
  const url = urlStr || hyperdrive?.connectionString || process.env.DATABASE_URL;
  if (!url) return "NOT_SET";
  if (hyperdrive?.connectionString && url === hyperdrive.connectionString) {
    return "hyperdrive";
  }
  try {
    const parsed = new URL(url);
    return parsed.hostname || "unknown";
  } catch {
    return "invalid-url";
  }
}

/**
 * Normalizes the database URL with connection limits, timeouts, and PgBouncer parameters.
 * When Hyperdrive is available in the Cloudflare Worker runtime, prioritizes it over direct DATABASE_URL.
 */
export function getDatabaseUrl(): string | undefined {
  const hyperdrive = getHyperdriveConfig();
  if (hyperdrive?.connectionString) {
    return hyperdrive.connectionString;
  }

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
 * Creates a fresh, isolated PrismaClient instance with its own pg Pool.
 * Safe for serverless & edge runtimes where TCP sockets must not leak across requests.
 */
export function createRequestPrismaClient(dbUrlOverride?: string): {
  prisma: PrismaClient;
  pool: Pool | null;
  cleanup: () => Promise<void>;
} {
  const hyperdrive = getHyperdriveConfig();
  const dbUrl = dbUrlOverride || hyperdrive?.connectionString || getDatabaseUrl();
  if (!dbUrl) {
    const fallbackClient = new PrismaClient();
    return {
      prisma: fallbackClient,
      pool: null,
      cleanup: async () => {
        await fallbackClient.$disconnect().catch(() => {});
      },
    };
  }

  const isLocal = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");
  const isHyperdrive = Boolean(
    (hyperdrive?.connectionString && dbUrl === hyperdrive.connectionString) ||
    dbUrl.includes("hyperdrive") ||
    dbUrl.includes(".cloudflare.com")
  );

  const pool = new Pool({
    connectionString: dbUrl,
    // Hyperdrive connects locally over Cloudflare edge socket and manages TLS to the origin database
    ssl: isLocal || isHyperdrive ? undefined : { rejectUnauthorized: false },
    max: 1, // Single connection per request in serverless/edge to avoid socket exhaustion
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 15000,
  });

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  const cleanup = async () => {
    await client.$disconnect().catch(() => {});
    await pool.end().catch(() => {});
  };

  return { prisma: client, pool, cleanup };
}

/**
 * Lazily resolves or initializes the PrismaClient for the current execution context.
 * In request contexts (via requestDatabaseStorage), instantiates a request-scoped client.
 * Outside request contexts (Node.js dev, scripts, build), falls back to global singleton.
 */
export function getPrismaClient(): PrismaClient {
  const store = requestDatabaseStorage.getStore();
  if (store) {
    if (!store.prisma) {
      const { prisma: client, pool } = createRequestPrismaClient();
      store.prisma = client;
      store.pool = pool ?? undefined;
    }
    return store.prisma;
  }

  const hyperdrive = getHyperdriveConfig();
  const dbUrl = hyperdrive?.connectionString || getDatabaseUrl();
  if (!globalForPrisma.prisma || (!globalForPrisma.hasAdapter && dbUrl)) {
    const isLocal = dbUrl?.includes("localhost") || dbUrl?.includes("127.0.0.1");
    const isHyperdrive = Boolean(
      (hyperdrive?.connectionString && dbUrl === hyperdrive.connectionString) ||
      dbUrl?.includes("hyperdrive") ||
      dbUrl?.includes(".cloudflare.com")
    );
    const pool = dbUrl
      ? new Pool({
          connectionString: dbUrl,
          ssl: isLocal || isHyperdrive ? undefined : { rejectUnauthorized: false },
          max: 1,
          connectionTimeoutMillis: 15000,
          idleTimeoutMillis: 15000,
        })
      : undefined;

    const adapter = pool ? new PrismaPg(pool) : undefined;
    globalForPrisma.pool = pool;
    globalForPrisma.prisma = adapter
      ? new PrismaClient({
          adapter,
          log:
            process.env.NODE_ENV === "development"
              ? ["query", "error", "warn"]
              : ["error"],
        })
      : new PrismaClient();
    globalForPrisma.hasAdapter = Boolean(dbUrl);
  }
  return globalForPrisma.prisma;
}

/**
 * Transparent proxy to the lazily-initialized PrismaClient.
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
        const store = requestDatabaseStorage.getStore();
        if (store?.prisma) {
          await store.prisma.$disconnect().catch(() => {});
          await store.pool?.end().catch(() => {});
          store.prisma = undefined;
          store.pool = undefined;
        } else {
          await prisma.$disconnect().catch(() => {});
          globalForPrisma.prisma = undefined;
          globalForPrisma.hasAdapter = undefined;
          globalForPrisma.pool = undefined;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export default prisma;

