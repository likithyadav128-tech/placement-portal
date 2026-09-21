import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 Edge Proxy for route protection and session management.
 * Keeps Supabase auth token fresh on incoming requests.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets, api routes, and public files bypass middleware/proxy
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Update session cookies with Supabase Auth
  const { response, user } = await updateSession(request);

  // If Supabase environment is active, enforce session presence
  const isSupabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder-project");

  if (isSupabaseConfigured) {
    const isProtectedRoute =
      pathname.startsWith("/student") ||
      pathname.startsWith("/faculty") ||
      pathname.startsWith("/management");

    if (isProtectedRoute && !user) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images / svg / static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
