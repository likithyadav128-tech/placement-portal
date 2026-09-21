import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { createClient as createDirectClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Updates user session cookie on incoming requests.
 * Used in Next.js middleware/proxy to keep the session alive and validate auth state.
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next();

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project")
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : "https://zfouzydarrtqfmrqjvsd.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder-anon")
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmb3V6eWRhcnJ0cWZtcnFqdnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTQ3MzcsImV4cCI6MjEwNDYzMDczN30.juQ-vhvvKx3AysRrRmEZkz5C4dU7TWwh52l8EfvN0QE";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const raw = request.headers.get("cookie");
        if (raw) {
          const parsed = parseCookieHeader(raw);
          if (parsed && parsed.length > 0) {
            return parsed;
          }
        }
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Avoid getSession() inside middleware because it does not validate with the auth server.
  // getUser() sends a request to the Supabase Auth server to revalidate the token.
  let authUser = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authUser = user;
  } catch (err) {
    console.warn("[middleware:updateSession] Supabase getUser via cookies error:", err);
  }

  // Fallback: Check Authorization Bearer header if cookies did not produce an authenticated user
  if (!authUser) {
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (authHeader?.toLowerCase().startsWith("bearer ")) {
      const token = authHeader.slice(7).trim();
      try {
        const directClient = createDirectClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data, error } = await directClient.auth.getUser(token);
        if (!error && data?.user) {
          authUser = data.user;
        }
      } catch (directErr) {
        console.warn("[middleware:updateSession] Direct token verification error:", directErr);
      }
    }
  }

  return { response, user: authUser };
}
