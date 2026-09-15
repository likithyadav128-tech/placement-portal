import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/faculty/performance
 *
 * Returns aggregate domain skill metrics, department benchmarks, and monthly trend curves
 * across the assigned faculty cohort from PostgreSQL.
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
              student: true,
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

    // Skill distribution
    const skillDistribution = [
      {
        name: "Coding",
        value: count > 0 ? Math.round(students.reduce((acc, s) => acc + (s.codingScore || 0), 0) / count) : 0,
        color: "#4f46e5",
      },
      {
        name: "Aptitude",
        value: count > 0 ? Math.round(students.reduce((acc, s) => acc + (s.aptitudeScore || 0), 0) / count) : 0,
        color: "#10b981",
      },
      {
        name: "Reasoning",
        value: count > 0 ? Math.round(students.reduce((acc, s) => acc + (s.reasoningScore || 0), 0) / count) : 0,
        color: "#f59e0b",
      },
      {
        name: "Communication",
        value: count > 0 ? Math.round(students.reduce((acc, s) => acc + (s.communicationScore || 0), 0) / count) : 0,
        color: "#8b5cf6",
      },
    ];

    // Department comparison
    const deptMap = new Map<string, { total: number; count: number }>();
    for (const s of students) {
      const cur = deptMap.get(s.department) || { total: 0, count: 0 };
      deptMap.set(s.department, { total: cur.total + s.overallScore, count: cur.count + 1 });
    }
    const deptComparison = Array.from(deptMap.entries()).map(([name, d]) => ({
      name,
      score: Math.round(d.total / d.count),
    }));

    // Monthly trend data from PerformanceRecord
    const studentIds = students.map((s) => s.id);
    const records = studentIds.length > 0
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
      monthMap.set(m, { total: cur.total + r.percentage, count: cur.count + 1 });
    }
    const trendData = Array.from(monthMap.entries()).map(([month, d]) => ({
      month,
      overall: Math.round((d.total / d.count) * 10) / 10,
    }));

    return NextResponse.json({
      totalStudents: count,
      skillDistribution,
      deptComparison,
      trendData,
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
    console.error("GET /api/faculty/performance error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
