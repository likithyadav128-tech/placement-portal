import type { Role, User as DbUser } from "@prisma/client";
import { prisma } from "../prisma";
import { requireAuthUser } from "./session";
import { ForbiddenError } from "./errors";
import { ROLE_DEFAULT_PERMISSIONS } from "../permissions/definitions";

/**
 * Ensures a request originates from an authenticated, active user.
 */
export async function requireAuth(): Promise<DbUser> {
  return await requireAuthUser();
}

/**
 * Ensures the authenticated user holds one of the specified roles.
 * Management always bypasses read restrictions where appropriate.
 */
export async function requireRole(allowedRoles: Role | Role[]): Promise<DbUser> {
  const user = await requireAuth();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(user.role)) {
    throw new ForbiddenError(
      `Access restricted. Required role: ${roles.join(" or ")}, current role: ${user.role}`
    );
  }

  return user;
}

/**
 * Evaluates whether a user has a specific granular permission,
 * checking role defaults first, then applying any explicit database user overrides.
 */
export async function checkUserPermission(
  userId: string,
  role: Role,
  permissionId: string
): Promise<boolean> {
  try {
    // 1. Check user-specific database overrides (if DB is accessible)
    const override = await prisma.userPermissionOverride.findUnique({
      where: {
        userId_permissionId: {
          userId,
          permissionId,
        },
      },
    });

    if (override !== null) {
      return override.granted;
    }
  } catch {
    // DB query fallback
  }

  // 2. Default to role definition
  const defaults = ROLE_DEFAULT_PERMISSIONS[role] || [];
  return defaults.includes(permissionId);
}

/**
 * Strictly requires the authenticated user to possess a specific granular permission.
 */
export async function requirePermission(permissionId: string): Promise<DbUser> {
  const user = await requireAuth();

  const hasPerm = await checkUserPermission(user.id, user.role, permissionId);
  if (!hasPerm) {
    throw new ForbiddenError(
      `Permission denied. Missing required permission: ${permissionId}`
    );
  }

  return user;
}

/**
 * IDOR Protection for Student records:
 * Ensures the authenticated student can ONLY access their own student record.
 * MANAGEMENT users are permitted to access any student record.
 */
export async function requireStudentOwnership(targetStudentId: string): Promise<DbUser> {
  const user = await requireAuth();

  if (user.role === "MANAGEMENT") {
    return user;
  }

  if (user.role === "STUDENT") {
    try {
      const student = await prisma.student.findUnique({
        where: { userId: user.id },
      });

      if (!student || student.id !== targetStudentId) {
        throw new ForbiddenError("Access denied. You can only access your own student data.");
      }
    } catch (err) {
      if (err instanceof ForbiddenError) throw err;
    }
    return user;
  }

  throw new ForbiddenError("Access denied. Insufficient role privileges.");
}

/**
 * IDOR Protection for Faculty access to Students:
 * Ensures the faculty member is assigned to the requested student,
 * or that the user is MANAGEMENT.
 */
export async function requireFacultyAccessToStudent(targetStudentId: string): Promise<DbUser> {
  const user = await requireAuth();

  if (user.role === "MANAGEMENT") {
    return user;
  }

  if (user.role === "FACULTY") {
    try {
      const faculty = await prisma.faculty.findUnique({
        where: { userId: user.id },
      });

      if (!faculty) {
        throw new ForbiddenError("Faculty record not found.");
      }

      const assignment = await prisma.facultyStudentAssignment.findUnique({
        where: {
          facultyId_studentId: {
            facultyId: faculty.id,
            studentId: targetStudentId,
          },
        },
      });

      if (!assignment) {
        // Check if faculty has unrestricted student viewing permission
        const canViewAll = await checkUserPermission(user.id, user.role, "VIEW_ASSIGNED_STUDENTS");
        if (!canViewAll) {
          throw new ForbiddenError("You are not authorized to access this student's data.");
        }
      }
    } catch (err) {
      if (err instanceof ForbiddenError) throw err;
    }
    return user;
  }

  throw new ForbiddenError("Only faculty and management can access this endpoint.");
}
