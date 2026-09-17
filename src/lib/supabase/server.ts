import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates an authenticated Supabase client for Server Components,
 * Server Actions, and Route Handlers using cookie-based auth.
 * Supports an optional raw cookie header (defensive for edge / worker environments).
 */
export async function createClient(customCookieHeader?: string) {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  if (!customCookieHeader) {
    try {
      cookieStore = await cookies();
    } catch {
      // In edge runtimes / contexts without AsyncLocalStorage, cookies() may throw
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        if (customCookieHeader) {
          return parseCookieHeader(customCookieHeader);
        }
        if (cookieStore) {
          try {
            return cookieStore.getAll();
          } catch {
            return [];
          }
        }
        return [];
      },
      setAll(cookiesToSet) {
        if (!cookieStore) return;
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore!.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if middleware is refreshing user sessions.
        }
      },
    },
  });
}
