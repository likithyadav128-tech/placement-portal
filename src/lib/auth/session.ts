import { createClient } from "../supabase/server";
import { prisma } from "../prisma";
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
 * Enforces:
 * 1. Valid Supabase session
 * 2. Existing application User record (prevents unregistered Microsoft accounts)
 * 3. User status validation (ACTIVE vs BLOCKED vs INACTIVE)
 */
export async function getCurrentUser(): Promise<DbUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return null;
    }

    // Look up application user by Supabase Auth UID or verified email
    const dbUser = await prisma.user.findFirst({
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
    });

    if (!dbUser) {
      throw new UnregisteredUserError();
    }

    if (dbUser.status === "BLOCKED") {
      throw new BlockedUserError();
    }

    if (dbUser.status === "INACTIVE") {
      throw new InactiveUserError();
    }

    // Link authUserId if matching on email during first Microsoft login
    if (!dbUser.authUserId && authUser.id) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          authUserId: authUser.id,
          lastLoginAt: new Date(),
        },
      });
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
    // In dev mock mode or when database is offline, return null
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
