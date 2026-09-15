import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/faculty/attention
 *
 * Returns students needing intervention categorized by critical status, developing scores,
 * declining monitoring, and improving trajectories from PostgreSQL.
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

    const students = faculty.assignedStudents.map((a) => a.student);

    const mapStudent = (s: (typeof students)[0], reason: string) => ({
      id: s.id,
      name: s.user.name,
      email: s.user.email,
      rollNumber: s.rollNumber,
      department: s.department,
      overallScore: s.overallScore,
      trend: s.trend,
      reason,
      lastActivity: s.lastActivity.toISOString(),
      skills: s.skills,
    });

    const critical = students
      .filter((s) => s.overallScore < 50)
      .map((s) => mapStudent(s, "Overall score below 50% critical threshold"));

    const needsAttention = students
      .filter((s) => s.overallScore >= 50 && s.overallScore < 60)
      .map((s) => mapStudent(s, "Developing score (50-59%) requiring practice"));

    const monitoring = students
      .filter(
        (s) =>
          s.overallScore >= 60 &&
          s.overallScore < 70 &&
          s.trend === "declining"
      )
      .map((s) => mapStudent(s, "Declining performance trend"));

    const improving = students
      .filter((s) => s.overallScore < 65 && s.trend === "improving")
      .map((s) => mapStudent(s, "Improving score trajectory"));

    return NextResponse.json({
      critical,
      needsAttention,
      monitoring,
      improving,
      totalNeedingAttention: critical.length + needsAttention.length + monitoring.length,
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
    console.error("GET /api/faculty/attention error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
