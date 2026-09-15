import { prisma } from "@/lib/prisma";
import { syncRecommendationsForStudent } from "@/lib/recommendations/recommendationEngine";

export interface FinalizeResult {
  id: string;
  status: string;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  timeSpent: number;
  submittedAt: string | null;
}

function normalizeCompare(actual: string, expected: string): boolean {
  if (typeof actual !== "string" || typeof expected !== "string") return false;
  const a = actual.trim();
  const e = expected.trim();
  if (a === e) return true;
  if (a.toLowerCase() === e.toLowerCase()) return true;

  const aNoSpace = a.replace(/\s+/g, "");
  const eNoSpace = e.replace(/\s+/g, "");
  if (aNoSpace === eNoSpace) return true;

  try {
    const jsonA = JSON.parse(a);
    const jsonE = JSON.parse(e);
    if (JSON.stringify(jsonA) === JSON.stringify(jsonE)) return true;

    if (Array.isArray(jsonA) && Array.isArray(jsonE) && jsonA.length === jsonE.length) {
      if (jsonA.length === 2 && typeof jsonA[0] === "number") {
        const sortedA = [...jsonA].sort((x, y) => x - y);
        const sortedE = [...jsonE].sort((x, y) => x - y);
        if (JSON.stringify(sortedA) === JSON.stringify(sortedE)) return true;
      }
    }
  } catch {
    // not JSON
  }
  return false;
}

async function updateStudentAggregates(studentId: string, now: Date) {
  const allRecords = await prisma.performanceRecord.findMany({
    where: { studentId },
    orderBy: { completedAt: "asc" },
  });

  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });
  if (!student) return;

  // Group by distinct assessment (sourceId) and take the highest percentage
  const bestByAssessment = new Map<
    string,
    { percentage: number; skillArea: string }
  >();

  for (const r of allRecords) {
    if (!r.sourceId) continue;
    const existing = bestByAssessment.get(r.sourceId);
    if (!existing || r.percentage > existing.percentage) {
      bestByAssessment.set(r.sourceId, {
        percentage: r.percentage,
        skillArea: r.skillArea,
      });
    }
  }

  const distinctAssessments = Array.from(bestByAssessment.values());
  const overallAvg =
    distinctAssessments.length > 0
      ? Math.round(
          distinctAssessments.reduce((sum, a) => sum + a.percentage, 0) /
            distinctAssessments.length
        )
      : 0;

  const aptitudeAssessments = distinctAssessments.filter(
    (a) => a.skillArea.toLowerCase() === "aptitude"
  );
  const aptitudeAvg =
    aptitudeAssessments.length > 0
      ? Math.round(
          aptitudeAssessments.reduce((sum, a) => sum + a.percentage, 0) /
            aptitudeAssessments.length
        )
      : student.aptitudeScore;

  const codingAssessments = distinctAssessments.filter(
    (a) => a.skillArea.toLowerCase() === "coding"
  );
  const codingAvg =
    codingAssessments.length > 0
      ? Math.round(
          codingAssessments.reduce((sum, a) => sum + a.percentage, 0) /
            codingAssessments.length
        )
      : student.codingScore;

  await prisma.student.update({
    where: { id: studentId },
    data: {
      overallScore: overallAvg,
      aptitudeScore: aptitudeAvg,
      codingScore: codingAvg,
      placementReadiness: overallAvg,
      trend: overallAvg >= student.overallScore ? "improving" : "declining",
      lastActivity: now,
    },
  });
}

/**
 * Finalizes an assessment attempt by scoring answers, enforcing duration bounds,
 * persisting PerformanceRecords, and transitioning attempt status to SUBMITTED.
 *
 * Guaranteed Properties:
 * 1. Idempotent & Immutable: Once SUBMITTED, will not re-grade or overwrite.
 * 2. Capped Duration: timeSpent will never exceed assessment.duration * 60 seconds.
 * 3. Server-side Scoring: Aptitude tests are scored against AptitudeQuestion.correctAnswer.
 *    Coding tests are evaluated server-side against secret expected outputs stored in PostgreSQL.
 * 4. Performance Integration: Inserts an immutable PerformanceRecord and updates student aggregates.
 */
export async function finalizeAttempt(
  attemptId: string,
  studentId?: string,
  clientTestResults?: Record<string, Array<{ input: string; actualOutput: string }>>
): Promise<FinalizeResult> {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: true,
      answers: true,
      student: true,
    },
  });

  if (!attempt) {
    throw new Error("Assessment attempt not found.");
  }

  if (studentId && attempt.studentId !== studentId) {
    throw new Error("Forbidden: Attempt does not belong to the student.");
  }

  // If already submitted/evaluated, return existing results without re-evaluating
  if (attempt.status !== "IN_PROGRESS") {
    return {
      id: attempt.id,
      status: attempt.status,
      score: attempt.score,
      maxScore: attempt.assessment.type === "APTITUDE" ? attempt.assessment.totalQuestions : 100,
      percentage: attempt.percentage,
      timeSpent: attempt.timeSpent ?? attempt.assessment.duration * 60,
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
    };
  }

  const now = new Date();
  const rawElapsed = Math.max(
    0,
    Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000)
  );
  const maxDurationSeconds = attempt.assessment.duration * 60;
  const timeSpentSeconds = Math.min(rawElapsed, maxDurationSeconds);
  const month = now.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  if (attempt.assessment.type === "APTITUDE") {
    const questions = await prisma.aptitudeQuestion.findMany({
      where: { assessmentId: attempt.assessmentId },
    });

    let totalEarned = 0;
    let totalPossible = 0;

    for (const q of questions) {
      totalPossible += q.marks;
      const studentAnswer = attempt.answers.find((a) => a.questionId === q.id);

      if (studentAnswer && studentAnswer.selectedOption !== null && studentAnswer.selectedOption !== undefined) {
        const isCorrect = studentAnswer.selectedOption === q.correctAnswer;
        const scoreAwarded = isCorrect ? q.marks : 0;
        totalEarned += scoreAwarded;

        await prisma.assessmentAnswer.update({
          where: { id: studentAnswer.id },
          data: {
            isCorrect,
            scoreAwarded,
          },
        });
      }
    }

    const percentage =
      totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;

    // Update attempt
    const updatedAttempt = await prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "SUBMITTED",
        submittedAt: now,
        score: totalEarned,
        percentage,
        timeSpent: timeSpentSeconds,
      },
    });

    // Create immutable PerformanceRecord
    await prisma.performanceRecord.create({
      data: {
        studentId: attempt.studentId,
        sourceType: "ASSESSMENT",
        sourceId: attempt.assessmentId,
        title: attempt.assessment.title,
        score: totalEarned,
        maxScore: totalPossible,
        percentage,
        skillArea: "aptitude",
        month,
        completedAt: now,
      },
    });

    await updateStudentAggregates(attempt.studentId, now);

    // Isolate recommendation sync so it never rolls back a finalized assessment attempt
    try {
      await syncRecommendationsForStudent(attempt.studentId);
    } catch (recErr) {
      console.error("Failed to sync recommendations following attempt finalization:", recErr);
    }

    return {
      id: updatedAttempt.id,
      status: updatedAttempt.status,
      score: totalEarned,
      maxScore: totalPossible,
      percentage,
      timeSpent: timeSpentSeconds,
      submittedAt: updatedAttempt.submittedAt?.toISOString() ?? null,
    };
  } else {
    // CODING or MIXED assessment evaluation
    const problems = await prisma.codingProblem.findMany({
      where: { assessmentId: attempt.assessmentId },
    });

    const totalProblems = problems.length;
    let totalScoreEarned = 0;
    const maxScorePossible = 100;
    const problemWeight = totalProblems > 0 ? 100 / totalProblems : 0;

    for (const p of problems) {
      const testCases = Array.isArray(p.testCases)
        ? (p.testCases as Array<{ input: string; expectedOutput: string; hidden?: boolean }>)
        : [];

      const existingAnswer = attempt.answers.find(
        (a) => a.codingProblemId === p.id || a.questionId === p.id
      );

      const clientResults = clientTestResults?.[p.id];
      let passedCount = 0;

      if (testCases.length > 0) {
        for (let i = 0; i < testCases.length; i++) {
          const tc = testCases[i];
          const studentResult = clientResults?.[i];
          if (studentResult && normalizeCompare(studentResult.actualOutput, tc.expectedOutput)) {
            passedCount++;
          }
        }
      }

      const problemScore =
        testCases.length > 0 ? (passedCount / testCases.length) * problemWeight : 0;
      const isCorrect = testCases.length > 0 && passedCount === testCases.length;
      totalScoreEarned += problemScore;

      if (existingAnswer) {
        await prisma.assessmentAnswer.update({
          where: { id: existingAnswer.id },
          data: {
            isCorrect,
            scoreAwarded: Math.round(problemScore * 100) / 100,
            answeredAt: now,
          },
        });
      } else if (clientResults || p.id) {
        await prisma.assessmentAnswer.create({
          data: {
            attemptId: attempt.id,
            codingProblemId: p.id,
            isCorrect,
            scoreAwarded: Math.round(problemScore * 100) / 100,
            answeredAt: now,
          },
        });
      }
    }

    const roundedScore = Math.round(totalScoreEarned);
    const percentage = Math.min(100, Math.max(0, roundedScore));

    const updatedAttempt = await prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "SUBMITTED",
        submittedAt: now,
        score: roundedScore,
        percentage,
        timeSpent: timeSpentSeconds,
      },
    });

    await prisma.performanceRecord.create({
      data: {
        studentId: attempt.studentId,
        sourceType: "ASSESSMENT",
        sourceId: attempt.assessmentId,
        title: attempt.assessment.title,
        score: roundedScore,
        maxScore: maxScorePossible,
        percentage,
        skillArea: "coding",
        month,
        completedAt: now,
      },
    });

    await updateStudentAggregates(attempt.studentId, now);

    try {
      await syncRecommendationsForStudent(attempt.studentId);
    } catch (recErr) {
      console.error("Failed to sync recommendations following attempt finalization:", recErr);
    }

    return {
      id: updatedAttempt.id,
      status: updatedAttempt.status,
      score: roundedScore,
      maxScore: maxScorePossible,
      percentage,
      timeSpent: timeSpentSeconds,
      submittedAt: updatedAttempt.submittedAt?.toISOString() ?? null,
    };
  }
}
