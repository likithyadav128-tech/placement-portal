import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/student/mock-tests
 * Returns all published mock tests with student's personalized attempt history.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await withDbRetry(() =>
      prisma.user.findFirst({
        where: {
          OR: [{ authUserId: authUser.id }, { email: authUser.email || "" }],
        },
        include: { student: true },
      })
    );

    if (!dbUser || dbUser.role !== "STUDENT" || !dbUser.student) {
      return NextResponse.json(
        { error: "Student profile not found or unauthorized." },
        { status: 404 }
      );
    }

    const studentId = dbUser.student.id;

    // Fetch published mock tests
    const mockTests = await withDbRetry(() =>
      prisma.mockTest.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        include: {
          attempts: {
            where: { studentId },
            orderBy: { startedAt: "desc" },
          },
        },
      })
    );

    const now = Date.now();
    const result = mockTests.map((t) => {
      const completedAttempts = t.attempts.filter(
        (att) => att.status === "SUBMITTED" || att.status === "EVALUATED"
      );
      const inProgressAttempt = t.attempts.find((att) => {
        if (att.status !== "IN_PROGRESS") return false;
        const elapsed = Math.floor((now - att.startedAt.getTime()) / 1000);
        return elapsed < t.duration * 60;
      });

      let status: "upcoming" | "in_progress" | "completed" = "upcoming";
      let bestScore: number | undefined = undefined;
      let lastAttemptScore: number | undefined = undefined;

      if (completedAttempts.length > 0) {
        status = "completed";
        const scores = completedAttempts
          .map((a) => a.percentage)
          .filter((p): p is number => p !== null && p !== undefined);
        if (scores.length > 0) {
          bestScore = Math.max(...scores);
          lastAttemptScore = completedAttempts[0].percentage ?? undefined;
        }
      } else if (inProgressAttempt) {
        status = "in_progress";
      }

      return {
        id: t.id,
        name: t.name,
        company: t.company,
        category: t.category,
        sections: t.sections,
        duration: t.duration,
        difficulty: t.difficulty,
        totalQuestions: t.totalQuestions,
        description: t.description,
        courseTag: t.courseTag,
        departmentTag: t.departmentTag,
        status,
        bestScore,
        lastAttemptScore,
        attemptsCount: completedAttempts.length,
        activeAttemptId: inProgressAttempt?.id,
        levelsSummary: {
          level1: "Aptitude & Reasoning (10 Questions)",
          level2: "Verbal Ability (10 Questions)",
          level3: "Course Theory (10 Questions)",
          level4: "Live Coding (5 Progressive Problems)",
        },
      };
    });

    return NextResponse.json({ mockTests: result });
  } catch (error) {
    console.error("GET /api/student/mock-tests error:", error);
    return NextResponse.json(
      { error: "Failed to load mock tests." },
      { status: 500 }
    );
  }
}
