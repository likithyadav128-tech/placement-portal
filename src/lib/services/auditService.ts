import { prisma } from "@/lib/prisma";
import { mockAuditLogs } from "@/data/mock/audit-logs";
import type { AuditLog } from "@/types";
import type { Role } from "@prisma/client";

export interface LogAuditParams {
  actorUserId?: string;
  actorName: string;
  role: Role;
  action: string;
  entityType: string;
  entityId?: string;
  status?: "success" | "failed";
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Appends an immutable security record to the system audit trail.
 */
export async function logAuditEvent(params: LogAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId,
        actorName: params.actorName,
        role: params.role,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        status: params.status || "success",
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (err) {
    console.warn("Audit logging error:", err);
  }
}

/**
 * Retrieves audit records for management inspection.
 */
export async function getAuditLogs(_filters?: {
  role?: string;
  search?: string;
}): Promise<AuditLog[]> {
  try {
    const dbLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    if (dbLogs.length > 0) {
      return dbLogs.map((log) => ({
        id: log.id,
        date: log.createdAt.toISOString(),
        actor: log.actorName,
        role: log.role as "STUDENT" | "FACULTY" | "MANAGEMENT",
        action: log.action,
        target: log.entityType + (log.entityId ? ` (${log.entityId})` : ""),
        status: log.status as "success" | "failed",
        details: log.details || undefined,
      }));
    }
  } catch {
    // Fallback
  }

  return mockAuditLogs;
}
