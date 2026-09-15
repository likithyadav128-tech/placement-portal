import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/management/audit-logs
 *
 * Immutable administrative security trail from PostgreSQL.
 * Strict RBAC: Requires Role.MANAGEMENT.
 */
export async function GET(request: Request) {
  try {
    await requireRole("MANAGEMENT");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const logs = await withDbRetry(() =>
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    );

    let formatted = logs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      actor: log.actorName,
      role: log.role,
      action: log.action,
      target: log.entityType,
      status: log.status,
      details: log.details || "",
    }));

    if (search) {
      formatted = formatted.filter(
        (l) =>
          l.actor.toLowerCase().includes(search) ||
          l.action.toLowerCase().includes(search) ||
          l.target.toLowerCase().includes(search)
      );
    }

    if (role && role !== "All") {
      formatted = formatted.filter((l) => l.role === role);
    }

    if (status && status !== "All") {
      formatted = formatted.filter(
        (l) => l.status.toLowerCase() === status.toLowerCase()
      );
    }

    return NextResponse.json({
      logs: formatted,
      total: formatted.length,
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
    console.error("GET /api/management/audit-logs error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
