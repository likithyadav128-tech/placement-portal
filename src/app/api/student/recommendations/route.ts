import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { syncRecommendationsForStudent } from "@/lib/recommendations/recommendationEngine";
import { Priority } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/student/recommendations
 *
 * Secure server-side endpoint returning personalized, prioritized recommendations
 * for the authenticated student based on real performance metrics.
 *
 * Enforces:
 * 1. Valid Supabase session from HTTP cookies.
 * 2. Resolves auth.users.id -> public.User -> public.Student.
 * 3. Anti-IDOR: Never accepts studentId from client params or request body.
 * 4. RBAC: Restricted to STUDENT role.
 * 5. Idempotent synchronization on real PostgreSQL data.
 * 6. Zero mock data fallbacks.
 */
export async function GET() {
  try {
    // 1. Authenticate Supabase session
    let authUser = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!authError && user) {
        authUser = user;
      }
    } catch (sessionError) {
      console.warn("Session error on student recommendations:", sessionError);
    }

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Resolve User & Student record
    let dbUser = await prisma.user.findUnique({
      where: { authUserId: authUser.id },
      include: { student: true },
    });

    if (!dbUser && authUser.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: authUser.email },
        include: { student: true },
      });
    }

    if (!dbUser) {
      return NextResponse.json(
        { error: "User record not found in application database." },
        { status: 404 }
      );
    }

    if (dbUser.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Forbidden: Access restricted to student accounts." },
        { status: 403 }
      );
    }

    const student = dbUser.student;
    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found." },
        { status: 404 }
      );
    }

    // 3. Synchronize recommendations idempotently based on latest real student performance
    const recommendations = await syncRecommendationsForStudent(student.id);

    // 4. Return serialized recommendations
    const priorityRank: Record<Priority, number> = {
      [Priority.HIGH]: 1,
      [Priority.MEDIUM]: 2,
      [Priority.LOW]: 3,
    };

    const categoryRank: Record<string, number> = {
      Coding: 1,
      Aptitude: 2,
      Communication: 3,
      Assessment: 4,
      "Placement Readiness": 5,
    };

    const sorted = [...recommendations].sort((a, b) => {
      const pDiff = priorityRank[a.priority] - priorityRank[b.priority];
      if (pDiff !== 0) return pDiff;
      return (categoryRank[a.category] || 99) - (categoryRank[b.category] || 99);
    });

    return NextResponse.json(
      {
        recommendations: sorted.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          reason: r.reason,
          priority: r.priority,
          expectedBenefit: r.expectedBenefit,
          category: r.category,
          actionLabel: r.actionLabel,
          actionUrl: r.actionUrl,
          createdAt: r.createdAt.toISOString(),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/student/recommendations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
