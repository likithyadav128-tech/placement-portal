import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";
import { getSignedAssessmentFileUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["FACULTY", "MANAGEMENT", "STUDENT"]);
    const { id } = await props.params;

    const assessment = await withDbRetry(() =>
      prisma.assessment.findUnique({
        where: { id },
        select: {
          id: true,
          fileName: true,
          filePath: true,
          fileType: true,
        },
      })
    );

    if (!assessment || !assessment.filePath) {
      return NextResponse.json({ error: "Assessment file not found." }, { status: 404 });
    }

    const signedUrl = await getSignedAssessmentFileUrl(assessment.filePath, 3600);

    return NextResponse.json({
      downloadUrl: signedUrl,
      fileName: assessment.fileName,
      fileType: assessment.fileType,
    });
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string; status?: number };
    if (error.name === "ForbiddenError" || error.status === 403) {
      return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/faculty/assessments/[id]/file error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
