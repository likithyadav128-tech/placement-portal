import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

import { finalizeAttempt } from "@/lib/assessment/finalize";

export const dynamic = "force-dynamic";

/**
 * POST /api/student/assessments/[id]/start
 *
 * Secure endpoint to start or resume an assessment attempt.
 * Server-side identity resolution ensures an attempt can only ever be created for the authenticated student.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assessmentId } = await params;

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

    if (dbUser.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Forbidden: Account is not active." },
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

    // 3. Verify Assessment exists and is PUBLISHED
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: {
        id: true,
        title: true,
        type: true,
        duration: true,
        totalQuestions: true,
        difficulty: true,
        status: true,
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found." },
        { status: 404 }
      );
    }

    if (assessment.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Assessment is not published or currently unavailable." },
        { status: 403 }
      );
    }

    // 4. Check for existing active attempt (resumption support)
    const existingActiveAttempt = await prisma.assessmentAttempt.findFirst({
      where: {
        assessmentId: assessment.id,
        studentId: student.id,
        status: "IN_PROGRESS",
      },
      orderBy: { startedAt: "desc" },
    });

    if (existingActiveAttempt) {
      const elapsedSeconds = Math.floor(
        (Date.now() - existingActiveAttempt.startedAt.getTime()) / 1000
      );
      const totalSeconds = assessment.duration * 60;

      if (elapsedSeconds < totalSeconds) {
        return NextResponse.json(
          {
            attempt: {
              id: existingActiveAttempt.id,
              assessmentId: assessment.id,
              assessmentTitle: assessment.title,
              type: assessment.type.toLowerCase(),
              duration: assessment.duration,
              totalQuestions: assessment.totalQuestions,
              startedAt: existingActiveAttempt.startedAt.toISOString(),
              status: existingActiveAttempt.status,
              isResumed: true,
              remainingSeconds: totalSeconds - elapsedSeconds,
            },
          },
          { status: 200 }
        );
      } else {
        // Attempt expired while in IN_PROGRESS state.
        // Auto-finalize it cleanly so it does not linger indefinitely.
        await finalizeAttempt(existingActiveAttempt.id, student.id);
        // Proceed to create a fresh attempt for the student
      }
    }

    // 5. Create a new attempt
    const newAttempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId: assessment.id,
        studentId: student.id,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        attempt: {
          id: newAttempt.id,
          assessmentId: assessment.id,
          assessmentTitle: assessment.title,
          type: assessment.type.toLowerCase(),
          duration: assessment.duration,
          totalQuestions: assessment.totalQuestions,
          startedAt: newAttempt.startedAt.toISOString(),
          status: newAttempt.status,
          isResumed: false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/student/assessments/[id]/start error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
