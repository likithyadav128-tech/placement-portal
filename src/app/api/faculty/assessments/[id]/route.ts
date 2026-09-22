import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";
import { getSignedAssessmentFileUrl, deleteAssessmentFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["FACULTY", "MANAGEMENT"]);
    const { id } = await props.params;

    const assessment = await withDbRetry(() =>
      prisma.assessment.findUnique({
        where: { id },
        include: {
          createdBy: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
          aptitudeQuestions: true,
          codingProblems: true,
          _count: {
            select: { attempts: true },
          },
        },
      })
    );

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
    }

    let downloadUrl: string | null = null;
    if (assessment.filePath) {
      try {
        downloadUrl = await getSignedAssessmentFileUrl(assessment.filePath, 3600);
      } catch (fileErr) {
        console.warn(`Could not generate signed URL for ${assessment.filePath}:`, fileErr);
      }
    }

    return NextResponse.json({
      assessment: {
        ...assessment,
        downloadUrl,
      },
    });
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string; status?: number };
    if (error.name === "ForbiddenError" || error.status === 403) {
      return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/faculty/assessments/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["FACULTY", "MANAGEMENT"]);
    const { id } = await props.params;

    const existing = await withDbRetry(() =>
      prisma.assessment.findUnique({
        where: { id },
        include: { createdBy: true },
      })
    );

    if (!existing) {
      return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
    }

    // IDOR Protection: Faculty can only update assessments they created, unless MANAGEMENT
    if (user.role === "FACULTY" && existing.createdBy?.userId !== user.id) {
      return NextResponse.json(
        { error: "Access denied. You can only modify assessments you created." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const title = body.title as string | undefined;
    const description = body.description as string | null | undefined;
    const status = body.status as any;
    const startDate = body.startDate as string | undefined;
    const endDate = body.endDate as string | undefined;
    const maxMarks = body.maxMarks as string | number | undefined;
    const duration = body.duration as string | number | undefined;

    const dataToUpdate: Record<string, unknown> = {};
    if (title) dataToUpdate.title = title.trim();
    if (description !== undefined) dataToUpdate.description = description ? description.trim() : null;
    if (status) dataToUpdate.status = status;
    if (startDate !== undefined) dataToUpdate.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) {
      dataToUpdate.endDate = endDate ? new Date(endDate) : null;
      dataToUpdate.deadline = dataToUpdate.endDate;
    }
    if (maxMarks) dataToUpdate.maxMarks = Number(maxMarks);
    if (duration) dataToUpdate.duration = Number(duration);

    const updated = await withDbRetry(() =>
      prisma.assessment.update({
        where: { id },
        data: dataToUpdate,
      })
    );

    return NextResponse.json({ success: true, assessment: updated });
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string; status?: number };
    if (error.name === "ForbiddenError" || error.status === 403) {
      return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
    }
    console.error("PATCH /api/faculty/assessments/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["FACULTY", "MANAGEMENT"]);
    const { id } = await props.params;

    const existing = await withDbRetry(() =>
      prisma.assessment.findUnique({
        where: { id },
        include: {
          createdBy: true,
          attempts: { select: { id: true } },
        },
      })
    );

    if (!existing) {
      return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
    }

    // IDOR Protection: Faculty can only delete assessments they created
    if (user.role === "FACULTY" && existing.createdBy?.userId !== user.id) {
      return NextResponse.json(
        { error: "Access denied. You can only delete assessments you created." },
        { status: 403 }
      );
    }

    // Do not delete assessments with active/submitted attempts to preserve history
    if (existing.attempts.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete an assessment that already has student attempts. Consider archiving it instead." },
        { status: 400 }
      );
    }

    // If file was attached, delete from Supabase Storage
    if (existing.filePath) {
      try {
        await deleteAssessmentFile(existing.filePath);
      } catch (fileErr) {
        console.warn(`Could not delete storage file ${existing.filePath}:`, fileErr);
      }
    }

    await withDbRetry(() =>
      prisma.assessment.delete({
        where: { id },
      })
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string; status?: number };
    if (error.name === "ForbiddenError" || error.status === 403) {
      return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
    }
    console.error("DELETE /api/faculty/assessments/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
