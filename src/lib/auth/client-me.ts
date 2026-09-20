import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types";

export interface AuthMeResult {
  user: User | null;
  status: number;
  error?: string;
  ok: boolean;
}

/**
 * Shared client-side helper to fetch the authenticated user profile from /api/auth/me.
 *
 * Guarantees:
 * 1. Resolves access token from parameter or active Supabase session.
 * 2. If no session/access_token exists, safely returns unauthenticated (401) without
 *    firing a failing, unauthorized network request.
 * 3. Sends `Authorization: Bearer ${accessToken}` and `Content-Type: application/json`
 *    with `cache: 'no-store'`.
 * 4. Retries once on transient 500 (e.g. database pooler reconnect).
 * 5. Never leaks secrets or accepts anon key as Bearer token.
 */
export async function fetchAuthMe(
  providedToken?: string | null
): Promise<AuthMeResult> {
  const supabase = createClient();
  let accessToken = providedToken;

  if (!accessToken) {
    try {
      const { data } = await supabase.auth.getSession();
      accessToken = data?.session?.access_token || null;
    } catch {
      accessToken = null;
    }
  }

  // If unauthenticated, do NOT fire a failing request to /api/auth/me without an Authorization header
  if (!accessToken) {
    return {
      user: null,
      status: 401,
      error: "Unauthorized: No active session or access token available.",
      ok: false,
    };
  }

  const executeFetch = async () => {
    return fetch("/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
  };

  try {
    let response = await executeFetch();

    // If server returned transient 500 (e.g. pooler reconnect), retry once after a short delay
    if (response.status === 500) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      response = await executeFetch();
    }

    const data = (await response.json().catch(() => ({}))) as {
      user?: User;
      error?: string;
    };

    return {
      user: data.user || null,
      status: response.status,
      error: data.error,
      ok: response.ok && Boolean(data.user),
    };
  } catch (err: unknown) {
    return {
      user: null,
      status: 0,
      error:
        err instanceof Error
          ? err.message
          : "Network error occurred while fetching user profile.",
      ok: false,
    };
  }
}
