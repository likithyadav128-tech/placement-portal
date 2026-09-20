import handler from "vinext/server/fetch-handler";
import { requestDatabaseStorage, type RequestDatabaseContext } from "../src/lib/prisma";

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException?(): void;
}

export default {
  async fetch(
    request: Request,
    env: Record<string, unknown>,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Bridge Cloudflare Workers runtime environment variables & secrets into process.env
    // This ensures DATABASE_URL, DIRECT_URL, and SUPABASE_SERVICE_ROLE_KEY are available to server code.
    if (env && typeof env === "object") {
      for (const [key, value] of Object.entries(env)) {
        if (typeof value === "string") {
          process.env[key] = value;
        }
      }
    }

    const store: RequestDatabaseContext = {};
    return requestDatabaseStorage.run(store, async () => {
      try {
        return await (
          handler as {
            fetch: (
              req: Request,
              env: Record<string, unknown>,
              ctx: ExecutionContext
            ) => Promise<Response>;
          }
        ).fetch(request, env, ctx);
      } finally {
        if (store.prisma) {
          ctx.waitUntil(store.prisma.$disconnect().catch(() => {}));
        }
        if (store.pool) {
          ctx.waitUntil(store.pool.end().catch(() => {}));
        }
      }
    });
  },
};
