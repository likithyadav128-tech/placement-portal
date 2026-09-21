import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const diag: Record<string, unknown> = {};

  // 1. Raw request headers
  const reqCookie = req.headers.get("cookie");
  diag.hasReqCookie = Boolean(reqCookie);
  diag.reqCookieLen = reqCookie?.length ?? 0;

  // 2. next/headers
  try {
    const h = await headers();
    const hCookie = h.get("cookie");
    diag.hasHeaderStoreCookie = Boolean(hCookie);
    diag.headerStoreCookieLen = hCookie?.length ?? 0;
  } catch (err: unknown) {
    diag.headersError = err instanceof Error ? err.message : String(err);
  }

  // 3. next/cookies
  try {
    const c = await cookies();
    const all = c.getAll();
    diag.cookieStoreCount = all.length;
    diag.cookieStoreNames = all.map((x) => x.name);
  } catch (err: unknown) {
    diag.cookiesError = err instanceof Error ? err.message : String(err);
  }

  // 4. Supabase createClient() (default, no args)
  try {
    const sDefault = await createServerSupabase();
    const { data: dDefault, error: eDefault } = await sDefault.auth.getUser();
    diag.defaultClientSuccess = !eDefault && Boolean(dDefault?.user);
    diag.defaultClientUserId = dDefault?.user?.id ?? null;
    diag.defaultClientError = eDefault?.message ?? null;
  } catch (err: unknown) {
    diag.defaultClientException = err instanceof Error ? err.message : String(err);
  }

  // 5. Supabase createClient(reqCookie)
  if (reqCookie) {
    try {
      const sCustom = await createServerSupabase(reqCookie);
      const { data: dCustom, error: eCustom } = await sCustom.auth.getUser();
      diag.customClientSuccess = !eCustom && Boolean(dCustom?.user);
      diag.customClientUserId = dCustom?.user?.id ?? null;
      diag.customClientError = eCustom?.message ?? null;
    } catch (err: unknown) {
      diag.customClientException = err instanceof Error ? err.message : String(err);
    }
  }

  // 6. getCurrentUser()
  try {
    const currentUser = await getCurrentUser();
    diag.getCurrentUserSuccess = Boolean(currentUser);
    diag.getCurrentUserRole = currentUser?.role ?? null;
    diag.getCurrentUserEmail = currentUser?.email ?? null;
  } catch (err: unknown) {
    diag.getCurrentUserException = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(diag);
}
