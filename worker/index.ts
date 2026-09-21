import handler from "vinext/server/fetch-handler";
import { requestDatabaseStorage, type RequestDatabaseContext, type HyperdriveBinding } from "../src/lib/prisma";

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
    // Bridge Cloudflare Workers runtime environment variables & secrets into process.env & globalThis
    // This ensures DATABASE_URL, DIRECT_URL, and SUPABASE_SERVICE_ROLE_KEY are available to server code.
    if (env && typeof env === "object") {
      (globalThis as any).env = env;
      for (const [key, value] of Object.entries(env)) {
        if (typeof value === "string") {
          process.env[key] = value;
        }
      }
    }

    // Bridge Hyperdrive binding if configured
    const hyperdrive = env.HYPERDRIVE as HyperdriveBinding | undefined;
    if (hyperdrive?.connectionString) {
      process.env.HYPERDRIVE_CONNECTION_STRING = hyperdrive.connectionString;
      (globalThis as any).__HYPERDRIVE_CONNECTION_STRING = hyperdrive.connectionString;
    }

    const store: RequestDatabaseContext = {
      hyperdrive: hyperdrive?.connectionString ? hyperdrive : undefined,
    };

    const cleanup = async () => {
      if (store.prisma) {
        await store.prisma.$disconnect().catch(() => {});
      }
      if (store.pool) {
        await store.pool.end().catch(() => {});
      }
    };

    return requestDatabaseStorage.run(store, async () => {
      let response: Response;
      try {
        response = await (
          handler as {
            fetch: (
              req: Request,
              env: Record<string, unknown>,
              ctx: ExecutionContext
            ) => Promise<Response>;
          }
        ).fetch(request, env, ctx);
      } catch (fetchErr) {
        ctx.waitUntil(cleanup());
        throw fetchErr;
      }

      if (response.body) {
        let cleanedUp = false;
        const doCleanup = () => {
          if (!cleanedUp) {
            cleanedUp = true;
            ctx.waitUntil(cleanup());
          }
        };

        const transform = new TransformStream({
          transform(chunk, controller) {
            controller.enqueue(chunk);
          },
          flush() {
            doCleanup();
          },
          cancel() {
            doCleanup();
          },
        });

        const responseBody = response.body.pipeThrough(transform);
        const wrapped = new Response(responseBody, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
        (wrapped as any).__vinextStreamedHtmlResponse = (response as any).__vinextStreamedHtmlResponse;
        (wrapped as any).__vinextStreamedApiResponse = (response as any).__vinextStreamedApiResponse;
        return wrapped;
      } else {
        ctx.waitUntil(cleanup());
        return response;
      }
    });
  },
};
