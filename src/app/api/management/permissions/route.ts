import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";
import { ROLE_DEFAULT_PERMISSIONS } from "@/lib/permissions/definitions";

export const dynamic = "force-dynamic";

/**
 * GET /api/management/permissions
 *
 * RBAC permission matrix for faculty members and role defaults from PostgreSQL.
 * Strict RBAC: Requires Role.MANAGEMENT.
 */
export async function GET() {
  try {
    await requireRole("MANAGEMENT");

    const [facultyMembers, overrides] = await withDbRetry(() =>
      Promise.all([
        prisma.faculty.findMany({
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        }),
        prisma.userPermissionOverride.findMany(),
      ])
    );

    const defaultFacultyPerms = ROLE_DEFAULT_PERMISSIONS.FACULTY;

    const facultyWithPerms = facultyMembers.map((f) => {
      const userOverrides = overrides.filter((o) => o.userId === f.user.id);
      const effectivePermissions: Record<string, boolean> = {};

      for (const p of defaultFacultyPerms) {
        effectivePermissions[p] = true;
      }

      for (const o of userOverrides) {
        effectivePermissions[o.permissionId] = o.granted;
      }

      return {
        id: f.id,
        userId: f.user.id,
        name: f.user.name,
        email: f.user.email,
        department: f.department,
        designation: f.designation,
        permissions: effectivePermissions,
      };
    });

    return NextResponse.json({
      faculty: facultyWithPerms,
      defaultPermissions: defaultFacultyPerms,
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
    console.error("GET /api/management/permissions error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
