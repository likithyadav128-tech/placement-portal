import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/student/assessments
 *
 * Secure endpoint to fetch real published assessments for authenticated students.
 * Scopes attempt status and bestScore strictly to the authenticated student.
 */
export async function GET() {
  try {
    // 1. Authenticate user from cookie session
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
    } catch {
      // Unauthenticated context
    }

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Resolve User & Student
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
        { error: "Forbidden: Access restricted to students." },
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

    // 3. Query all PUBLISHED assessments
    const assessments = await prisma.assessment.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      include: {
        attempts: {
          where: { studentId: student.id },
          orderBy: { startedAt: "desc" },
        },
      },
    });

    // 4. Map assessments with student's personalized attempt state
    const result = assessments.map((a) => {
      const now = Date.now();
      const completedAttempts = a.attempts.filter(
        (att) => att.status === "SUBMITTED" || att.status === "EVALUATED"
      );
      const inProgressAttempt = a.attempts.find((att) => {
        if (att.status !== "IN_PROGRESS") return false;
        const elapsedSeconds = Math.floor(
          (now - att.startedAt.getTime()) / 1000
        );
        return elapsedSeconds < a.duration * 60;
      });

      let status: "upcoming" | "in_progress" | "completed" = "upcoming";
      let bestScore: number | undefined = undefined;
      let activeAttemptId: string | undefined = undefined;

      if (completedAttempts.length > 0) {
        status = "completed";
        bestScore = Math.max(
          ...completedAttempts.map((att) => Math.round(att.percentage || 0))
        );
      } else if (inProgressAttempt) {
        status = "in_progress";
        activeAttemptId = inProgressAttempt.id;
      }

      return {
        id: a.id,
        title: a.title,
        type: a.type.toLowerCase(), // "coding" | "aptitude" | "mixed"
        difficulty: a.difficulty,
        duration: a.duration,
        totalQuestions: a.totalQuestions,
        status,
        bestScore,
        activeAttemptId,
        description: a.description,
        createdAt: a.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ assessments: result }, { status: 200 });
  } catch (error) {
    console.error("GET /api/student/assessments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
