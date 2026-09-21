import { headers } from "next/headers";
import { createClient as createDirectClient, type User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "../supabase/server";
import { prisma, withDbRetry } from "../prisma";
import type { User as DbUser } from "@prisma/client";
import {
  UnauthorizedError,
  UnregisteredUserError,
  BlockedUserError,
  InactiveUserError,
} from "./errors";

export interface AuthenticatedSession {
  authUserId: string;
  email: string;
  user: DbUser;
}

/**
 * Resolves the authenticated Supabase user and their corresponding
 * application database profile and role.
 *
 * Supports:
 * 1. Supabase SSR cookies (via createClient)
 * 2. Authorization: Bearer <token> fallback header
 *
 * Enforces:
 * 1. Valid Supabase session
 * 2. Existing application User record
 * 3. User status validation (ACTIVE vs BLOCKED vs INACTIVE)
 */
export async function getCurrentUser(): Promise<DbUser | null> {
  try {
    let authUser: SupabaseUser | null = null;
    let authError: Error | null = null;

    // 1. Primary auth check: Supabase server-side cookies
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        authUser = data.user;
      } else if (error) {
        authError = error;
      }
    } catch (cookieErr) {
      console.warn("[session:getCurrentUser] Cookie client exception:", cookieErr);
    }

    // 2. Secondary auth check: Authorization Bearer header
    if (!authUser) {
      try {
        let headerStore: Awaited<ReturnType<typeof headers>> | null = null;
        try {
          headerStore = await headers();
        } catch {
          // May throw outside request context
        }
        const authHeader = headerStore?.get("authorization") || headerStore?.get("Authorization");
        if (authHeader?.trim().toLowerCase().startsWith("bearer ")) {
          const token = authHeader.trim().slice(7).trim();
          const supabaseUrl =
            process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project")
              ? process.env.NEXT_PUBLIC_SUPABASE_URL
              : "https://zfouzydarrtqfmrqjvsd.supabase.co";
          const supabaseAnonKey =
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder-anon")
              ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
              : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmb3V6eWRhcnJ0cWZtcnFqdnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTQ3MzcsImV4cCI6MjEwNDYzMDczN30.juQ-vhvvKx3AysRrRmEZkz5C4dU7TWwh52l8EfvN0QE";

          const directClient = createDirectClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data, error } = await directClient.auth.getUser(token);
          if (!error && data?.user) {
            authUser = data.user;
          } else if (error) {
            console.warn("[session:getCurrentUser] Bearer token auth error:", error.message);
          }
        }
      } catch (bearerErr) {
        console.warn("[session:getCurrentUser] Bearer auth exception:", bearerErr);
      }
    }

    if (!authUser) {
      if (authError) {
        console.log("[session:getCurrentUser] No authenticated user. Last cookie error:", authError.message);
      }
      return null;
    }

    // Look up application user by Supabase Auth UID or verified email with automatic retry on transient pooler drops
    const dbUser = await withDbRetry(() =>
      prisma.user.findFirst({
        where: {
          OR: [
            { authUserId: authUser.id },
            { email: authUser.email },
          ],
        },
        include: {
          student: true,
          faculty: true,
        },
      })
    );

    if (!dbUser) {
      console.warn(`[session:getCurrentUser] UnregisteredUserError: No db record for authUserId=${authUser.id} email=${authUser.email}`);
      throw new UnregisteredUserError();
    }

    if (dbUser.status === "BLOCKED") {
      console.warn(`[session:getCurrentUser] BlockedUserError: User ${dbUser.id} is BLOCKED`);
      throw new BlockedUserError();
    }

    if (dbUser.status === "INACTIVE") {
      console.warn(`[session:getCurrentUser] InactiveUserError: User ${dbUser.id} is INACTIVE`);
      throw new InactiveUserError();
    }

    // Link authUserId if matching on email during first login
    if (!dbUser.authUserId && authUser.id) {
      await withDbRetry(() =>
        prisma.user.update({
          where: { id: dbUser.id },
          data: {
            authUserId: authUser.id,
            lastLoginAt: new Date(),
          },
        })
      );
    }

    return dbUser;
  } catch (error) {
    if (
      error instanceof UnregisteredUserError ||
      error instanceof BlockedUserError ||
      error instanceof InactiveUserError
    ) {
      throw error;
    }
    console.error("[session:getCurrentUser] Database or session lookup error:", error);
    return null;
  }
}

/**
 * Strictly requires an authenticated user session.
 * Throws UnauthorizedError if no valid session exists.
 */
export async function requireAuthUser(): Promise<DbUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}
