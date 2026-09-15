import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/management/settings
 *
 * Institutional configuration sections and administrative flags from PostgreSQL.
 * Strict RBAC: Requires Role.MANAGEMENT.
 */
export async function GET() {
  try {
    await requireRole("MANAGEMENT");

    const settings = await withDbRetry(() =>
      prisma.institutionSetting.findMany({
        orderBy: [{ section: "asc" }, { key: "asc" }],
      })
    );

    // Group settings by section
    const grouped: Record<
      string,
      Array<{
        id: string;
        key: string;
        label: string;
        description: string | null;
        type: string;
        value: string;
        options: string[];
      }>
    > = {
      institution: [],
      assessment: [],
      notifications: [],
      security: [],
    };

    for (const s of settings) {
      if (!grouped[s.section]) {
        grouped[s.section] = [];
      }
      grouped[s.section].push({
        id: s.id,
        key: s.key,
        label: s.label,
        description: s.description,
        type: s.type,
        value: s.value,
        options: s.options,
      });
    }

    return NextResponse.json({
      settings: grouped,
      total: settings.length,
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
    console.error("GET /api/management/settings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
