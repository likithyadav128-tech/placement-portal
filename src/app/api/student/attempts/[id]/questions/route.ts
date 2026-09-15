import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/student/attempts/[id]/questions
 *
 * Secure question delivery endpoint.
 *
 * SECURITY:
 * 1. Enforces authenticated student session.
 * 2. Blocks IDOR by ensuring attempt.studentId === authenticated student.id.
 * 3. CRITICAL: Never exposes AptitudeQuestion.correctAnswer or explanation to the client.
 * 4. CRITICAL: Filters out hidden test cases for CodingProblem.
 * 5. Returns previous saved answers for uninterrupted state resumption.
 */
export async function GET(
  _req: Request,
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

    // 3. Find Attempt & Validate Ownership (Anti-IDOR)
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: true,
        answers: true,
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
        { error: "Forbidden: You are not authorized to access this assessment attempt." },
        { status: 403 }
      );
    }

    const assessmentType = attempt.assessment.type;
    const elapsedSeconds = Math.floor(
      (Date.now() - attempt.startedAt.getTime()) / 1000
    );
    const durationSeconds = attempt.assessment.duration * 60;
    const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);
    const isExpired = elapsedSeconds >= durationSeconds;

    // 4. Fetch questions based on assessment type
    if (assessmentType === "APTITUDE") {
      const rawQuestions = await prisma.aptitudeQuestion.findMany({
        where: { assessmentId: attempt.assessmentId },
        orderBy: { questionNumber: "asc" },
      });

      // SECURITY: Explicitly sanitize questions - NEVER include correctAnswer or explanation
      const sanitizedQuestions = rawQuestions.map((q) => ({
        id: q.id,
        questionNumber: q.questionNumber,
        category: q.category,
        question: q.question,
        options: q.options,
        marks: q.marks,
      }));

      // Map saved answers
      const savedAnswers: Record<string, number> = {};
      for (const ans of attempt.answers) {
        if (ans.questionId && ans.selectedOption !== null && ans.selectedOption !== undefined) {
          savedAnswers[ans.questionId] = ans.selectedOption;
        }
      }

      return NextResponse.json(
        {
          attempt: {
            id: attempt.id,
            assessmentId: attempt.assessmentId,
            assessmentTitle: attempt.assessment.title,
            type: "aptitude",
            duration: attempt.assessment.duration,
            startedAt: attempt.startedAt.toISOString(),
            status: attempt.status,
            remainingSeconds,
            isExpired,
          },
          questions: sanitizedQuestions,
          savedAnswers,
        },
        { status: 200 }
      );
    } else {
      // CODING or MIXED
      const rawProblems = await prisma.codingProblem.findMany({
        where: { assessmentId: attempt.assessmentId },
        orderBy: { createdAt: "asc" },
      });

      // SECURITY: Sanitize problems - never leak expectedOutput for hidden test cases
      const sanitizedProblems = rawProblems.map((p) => {
        const testCasesArray = Array.isArray(p.testCases)
          ? (p.testCases as Array<{ input: string; expectedOutput: string; hidden?: boolean }>)
          : [];

        const sanitizedTestCases = testCasesArray.map((tc) => {
          if (tc.hidden) {
            return {
              input: tc.input,
              hidden: true,
            };
          }
          return {
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            hidden: false,
          };
        });

        return {
          id: p.id,
          title: p.title,
          difficulty: p.difficulty,
          description: p.description,
          examples: p.examples,
          constraints: p.constraints,
          starterCode: p.starterCode,
          testCases: sanitizedTestCases,
        };
      });

      // Map saved code submissions
      const savedCode: Record<string, string> = {};
      for (const ans of attempt.answers) {
        const problemKey = ans.codingProblemId || ans.questionId;
        if (problemKey && ans.codeSubmission) {
          savedCode[problemKey] = ans.codeSubmission;
        }
      }

      return NextResponse.json(
        {
          attempt: {
            id: attempt.id,
            assessmentId: attempt.assessmentId,
            assessmentTitle: attempt.assessment.title,
            type: "coding",
            duration: attempt.assessment.duration,
            startedAt: attempt.startedAt.toISOString(),
            status: attempt.status,
            remainingSeconds,
            isExpired,
          },
          problems: sanitizedProblems,
          savedCode,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("GET /api/student/attempts/[id]/questions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
