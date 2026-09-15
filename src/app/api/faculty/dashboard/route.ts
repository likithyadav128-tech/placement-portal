import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/faculty/dashboard
 *
 * Resolves authenticated Faculty member and aggregates real cohort performance data from PostgreSQL.
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
                  user: {
                    select: { name: true, email: true, avatarUrl: true },
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

    const assigned = faculty.assignedStudents.map((a) => a.student);
    const totalStudents = assigned.length;

    const avgPerformance =
      totalStudents > 0
        ? Math.round(
            (assigned.reduce((sum, s) => sum + (s.overallScore || 0), 0) /
              totalStudents) *
              10
          ) / 10
        : 0;

    const needingAttentionList = assigned.filter(
      (s) => s.overallScore < 60 || s.trend === "declining"
    );

    const studentsNeedingAttention = needingAttentionList
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        name: s.user.name,
        rollNumber: s.rollNumber,
        department: s.department,
        overallScore: s.overallScore,
        trend: s.trend,
        issue:
          s.overallScore < 50
            ? "Critical Score"
            : s.trend === "declining"
            ? "Declining Trend"
            : "Low Score",
        lastActivity: s.lastActivity.toISOString(),
      }));

    const activeAssessments = await withDbRetry(() =>
      prisma.assessment.count({
        where: { status: "PUBLISHED" },
      })
    );

    // Department comparison of assigned cohort
    const deptMap = new Map<string, { total: number; count: number }>();
    for (const s of assigned) {
      const existing = deptMap.get(s.department) || { total: 0, count: 0 };
      deptMap.set(s.department, {
        total: existing.total + s.overallScore,
        count: existing.count + 1,
      });
    }
    const deptComparison = Array.from(deptMap.entries()).map(([name, data]) => ({
      name,
      score: Math.round(data.total / data.count),
    }));

    // Historical cohort performance trend from completed PerformanceRecords
    const studentIds = assigned.map((s) => s.id);
    const records =
      studentIds.length > 0
        ? await withDbRetry(() =>
            prisma.performanceRecord.findMany({
              where: { studentId: { in: studentIds } },
              orderBy: { completedAt: "asc" },
            })
          )
        : [];

    const monthMap = new Map<string, { total: number; count: number }>();
    for (const r of records) {
      const m = r.month || "Recent";
      const cur = monthMap.get(m) || { total: 0, count: 0 };
      monthMap.set(m, {
        total: cur.total + r.percentage,
        count: cur.count + 1,
      });
    }
    const performanceTrends = Array.from(monthMap.entries()).map(
      ([month, data]) => ({
        month,
        average: Math.round((data.total / data.count) * 10) / 10,
      })
    );

    return NextResponse.json({
      faculty: {
        id: faculty.id,
        name: user.name,
        department: faculty.department,
        designation: faculty.designation,
      },
      totalStudents,
      averagePerformance: avgPerformance,
      needingAttentionCount: needingAttentionList.length,
      activeAssessments,
      performanceTrends,
      deptComparison,
      studentsNeedingAttention,
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
    console.error("GET /api/faculty/dashboard error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
