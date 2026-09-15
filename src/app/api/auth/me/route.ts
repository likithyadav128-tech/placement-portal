import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/me
 *
 * Secure server-side identity resolver endpoint.
 *
 * Requirements:
 * 1. Validates the session cookie via Supabase server-side client (never accepts client-supplied identity).
 * 2. Maps auth.users.id -> public.User.authUserId.
 * 3. Returns safe application-user information only (no secrets, tokens, or mock fallback).
 * 4. Responds with 401 if unauthenticated, 404/403 if no application record exists or if account is inactive/blocked.
 */
export async function GET(request?: Request) {
  try {
    // 1. Obtain authenticated Supabase user from secure cookie session
    let authUser = null;
    let supabaseClient = null;
    try {
      supabaseClient = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabaseClient.auth.getUser();

      if (!authError && user) {
        authUser = user;
      }
    } catch (e) {
      console.error("GET /api/auth/me supabase session error:", e);
    }

    // Fallback: If cookie session wasn't found or was partitioned, check Authorization header
    if (!authUser && request) {
      try {
        const authHeader = request.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
          if (supabaseClient) {
            const { data: tokenData, error: tokenError } =
              await supabaseClient.auth.getUser(token);
            if (!tokenError && tokenData.user) {
              authUser = tokenData.user;
            }
          }
        }
      } catch (tokenErr) {
        console.error("GET /api/auth/me bearer token error:", tokenErr);
      }
    }

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userSelection = {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      avatarUrl: true,
      status: true,
      student: {
        select: {
          id: true,
          rollNumber: true,
          department: true,
          year: true,
          graduationYear: true,
          phone: true,
          skills: true,
          placementReadiness: true,
          overallScore: true,
          codingScore: true,
          aptitudeScore: true,
          reasoningScore: true,
          communicationScore: true,
          trend: true,
          status: true,
        },
      },
      faculty: {
        select: {
          id: true,
          employeeId: true,
          department: true,
          designation: true,
          status: true,
        },
      },
    };

    // 2. Resolve application User record in PostgreSQL using authUserId as primary mapping
    let dbUser = await withDbRetry(() =>
      prisma.user.findUnique({
        where: {
          authUserId: authUser.id,
        },
        select: userSelection,
      })
    );

    // Fallback lookup: if authUserId not yet set, check verified email
    if (!dbUser && authUser.email) {
      const userByEmail = await withDbRetry(() =>
        prisma.user.findUnique({
          where: {
            email: authUser.email,
          },
          select: {
            ...userSelection,
            authUserId: true,
          },
        })
      );

      if (userByEmail && !userByEmail.authUserId) {
        // Link the authUserId to the existing application record
        await withDbRetry(() =>
          prisma.user.update({
            where: { id: userByEmail.id },
            data: {
              authUserId: authUser.id,
              lastLoginAt: new Date(),
            },
          })
        );

        dbUser = {
          id: userByEmail.id,
          name: userByEmail.name,
          email: userByEmail.email,
          role: userByEmail.role,
          department: userByEmail.department,
          avatarUrl: userByEmail.avatarUrl,
          status: userByEmail.status,
          student: userByEmail.student,
          faculty: userByEmail.faculty,
        };
      }
    }

    // 3. If no matching User record exists, reject without mock data
    if (!dbUser) {
      return NextResponse.json(
        {
          error: "User record not found in application database. Please contact your institution administrator.",
        },
        { status: 404 }
      );
    }

    // 4. Validate user status
    if (dbUser.status === "BLOCKED") {
      return NextResponse.json(
        { error: "Your account has been suspended or blocked." },
        { status: 403 }
      );
    }

    if (dbUser.status === "INACTIVE") {
      return NextResponse.json(
        { error: "Your account is currently inactive." },
        { status: 403 }
      );
    }

    // 5. Return sanitized application user profile (strictly real data)
    return NextResponse.json(
      {
        user: {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          department: dbUser.department,
          avatarUrl: dbUser.avatarUrl,
          student: dbUser.student,
          faculty: dbUser.faculty,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
