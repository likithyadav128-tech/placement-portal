import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

import { finalizeAttempt } from "@/lib/assessment/finalize";

export const dynamic = "force-dynamic";

/**
 * POST /api/student/attempts/[id]/submit
 *
 * Secure assessment submission and server-side evaluation endpoint.
 *
 * Requirements:
 * 1. Enforces student session and attempt ownership.
 * 2. Enforces attempt immutability (cannot re-submit already submitted attempt).
 * 3. Server-side grading for Aptitude:
 *    - Compares answers against AptitudeQuestion.correctAnswer stored in database.
 *    - Grades each answer and updates scoreAwarded and isCorrect.
 *    - Computes total score, percentage, and time spent (capped to assessment duration).
 * 4. Coding Submission:
 *    - Records submissions safely without executing arbitrary untrusted code in the application worker.
 *    - Clearly preserves SUBMITTED status.
 * 5. Performance Integration:
 *    - Generates an immutable PerformanceRecord for the student.
 *    - Updates Student overallScore, skillScore, and placementReadiness.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params;

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

    if (!dbUser || !dbUser.student) {
      return NextResponse.json(
        { error: "Student profile not found." },
        { status: 404 }
      );
    }

    const student = dbUser.student;

    // 3. Find Attempt & Validate Ownership
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: true,
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Assessment attempt not found." },
        { status: 404 }
      );
    }

    if (attempt.studentId !== student.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to submit this attempt." },
        { status: 403 }
      );
    }

    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Forbidden: This attempt has already been submitted." },
        { status: 403 }
      );
    }

    // Parse optional testResults from request body
    const body = (await req.json().catch(() => null)) as {
      testResults?: Record<string, Array<{ input: string; actualOutput: string }>>;
    } | null;

    // 4. Finalize Attempt via Centralized Engine
    const result = await finalizeAttempt(attempt.id, student.id, body?.testResults);

    return NextResponse.json(
      {
        success: true,
        attempt: {
          id: result.id,
          status: result.status,
          score: result.score,
          maxScore: result.maxScore,
          percentage: result.percentage,
          timeSpent: result.timeSpent,
          submittedAt: result.submittedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/student/attempts/[id]/submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
