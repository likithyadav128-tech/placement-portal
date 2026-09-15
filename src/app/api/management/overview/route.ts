import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/management/overview
 *
 * Executive institutional metrics, participation rates, and audit activity from PostgreSQL.
 * Strict RBAC: Requires Role.MANAGEMENT.
 */
export async function GET() {
  try {
    await requireRole("MANAGEMENT");

    const [
      totalStudents,
      totalFaculty,
      students,
      activeAssessments,
      availableTests,
      roadmaps,
      auditLogs,
    ] = await withDbRetry(() =>
      Promise.all([
        prisma.student.count(),
        prisma.faculty.count(),
        prisma.student.findMany({
          select: {
            id: true,
            department: true,
            placementReadiness: true,
            status: true,
            _count: {
              select: {
                assessmentAttempts: {
                  where: { status: { in: ["SUBMITTED", "EVALUATED"] } },
                },
              },
            },
          },
        }),
        prisma.assessment.count({ where: { status: "PUBLISHED" } }),
        prisma.mockTest.count({ where: { status: "PUBLISHED" } }),
        prisma.roadmap.findMany({ select: { id: true } }),
        prisma.auditLog.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            actorName: true,
            role: true,
            action: true,
            entityType: true,
            status: true,
            createdAt: true,
          },
        }),
      ])
    );

    const avgReadiness =
      totalStudents > 0
        ? Math.round(
            students.reduce((acc, s) => acc + (s.placementReadiness || 0), 0) /
              totalStudents
          )
        : 0;

    const studentsWithAttempts = students.filter(
      (s) => s._count.assessmentAttempts > 0
    ).length;
    const participationRate =
      totalStudents > 0
        ? Math.round((studentsWithAttempts / totalStudents) * 100)
        : 0;

    const studentsNeedingAttention = students.filter(
      (s) => s.placementReadiness < 50 || s.status === "inactive"
    ).length;

    // Department comparison
    const deptMap = new Map<string, { total: number; count: number }>();
    for (const s of students) {
      const cur = deptMap.get(s.department) || { total: 0, count: 0 };
      deptMap.set(s.department, {
        total: cur.total + s.placementReadiness,
        count: cur.count + 1,
      });
    }
    const deptComparison = Array.from(deptMap.entries()).map(([name, data]) => ({
      name,
      readiness: Math.round(data.total / data.count),
    }));

    return NextResponse.json({
      totalStudents,
      totalFaculty,
      avgReadiness,
      participationRate,
      studentsNeedingAttention,
      activeAssessments,
      availableTests,
      totalRoadmaps: roadmaps.length,
      recentAuditLogs: auditLogs.map((log) => ({
        id: log.id,
        actor: log.actorName,
        role: log.role,
        action: log.action,
        target: log.entityType,
        status: log.status,
        timestamp: log.createdAt.toISOString(),
      })),
      deptComparison,
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
    console.error("GET /api/management/overview error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
