import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/management/reports
 *
 * Consolidated institutional analytics, department comparisons, and readiness distribution reports.
 * Strict RBAC: Requires Role.MANAGEMENT.
 */
export async function GET() {
  try {
    await requireRole("MANAGEMENT");

    const [students, assessments] = await withDbRetry(() =>
      Promise.all([
        prisma.student.findMany({
          select: {
            id: true,
            department: true,
            year: true,
            overallScore: true,
            codingScore: true,
            aptitudeScore: true,
            reasoningScore: true,
            communicationScore: true,
            placementReadiness: true,
          },
        }),
        prisma.assessment.findMany({
          select: {
            id: true,
            title: true,
            type: true,
            _count: {
              select: {
                attempts: {
                  where: { status: { in: ["SUBMITTED", "EVALUATED"] } },
                },
              },
            },
          },
        }),
      ])
    );

    const totalStudents = students.length;

    // Department aggregates
    const deptMap = new Map<
      string,
      {
        totalReadiness: number;
        totalCoding: number;
        totalAptitude: number;
        count: number;
      }
    >();

    for (const s of students) {
      const cur = deptMap.get(s.department) || {
        totalReadiness: 0,
        totalCoding: 0,
        totalAptitude: 0,
        count: 0,
      };
      deptMap.set(s.department, {
        totalReadiness: cur.totalReadiness + s.placementReadiness,
        totalCoding: cur.totalCoding + s.codingScore,
        totalAptitude: cur.totalAptitude + s.aptitudeScore,
        count: cur.count + 1,
      });
    }

    const departmentPerformance = Array.from(deptMap.entries()).map(
      ([dept, data]) => ({
        department: dept,
        studentsCount: data.count,
        avgReadiness: Math.round(data.totalReadiness / data.count),
        avgCoding: Math.round(data.totalCoding / data.count),
        avgAptitude: Math.round(data.totalAptitude / data.count),
      })
    );

    // Available report types
    const reports = [
      {
        id: "dept-perf",
        title: "Department Performance Comparison",
        description: "Comparative readiness and benchmark scores across all engineering branches",
        lastGenerated: new Date().toISOString(),
      },
      {
        id: "placement-readiness",
        title: "Placement Readiness Cohort Report",
        description: "Distribution of students across high, medium, and developing placement eligibility tiers",
        lastGenerated: new Date().toISOString(),
      },
      {
        id: "assessment-eval",
        title: "Assessment Participation & Pass Rate",
        description: "Participation, completion rates, and score distributions for coding and aptitude benchmarks",
        lastGenerated: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      totalStudents,
      departmentPerformance,
      assessmentsCount: assessments.length,
      reports,
    });
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string; status?: number };
    if (error.name === "ForbiddenError" || error.status === 403) {
      return NextResponse.json(
        { error: error.message || "Forbidden: Management role required" },
        { status: 403 }
      );
    }
    if (error.name === "UnauthorizedError" || error.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/management/reports error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
