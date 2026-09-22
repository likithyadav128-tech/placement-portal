import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";
import { uploadAssessmentFile } from "@/lib/storage";
import type { AssessmentType, ContentStatus } from "@prisma/client";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".xlsx", ".xls", ".csv"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
  "application/octet-stream", // Defensive for certain browser mime variations
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(request: Request) {
  try {
    const user = await requireRole(["FACULTY", "MANAGEMENT"]);

    const faculty = await withDbRetry(() =>
      prisma.faculty.findUnique({
        where: { userId: user.id },
      })
    );

    if (!faculty && user.role !== "MANAGEMENT") {
      return NextResponse.json(
        { error: "Faculty profile not found." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const type = formData.get("type") as string | null;
    const year = formData.get("year") as string | null;
    const branch = formData.get("branch") as string | null;
    const startDate = formData.get("startDate") as string | null;
    const endDate = formData.get("endDate") as string | null;
    const maxMarks = formData.get("maxMarks") as string | null;
    const status = formData.get("status") as string | null;

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Assessment title is required." }, { status: 400 });
    }

    if (!year || !["4th Year", "3rd Year", "2nd Year"].includes(year)) {
      return NextResponse.json({ error: "Valid Year selection is required." }, { status: 400 });
    }

    if (!branch || !["AI & DS", "AI & ML", "CSE", "Cyber Security"].includes(branch)) {
      return NextResponse.json({ error: "Valid Branch selection is required." }, { status: 400 });
    }

    const validTypes: AssessmentType[] = ["CODING", "APTITUDE", "MIXED", "QUIZ", "THEORY", "ASSIGNMENT"];
    const parsedType = (type || "QUIZ").toUpperCase() as AssessmentType;
    if (!validTypes.includes(parsedType)) {
      return NextResponse.json({ error: `Invalid assessment type: ${type}` }, { status: 400 });
    }

    const parsedMaxMarks = Number(maxMarks) > 0 ? Number(maxMarks) : 100;

    let parsedStartDate: Date | null = null;
    let parsedEndDate: Date | null = null;

    if (startDate) {
      parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return NextResponse.json({ error: "Invalid start date format." }, { status: 400 });
      }
    }

    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return NextResponse.json({ error: "Invalid end date format." }, { status: 400 });
      }
    }

    if (parsedStartDate && parsedEndDate && parsedEndDate < parsedStartDate) {
      return NextResponse.json({ error: "End date cannot be earlier than start date." }, { status: 400 });
    }

    let fileName: string | null = null;
    let filePath: string | null = null;
    let fileType: string | null = null;
    let fileSize: number | null = null;

    // File validation and upload to Supabase Storage
    if (file && file.size > 0) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File size exceeds the 25MB maximum limit. Current: ${(file.size / (1024 * 1024)).toFixed(1)}MB` },
          { status: 400 }
        );
      }

      const lowerName = file.name.toLowerCase();
      const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

      if (!hasAllowedExtension) {
        return NextResponse.json(
          { error: `Unsupported file type. Supported formats: PDF, DOCX, XLSX, CSV.` },
          { status: 400 }
        );
      }

      fileName = file.name;
      fileType = file.type || "application/octet-stream";
      fileSize = file.size;

      const assessmentId = crypto.randomUUID();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      filePath = `assessments/${assessmentId}/${sanitizedName}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      try {
        await uploadAssessmentFile(filePath, buffer, fileType);
      } catch (uploadErr: unknown) {
        console.error("Storage upload error:", uploadErr);
        return NextResponse.json(
          { error: `Failed to upload file to storage: ${uploadErr instanceof Error ? uploadErr.message : "Unknown error"}` },
          { status: 500 }
        );
      }
    }

    const parsedStatus: ContentStatus = status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

    const newAssessment = await withDbRetry(() =>
      prisma.assessment.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          type: parsedType,
          year,
          branch,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          deadline: parsedEndDate,
          maxMarks: parsedMaxMarks,
          status: parsedStatus,
          difficulty: "medium",
          duration: 60,
          fileName,
          filePath,
          fileType,
          fileSize,
          createdById: faculty?.id || null,
        },
      })
    );

    return NextResponse.json(
      {
        success: true,
        assessment: newAssessment,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string; status?: number };
    if (error.name === "ForbiddenError" || error.status === 403) {
      return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
    }
    console.error("POST /api/faculty/assessments/upload error:", err);
    return NextResponse.json({ error: "Internal server error during upload." }, { status: 500 });
  }
}
