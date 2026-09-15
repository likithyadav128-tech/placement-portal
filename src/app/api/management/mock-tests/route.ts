import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/management/mock-tests
 *
 * Company-specific mock test benchmark configurations from PostgreSQL.
 * Strict RBAC: Requires Role.MANAGEMENT.
 */
export async function GET() {
  try {
    await requireRole("MANAGEMENT");

    const tests = await withDbRetry(() =>
      prisma.mockTest.findMany({
        orderBy: { createdAt: "desc" },
      })
    );

    const formatted = tests.map((t) => ({
      id: t.id,
      name: t.name,
      company: t.company,
      category: t.category,
      sections: t.sections,
      duration: t.duration,
      difficulty: t.difficulty.toLowerCase(),
      status: t.status.toLowerCase(),
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json({
      tests: formatted,
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
    console.error("GET /api/management/mock-tests error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
