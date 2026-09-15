import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/student/attempts/[id]/answer
 *
 * Secure incremental answer autosaving endpoint.
 *
 * Requirements:
 * 1. Enforces student session and attempt ownership (Anti-IDOR).
 * 2. Enforces attempt immutability: rejects edits if attempt is already SUBMITTED or EVALUATED.
 * 3. Validates question membership to the attempt's assessment.
 * 4. Validates input values (bounds checking on option indices).
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
      include: { assessment: true },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Assessment attempt not found." },
        { status: 404 }
      );
    }

    if (attempt.studentId !== student.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to modify this attempt." },
        { status: 403 }
      );
    }

    // 4. Enforce attempt immutability
    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Forbidden: Cannot modify an attempt that has already been submitted or completed." },
        { status: 403 }
      );
    }

    // 4b. Enforce assessment duration expiry
    const elapsedSeconds = Math.floor(
      (Date.now() - attempt.startedAt.getTime()) / 1000
    );
    const durationSeconds = attempt.assessment.duration * 60;
    if (elapsedSeconds > durationSeconds + 5) {
      return NextResponse.json(
        { error: "Assessment time has expired. Further answer submissions are blocked." },
        { status: 403 }
      );
    }

    // 5. Parse and validate request body
    const body = (await req.json().catch(() => null)) as {
      questionId?: string;
      problemId?: string;
      codingProblemId?: string;
      selectedOption?: number;
      codeSubmission?: string;
    } | null;

    const targetId = body?.codingProblemId || body?.problemId || body?.questionId;

    if (!body || typeof targetId !== "string") {
      return NextResponse.json(
        { error: "Invalid request payload: questionId or codingProblemId is required." },
        { status: 400 }
      );
    }

    const { selectedOption, codeSubmission } = body;

    // 6. Validate question belongs to attempt's assessment
    if (attempt.assessment.type === "APTITUDE") {
      const question = await prisma.aptitudeQuestion.findFirst({
        where: {
          id: targetId,
          assessmentId: attempt.assessmentId,
        },
      });

      if (!question) {
        return NextResponse.json(
          { error: "Question does not belong to this assessment." },
          { status: 400 }
        );
      }

      if (
        selectedOption !== undefined &&
        (typeof selectedOption !== "number" ||
          !Number.isInteger(selectedOption) ||
          selectedOption < 0 ||
          selectedOption >= question.options.length)
      ) {
        return NextResponse.json(
          { error: "Invalid selectedOption: must be a valid integer option index." },
          { status: 400 }
        );
      }

      // Upsert answer
      const existingAnswer = await prisma.assessmentAnswer.findFirst({
        where: {
          attemptId: attempt.id,
          questionId: question.id,
        },
      });

      if (existingAnswer) {
        await prisma.assessmentAnswer.update({
          where: { id: existingAnswer.id },
          data: {
            selectedOption: selectedOption ?? null,
            answeredAt: new Date(),
          },
        });
      } else {
        await prisma.assessmentAnswer.create({
          data: {
            attemptId: attempt.id,
            questionId: question.id,
            selectedOption: selectedOption ?? null,
            answeredAt: new Date(),
          },
        });
      }
    } else {
      // CODING or MIXED
      const problem = await prisma.codingProblem.findFirst({
        where: {
          id: targetId,
          assessmentId: attempt.assessmentId,
        },
      });

      if (!problem) {
        return NextResponse.json(
          { error: "Coding problem does not belong to this assessment." },
          { status: 400 }
        );
      }

      if (codeSubmission !== undefined && typeof codeSubmission !== "string") {
        return NextResponse.json(
          { error: "Invalid codeSubmission: must be a string." },
          { status: 400 }
        );
      }

      // Upsert answer using codingProblemId
      const existingAnswer = await prisma.assessmentAnswer.findFirst({
        where: {
          attemptId: attempt.id,
          codingProblemId: problem.id,
        },
      });

      if (existingAnswer) {
        await prisma.assessmentAnswer.update({
          where: { id: existingAnswer.id },
          data: {
            codeSubmission: codeSubmission ?? null,
            answeredAt: new Date(),
          },
        });
      } else {
        await prisma.assessmentAnswer.create({
          data: {
            attemptId: attempt.id,
            codingProblemId: problem.id,
            codeSubmission: codeSubmission ?? null,
            answeredAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("POST /api/student/attempts/[id]/answer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
