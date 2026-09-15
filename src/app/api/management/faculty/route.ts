import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/management/faculty
 *
 * Institutional faculty directory and workload assignments from PostgreSQL.
 * Strict RBAC: Requires Role.MANAGEMENT.
 */
export async function GET(request: Request) {
  try {
    await requireRole("MANAGEMENT");

    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");

    const rawFaculty = await withDbRetry(() =>
      prisma.faculty.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true, avatarUrl: true, lastLoginAt: true },
          },
          assignedStudents: { select: { id: true } },
        },
      })
    );

    let facultyList = rawFaculty.map((f) => ({
      id: f.id,
      name: f.user.name,
      email: f.user.email,
      avatarUrl: f.user.avatarUrl,
      employeeId: f.employeeId,
      department: f.department,
      designation: f.designation,
      studentsAssigned: f.assignedStudents.length,
      status: f.status,
      lastActive: f.user.lastLoginAt ? f.user.lastLoginAt.toISOString() : "Never",
    }));

    if (department && department !== "All") {
      facultyList = facultyList.filter((f) => f.department === department);
    }

    return NextResponse.json({
      faculty: facultyList,
      total: facultyList.length,
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
    console.error("GET /api/management/faculty error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
