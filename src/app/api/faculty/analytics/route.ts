import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/faculty/analytics
 *
 * Returns analytical cohort statistics: performance tiers, median, improving/declining counts,
 * and monthly domain trends from PostgreSQL.
 * Strict RBAC: Requires Role.FACULTY.
 */
export async function GET() {
  try {
    const user = await requireRole("FACULTY");

    const faculty = await withDbRetry(() =>
      prisma.faculty.findUnique({
        where: { userId: user.id },
        include: {
          assignedStudents: {
            include: {
              student: {
                include: {
                  assessmentAttempts: {
                    where: { status: { in: ["SUBMITTED", "EVALUATED"] } },
                  },
                },
              },
            },
          },
        },
      })
    );

    if (!faculty) {
      return NextResponse.json(
        { error: "Faculty record not found." },
        { status: 404 }
      );
    }

    const students = faculty.assignedStudents.map((a) => a.student);
    const count = students.length;

    // Score distribution buckets
    const distribution = [
      { range: "0-30", count: 0 },
      { range: "30-50", count: 0 },
      { range: "50-70", count: 0 },
      { range: "70-85", count: 0 },
      { range: "85-100", count: 0 },
    ];

    for (const s of students) {
      const score = s.overallScore;
      if (score < 30) distribution[0].count++;
      else if (score < 50) distribution[1].count++;
      else if (score < 70) distribution[2].count++;
      else if (score < 85) distribution[3].count++;
      else distribution[4].count++;
    }

    // Averages and median
    const sortedScores = students.map((s) => s.overallScore).sort((a, b) => a - b);
    const avgScore =
      count > 0
        ? Math.round(
            (sortedScores.reduce((sum, val) => sum + val, 0) / count) * 10
          ) / 10
        : 0;

    let median = 0;
    if (count > 0) {
      const mid = Math.floor(count / 2);
      median = count % 2 !== 0 ? sortedScores[mid] : Math.round(((sortedScores[mid - 1] + sortedScores[mid]) / 2) * 10) / 10;
    }

    const improvingCount = students.filter((s) => s.trend === "improving").length;
    const decliningCount = students.filter((s) => s.trend === "declining").length;

    // Assessment completion rate: students who completed at least 1 assessment
    const activeCompleters = students.filter(
      (s) => s.assessmentAttempts.length > 0
    ).length;
    const completionRate =
      count > 0 ? Math.round((activeCompleters / count) * 100) : 0;

    // Monthly domain averages from PerformanceRecord
    const studentIds = students.map((s) => s.id);
    const records =
      studentIds.length > 0
        ? await withDbRetry(() =>
            prisma.performanceRecord.findMany({
              where: { studentId: { in: studentIds } },
              orderBy: { completedAt: "asc" },
            })
          )
        : [];

    const monthSkillMap = new Map<
      string,
      { coding: number[]; aptitude: number[]; reasoning: number[] }
    >();

    for (const r of records) {
      const m = r.month || "Recent";
      const cur = monthSkillMap.get(m) || { coding: [], aptitude: [], reasoning: [] };
      if (r.skillArea === "coding") cur.coding.push(r.percentage);
      else if (r.skillArea === "aptitude") cur.aptitude.push(r.percentage);
      else if (r.skillArea === "reasoning") cur.reasoning.push(r.percentage);
      monthSkillMap.set(m, cur);
    }

    const monthlyTrends = Array.from(monthSkillMap.entries()).map(
      ([month, data]) => {
        const avg = (arr: number[]) =>
          arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
        return {
          month,
          coding: avg(data.coding),
          aptitude: avg(data.aptitude),
          reasoning: avg(data.reasoning),
        };
      }
    );

    return NextResponse.json({
      averagePerformance: avgScore,
      medianScore: median,
      improvingCount,
      decliningCount,
      completionRate,
      scoreDistribution: distribution,
      monthlyTrends,
    });
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string; status?: number };
    if (error.name === "ForbiddenError" || error.status === 403) {
      return NextResponse.json(
        { error: error.message || "Forbidden: Faculty role required" },
        { status: 403 }
      );
    }
    if (error.name === "UnauthorizedError" || error.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/faculty/analytics error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
