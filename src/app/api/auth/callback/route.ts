import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  UnregisteredUserError,
  BlockedUserError,
  InactiveUserError,
} from "@/lib/auth/errors";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  try {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("OAuth code exchange error:", exchangeError.message);
      return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
    }

    // Resolve application user and role from database
    const dbUser = await getCurrentUser();

    if (!dbUser) {
      return NextResponse.redirect(`${origin}/login?error=unregistered`);
    }

    // Role-based portal routing (derived strictly from database, NEVER client input)
    switch (dbUser.role) {
      case "STUDENT":
        return NextResponse.redirect(`${origin}/student/dashboard`);
      case "FACULTY":
        return NextResponse.redirect(`${origin}/faculty/dashboard`);
      case "MANAGEMENT":
        return NextResponse.redirect(`${origin}/management/dashboard`);
      default:
        return NextResponse.redirect(`${origin}${next}`);
    }
  } catch (error) {
    if (error instanceof UnregisteredUserError) {
      return NextResponse.redirect(`${origin}/login?error=unregistered`);
    }
    if (error instanceof BlockedUserError) {
      return NextResponse.redirect(`${origin}/login?error=blocked`);
    }
    if (error instanceof InactiveUserError) {
      return NextResponse.redirect(`${origin}/login?error=inactive`);
    }

    console.error("Authentication callback error:", error);
    return NextResponse.redirect(`${origin}/login?error=server_error`);
  }
}
