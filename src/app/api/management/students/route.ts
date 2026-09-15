import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/management/students
 *
 * Enterprise directory of all registered students across the institution from PostgreSQL.
 * Strict RBAC: Requires Role.MANAGEMENT.
 */
export async function GET(request: Request) {
  try {
    await requireRole("MANAGEMENT");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const department = searchParams.get("department");
    const year = searchParams.get("year");
    const tier = searchParams.get("tier");
    const status = searchParams.get("status");

    const rawStudents = await withDbRetry(() =>
      prisma.student.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true, avatarUrl: true, status: true },
          },
        },
      })
    );

    let students = rawStudents.map((s) => ({
      id: s.id,
      name: s.user.name,
      email: s.user.email,
      avatarUrl: s.user.avatarUrl,
      rollNumber: s.rollNumber,
      department: s.department,
      year: s.year,
      overallScore: s.overallScore,
      placementReadiness: s.placementReadiness,
      status: s.status,
      lastActivity: s.lastActivity.toISOString(),
    }));

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
        { error: error.message || "Forbidden: Management role required" },
        { status: 403 }
      );
    }
    if (error.name === "UnauthorizedError" || error.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/management/students error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
