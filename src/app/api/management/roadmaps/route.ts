import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/management/roadmaps
 *
 * Curated career and placement roadmaps from PostgreSQL.
 * Strict RBAC: Requires Role.MANAGEMENT.
 */
export async function GET() {
  try {
    await requireRole("MANAGEMENT");

    const roadmaps = await withDbRetry(() =>
      prisma.roadmap.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          items: { select: { id: true } },
        },
      })
    );

    const formatted = roadmaps.map((r) => ({
      id: r.id,
      title: r.title,
      description: null,
      targetDepartment: r.targetGroup,
      itemsCount: r.items.length,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({
      roadmaps: formatted,
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
    console.error("GET /api/management/roadmaps error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
