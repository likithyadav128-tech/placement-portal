import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

/**
 * Creates an authenticated Supabase client for Server Components,
 * Server Actions, and Route Handlers using cookie-based auth.
 * Supports an optional raw cookie header (defensive for edge / worker environments).
 */
export async function createClient(customCookieHeader?: string) {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  let headerStore: Awaited<ReturnType<typeof headers>> | null = null;

  if (!customCookieHeader) {
    try {
      cookieStore = await cookies();
    } catch {
      // In edge runtimes / contexts without AsyncLocalStorage, cookies() may throw
    }
    try {
      headerStore = await headers();
    } catch {
      // In edge runtimes / contexts without AsyncLocalStorage, headers() may throw
    }
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project")
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : "https://zfouzydarrtqfmrqjvsd.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder-anon")
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmb3V6eWRhcnJ0cWZtcnFqdnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTQ3MzcsImV4cCI6MjEwNDYzMDczN30.juQ-vhvvKx3AysRrRmEZkz5C4dU7TWwh52l8EfvN0QE";

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        if (customCookieHeader) {
          return parseCookieHeader(customCookieHeader);
        }
        if (cookieStore) {
          try {
            const list = cookieStore.getAll();
            if (list && list.length > 0) {
              return list;
            }
          } catch {
            // Ignore if cookieStore access fails
          }
        }
        const rawHeaderCookie = headerStore?.get("cookie");
        if (rawHeaderCookie) {
          return parseCookieHeader(rawHeaderCookie);
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
          // This can be ignored if middleware/proxy is refreshing user sessions.
        }
      },
    },
  });
}
