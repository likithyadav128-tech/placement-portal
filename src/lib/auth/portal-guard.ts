import { redirect } from "next/navigation";
import { getCurrentUser } from "./session";
import type { Role } from "@prisma/client";
import {
  UnregisteredUserError,
  BlockedUserError,
  InactiveUserError,
} from "./errors";

/**
 * Server-authoritative route guard for portal layouts.
 *
 * Ensures:
 * 1. User holds a valid authenticated Supabase session and active database profile.
 * 2. User role matches the required portal role strictly based on PostgreSQL records.
 * 3. Cross-role access is redirected to the user's authoritative dashboard without loops.
 * 4. Unauthenticated users are redirected to /login.
 */
export async function guardPortalRoute(requiredRole: Role) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch (err: unknown) {
    const maybeRedirect = err as { digest?: string };
    if (typeof maybeRedirect?.digest === "string" && maybeRedirect.digest.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    if (err instanceof UnregisteredUserError) {
      console.warn("[portal-guard] UnregisteredUserError -> redirecting to /login?error=unregistered");
      redirect("/login?error=unregistered");
    }
    if (err instanceof BlockedUserError) {
      console.warn("[portal-guard] BlockedUserError -> redirecting to /login?error=blocked");
      redirect("/login?error=blocked");
    }
    if (err instanceof InactiveUserError) {
      console.warn("[portal-guard] InactiveUserError -> redirecting to /login?error=inactive");
      redirect("/login?error=inactive");
    }
    console.error("[portal-guard] Unexpected error in guardPortalRoute:", err);
    redirect("/login");
  }

  if (!user) {
    console.warn("[portal-guard] guardPortalRoute: No user resolved from session/database -> redirecting to /login");
    redirect("/login");
  }

  if (user.role !== requiredRole) {
    switch (user.role) {
      case "STUDENT":
        redirect("/student/dashboard");
      case "FACULTY":
        redirect("/faculty/dashboard");
      case "MANAGEMENT":
        redirect("/management/dashboard");
      default:
        redirect("/login");
    }
  }

  return user;
}
