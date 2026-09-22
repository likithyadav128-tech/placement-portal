import { NextResponse } from "next/server";
import { requireRole, requireFacultyAccessToStudent } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatSeconds(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins} min`;
  return `${mins}m ${secs}s`;
}

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string; studentId: string }> }
) {
  try {
    await requireRole(["FACULTY", "MANAGEMENT"]);
    const { id: assessmentId, studentId } = await props.params;

    // Enforce Anti-IDOR: faculty can only view students assigned to them
    await requireFacultyAccessToStudent(studentId);

    // Get student profile
    const student = await withDbRetry(() =>
      prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: { select: { name: true, email: true, avatarUrl: true } },
        },
      })
    );

    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    // Get assessment details
    const assessment = await withDbRetry(() =>
      prisma.assessment.findUnique({
        where: { id: assessmentId },
        select: {
          id: true,
          title: true,
          type: true,
          year: true,
          branch: true,
          maxMarks: true,
          duration: true,
        },
      })
    );

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
    }

    // Get student attempt with answers
    const attempt = await withDbRetry(() =>
      prisma.assessmentAttempt.findFirst({
        where: {
          assessmentId,
          studentId,
          status: { in: ["SUBMITTED", "EVALUATED"] },
        },
        orderBy: { score: "desc" },
        include: {
          answers: {
            include: {
              question: {
                select: {
                  id: true,
                  questionNumber: true,
                  question: true,
                  options: true,
                  correctAnswer: true,
                  category: true,
                  marks: true,
                  explanation: true,
                },
              },
              codingProblem: {
                select: {
                  id: true,
                  title: true,
                  difficulty: true,
                  description: true,
                },
              },
            },
            orderBy: { answeredAt: "asc" },
          },
        },
      })
    );

    if (!attempt) {
      return NextResponse.json({
        student: {
          id: student.id,
          name: student.user.name,
          email: student.user.email,
          rollNumber: student.rollNumber,
          department: student.department,
          year: student.year,
        },
        assessment,
        attempt: null,
        message: "No submitted attempt found for this student.",
      });
    }

    const pct = attempt.percentage !== null ? Math.round(attempt.percentage * 10) / 10 : 0;
    const score = attempt.score !== null ? Math.round(attempt.score * 10) / 10 : 0;

    let resultStatus: "Passed" | "Failed" | "Needs Attention" = "Passed";
    if (pct < 50) {
      resultStatus = "Needs Attention";
    } else if (pct < 60) {
      resultStatus = "Failed";
    }

    // Breakdown answers
    const answers = attempt.answers.map((a) => {
      if (a.question) {
        return {
          type: "aptitude",
          questionNumber: a.question.questionNumber,
          question: a.question.question,
          options: a.question.options,
          selectedOption: a.selectedOption,
          correctAnswer: a.question.correctAnswer,
          isCorrect: a.isCorrect,
          scoreAwarded: a.scoreAwarded,
          maxMarks: a.question.marks,
          category: a.question.category,
          explanation: a.question.explanation,
        };
      }
      if (a.codingProblem) {
        return {
          type: "coding",
          problemTitle: a.codingProblem.title,
          difficulty: a.codingProblem.difficulty,
          codeSubmission: a.codeSubmission,
          isCorrect: a.isCorrect,
          scoreAwarded: a.scoreAwarded,
        };
      }
      return {
        type: "general",
        isCorrect: a.isCorrect,
        scoreAwarded: a.scoreAwarded,
      };
    });

    const correctCount = answers.filter((a) => a.isCorrect === true).length;
    const wrongCount = answers.filter((a) => a.isCorrect === false).length;

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        avatarUrl: student.user.avatarUrl,
        rollNumber: student.rollNumber,
        department: student.department,
        year: student.year,
      },
      assessment,
      attempt: {
        id: attempt.id,
        score,
        percentage: pct,
        status: resultStatus,
        attemptStatus: attempt.status,
        startedAt: attempt.startedAt.toISOString(),
        submittedAt: attempt.submittedAt ? attempt.submittedAt.toISOString() : null,
        timeTaken: formatSeconds(attempt.timeSpent),
        timeSpentSeconds: attempt.timeSpent,
        correctCount,
        wrongCount,
        totalAnswered: answers.length,
        answers,
      },
    });
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string; status?: number };
    if (error.name === "ForbiddenError" || error.status === 403) {
      return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/faculty/assessments/[id]/results/[studentId] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
