import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/management/assessments
 *
 * Full assessment lifecycle inventory with participant counts and performance metrics from PostgreSQL.
 * Strict RBAC: Requires Role.MANAGEMENT.
 */
export async function GET() {
  try {
    await requireRole("MANAGEMENT");

    const assessments = await withDbRetry(() =>
      prisma.assessment.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          aptitudeQuestions: { select: { id: true } },
          codingProblems: { select: { id: true } },
          attempts: {
            where: { status: { in: ["SUBMITTED", "EVALUATED"] } },
            select: { percentage: true },
          },
        },
      })
    );

    const formatted = assessments.map((a) => {
      const validScores = a.attempts
        .map((att: { percentage: number | null }) => att.percentage)
        .filter((pct: number | null): pct is number => pct !== null && pct !== undefined);
      const avgScore =
        validScores.length > 0
          ? Math.round(
              validScores.reduce((sum: number, val: number) => sum + val, 0) / validScores.length
            )
          : null;

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        type: a.type.toLowerCase(),
        difficulty: a.difficulty.toLowerCase(),
        duration: a.duration,
        questions: a.aptitudeQuestions.length + a.codingProblems.length,
        participants: a.attempts.length,
        avgScore,
        status: a.status.toLowerCase(),
        createdAt: a.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      assessments: formatted,
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
    console.error("GET /api/management/assessments error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
