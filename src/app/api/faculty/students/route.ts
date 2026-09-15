import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/faculty/students
 *
 * Returns all students assigned to the authenticated faculty member from PostgreSQL.
 * Strict RBAC: Requires Role.FACULTY. Supports query filtering by name/roll, dept, year, tier, and status.
 */
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const department = searchParams.get("department");
    const year = searchParams.get("year");
    const tier = searchParams.get("tier");
    const status = searchParams.get("status");

    let students = faculty.assignedStudents.map((a) => ({
      id: a.student.id,
      name: a.student.user.name,
      email: a.student.user.email,
      avatarUrl: a.student.user.avatarUrl,
      rollNumber: a.student.rollNumber,
      department: a.student.department,
      year: a.student.year,
      overallScore: a.student.overallScore,
      codingScore: a.student.codingScore,
      aptitudeScore: a.student.aptitudeScore,
      reasoningScore: a.student.reasoningScore,
      communicationScore: a.student.communicationScore,
      placementReadiness: a.student.placementReadiness,
      trend: a.student.trend,
      status: a.student.status,
      lastActivity: a.student.lastActivity.toISOString(),
    }));

    // Apply filtering
    if (search) {
      students = students.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.rollNumber.toLowerCase().includes(search)
      );
    }

    if (department && department !== "All") {
      students = students.filter((s) => s.department === department);
    }

    if (year && year !== "All") {
      students = students.filter((s) => s.year === year);
    }

    if (status && status !== "All") {
      students = students.filter(
        (s) => s.status.toLowerCase() === status.toLowerCase()
      );
    }

    if (tier && tier !== "All") {
      if (tier === "Above 75%") {
        students = students.filter((s) => s.overallScore > 75);
      } else if (tier === "50-75%") {
        students = students.filter(
          (s) => s.overallScore >= 50 && s.overallScore <= 75
        );
      } else if (tier === "Below 50%") {
        students = students.filter((s) => s.overallScore < 50);
      }
    }

    return NextResponse.json({
      students,
      total: students.length,
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
    console.error("GET /api/faculty/students error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
