import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";
import { matchesYear, matchesBranch } from "@/lib/assessment/slugs";

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
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["FACULTY", "MANAGEMENT"]);
    const { id } = await props.params;

    // 1. Fetch assessment
    const assessment = await withDbRetry(() =>
      prisma.assessment.findUnique({
        where: { id },
        include: {
          createdBy: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
          aptitudeQuestions: { select: { id: true } },
          codingProblems: { select: { id: true } },
        },
      })
    );

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
    }

    // 2. Resolve cohort students matching assessment's Year and Branch
    const targetYear = assessment.year || "3rd Year";
    const targetBranch = assessment.branch || "AI & DS";

    let allAssignedStudents: Array<{
      id: string;
      name: string;
      email: string;
      rollNumber: string;
      department: string;
      year: string;
    }> = [];

    if (user.role === "FACULTY") {
      const faculty = await withDbRetry(() =>
        prisma.faculty.findUnique({
          where: { userId: user.id },
          include: {
            assignedStudents: {
              include: {
                student: {
                  include: {
                    user: { select: { name: true, email: true } },
                  },
                },
              },
            },
          },
        })
      );

      if (!faculty) {
        return NextResponse.json({ error: "Faculty profile not found." }, { status: 403 });
      }

      allAssignedStudents = faculty.assignedStudents.map((a) => ({
        id: a.student.id,
        name: a.student.user.name,
        email: a.student.user.email,
        rollNumber: a.student.rollNumber,
        department: a.student.department,
        year: a.student.year,
      }));
    } else {
      // MANAGEMENT: view all active students
      const allStudents = await withDbRetry(() =>
        prisma.student.findMany({
          where: { status: "active" },
          include: {
            user: { select: { name: true, email: true } },
          },
        })
      );

      allAssignedStudents = allStudents.map((s) => ({
        id: s.id,
        name: s.user.name,
        email: s.user.email,
        rollNumber: s.rollNumber,
        department: s.department,
        year: s.year,
      }));
    }

    // Filter cohort strictly to this assessment's Year and Branch
    const cohortStudents = allAssignedStudents.filter(
      (s) => matchesYear(s.year, targetYear) && matchesBranch(s.department, targetBranch)
    );

    // 3. Fetch all graded attempts for this assessment by cohort students.
    //    IMPORTANT: filter score/percentage NOT NULL first.
    //    PostgreSQL ORDER BY score DESC places NULL values FIRST (NULLS FIRST is
    //    the PostgreSQL default for DESC), so without this filter the null-score
    //    attempt would always be selected as the "best" attempt — causing 0/100
    //    to be shown for students who actually scored 100/100.
    const studentIds = cohortStudents.map((s) => s.id);
    const attempts = await withDbRetry(() =>
      prisma.assessmentAttempt.findMany({
        where: {
          assessmentId: id,
          studentId: { in: studentIds },
          status: { in: ["SUBMITTED", "EVALUATED"] },
          score: { not: null },
          percentage: { not: null },
        },
        orderBy: { score: "desc" },
      })
    );

    // Map attempts by studentId (keep best score)
    const bestAttemptByStudent = new Map<string, typeof attempts[0]>();
    for (const att of attempts) {
      if (!bestAttemptByStudent.has(att.studentId)) {
        bestAttemptByStudent.set(att.studentId, att);
      }
    }

    const maxMarks = assessment.maxMarks || 100;

    // 4. Build student result rows (LEFT JOIN semantics: includes non-attempted cohort students)
    const studentResults = cohortStudents.map((s) => {
      const attempt = bestAttemptByStudent.get(s.id);

      if (attempt) {
        const pct = attempt.percentage !== null ? Math.round(attempt.percentage * 10) / 10 : 0;
        const score = attempt.score !== null ? Math.round(attempt.score * 10) / 10 : 0;
        const result: "PASS" | "FAIL" = pct >= 50 ? "PASS" : "FAIL";

        return {
          studentId: s.id,
          name: s.name,
          email: s.email,
          rollNumber: s.rollNumber,
          department: s.department,
          year: s.year,
          attemptId: attempt.id,
          score,
          maxMarks,
          percentage: pct,
          result,
          status: result === "PASS" ? "Passed" : "Failed",
          attemptStatus: "Attempted" as const,
          submissionTime: attempt.submittedAt ? attempt.submittedAt.toISOString() : null,
          timeTaken: formatSeconds(attempt.timeSpent),
          hasAttempt: true,
        };
      }

      return {
        studentId: s.id,
        name: s.name,
        email: s.email,
        rollNumber: s.rollNumber,
        department: s.department,
        year: s.year,
        attemptId: null,
        score: null,
        maxMarks,
        percentage: null,
        result: "Not Evaluated" as const,
        status: "Not Attempted" as const,
        attemptStatus: "Not Attempted" as const,
        submissionTime: null,
        timeTaken: "—",
        hasAttempt: false,
      };
    });

    // 5. Calculate summary metrics
    const totalStudents = studentResults.length;
    const submittedResults = studentResults.filter((r) => r.hasAttempt);
    const attemptedCount = submittedResults.length;
    const notAttemptedCount = Math.max(0, totalStudents - attemptedCount);

    const validPercentages = submittedResults
      .map((r) => r.percentage)
      .filter((p): p is number => p !== null);

    const averageScore =
      validPercentages.length > 0
        ? Math.round((validPercentages.reduce((sum, val) => sum + val, 0) / validPercentages.length) * 10) / 10
        : 0;

    const highestScore = validPercentages.length > 0 ? Math.max(...validPercentages) : 0;
    const lowestScore = validPercentages.length > 0 ? Math.min(...validPercentages) : 0;

    const passedCount = submittedResults.filter((r) => r.result === "PASS").length;
    const passPercentage =
      attemptedCount > 0 ? Math.round((passedCount / attemptedCount) * 1000) / 10 : 0;

    // 6. Calculate score distribution histogram
    const distribution = [
      { range: "90-100%", count: 0, min: 90, max: 100 },
      { range: "80-89%", count: 0, min: 80, max: 89.99 },
      { range: "70-79%", count: 0, min: 70, max: 79.99 },
      { range: "60-69%", count: 0, min: 60, max: 69.99 },
      { range: "Below 60%", count: 0, min: 0, max: 59.99 },
    ];

    for (const r of submittedResults) {
      if (r.percentage !== null) {
        for (const bucket of distribution) {
          if (r.percentage >= bucket.min && r.percentage <= bucket.max) {
            bucket.count++;
            break;
          }
        }
      }
    }

    return NextResponse.json({
      assessment: {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        type: assessment.type,
        year: assessment.year || "3rd Year",
        branch: assessment.branch || "AI & DS",
        maxMarks: assessment.maxMarks || 100,
        duration: assessment.duration,
        status: assessment.status,
        startDate: assessment.startDate ? assessment.startDate.toISOString() : null,
        endDate: assessment.endDate ? assessment.endDate.toISOString() : null,
        uploadedBy: assessment.createdBy?.user?.name || "Placement Cell",
      },
      summary: {
        totalStudents,
        attemptedCount,
        notAttemptedCount,
        submittedCount: attemptedCount,
        pendingCount: notAttemptedCount,
        averageScore,
        highestScore,
        lowestScore,
        passPercentage,
      },
      distribution: distribution.map((d) => ({
        range: d.range,
        count: d.count,
      })),
      results: studentResults,
    });
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string; status?: number };
    if (error.name === "ForbiddenError" || error.status === 403) {
      return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/faculty/assessments/[id]/results error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
