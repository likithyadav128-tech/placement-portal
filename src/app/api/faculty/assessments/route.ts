import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";
import type { AssessmentType, ContentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * Computes a user-friendly status for an assessment based on content status and dates.
 */
function computeAssessmentStatus(
  status: ContentStatus,
  startDate: Date | null,
  endDate: Date | null
): "draft" | "upcoming" | "active" | "closed" | "published" {
  if (status === "DRAFT") return "draft";
  if (status === "ARCHIVED") return "closed";

  const now = new Date();
  if (startDate && now < startDate) return "upcoming";
  if (endDate && now > endDate) return "closed";
  if (startDate && (!endDate || now <= endDate)) return "active";

  return "published";
}

/**
 * GET /api/faculty/assessments
 *
 * Query parameters:
 * - year: "4th Year" | "3rd Year" | "2nd Year" | "All"
 * - branch: "AI & DS" | "AI & ML" | "CSE" | "Cyber Security" | "All"
 * - search: search term for title
 * - type: assessment type filter
 * - status: status filter ("all" | "draft" | "published" | "active" | "closed" | "evaluated")
 */
export async function GET(request: Request) {
  try {
    const user = await requireRole(["FACULTY", "MANAGEMENT"]);

    // Find faculty record for the authenticated user
    const faculty = await withDbRetry(() =>
      prisma.faculty.findUnique({
        where: { userId: user.id },
        include: {
          assignedStudents: {
            include: {
              student: {
                select: {
                  id: true,
                  department: true,
                  year: true,
                },
              },
            },
          },
        },
      })
    );

    const { searchParams } = new URL(request.url);
    const yearFilter = searchParams.get("year");
    const branchFilter = searchParams.get("branch");
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const typeFilter = searchParams.get("type")?.toUpperCase() || "";
    const statusFilter = searchParams.get("status")?.toLowerCase() || "";

    // Query all institutional assessments
    const rawAssessments = await withDbRetry(() =>
      prisma.assessment.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
          },
          aptitudeQuestions: { select: { id: true } },
          codingProblems: { select: { id: true } },
          attempts: {
            where: { status: { in: ["SUBMITTED", "EVALUATED"] } },
            select: {
              id: true,
              studentId: true,
              score: true,
              percentage: true,
              status: true,
            },
          },
        },
      })
    );

    // Get assigned students cohort
    const assignedStudents = faculty?.assignedStudents.map((a) => a.student) || [];
    const assignedStudentIds = new Set(assignedStudents.map((s) => s.id));

    // Calculate aggregate breakdown for Year and Branch cards
    const ALL_YEARS = ["4th Year", "3rd Year", "2nd Year"];
    const ALL_BRANCHES = ["AI & DS", "AI & ML", "CSE", "Cyber Security"];

    const yearStats: Record<string, { assessmentCount: number; studentCount: number }> = {
      "4th Year": { assessmentCount: 0, studentCount: 0 },
      "3rd Year": { assessmentCount: 0, studentCount: 0 },
      "2nd Year": { assessmentCount: 0, studentCount: 0 },
    };

    const branchStats: Record<string, { assessmentCount: number; studentCount: number }> = {
      "AI & DS": { assessmentCount: 0, studentCount: 0 },
      "AI & ML": { assessmentCount: 0, studentCount: 0 },
      "CSE": { assessmentCount: 0, studentCount: 0 },
      "Cyber Security": { assessmentCount: 0, studentCount: 0 },
    };

    // Populate student counts per year and branch from assigned cohort
    for (const s of assignedStudents) {
      const y = s.year.includes("4") ? "4th Year" : s.year.includes("3") ? "3rd Year" : s.year.includes("2") ? "2nd Year" : null;
      if (y && yearStats[y]) yearStats[y].studentCount++;

      const b = s.department.includes("AI") && s.department.includes("Data") ? "AI & DS"
        : s.department.includes("AI") || s.department.includes("ML") ? "AI & ML"
        : s.department.includes("Cyber") ? "Cyber Security"
        : s.department.includes("Computer") || s.department.includes("CSE") ? "CSE"
        : s.department === "AI & DS" ? "AI & DS" : null;

      if (b && branchStats[b]) branchStats[b].studentCount++;
    }

    // Populate assessment counts per year and branch
    for (const a of rawAssessments) {
      if (a.year && yearStats[a.year]) {
        yearStats[a.year].assessmentCount++;
      }
      if (a.branch && branchStats[a.branch]) {
        branchStats[a.branch].assessmentCount++;
      }
    }

    // Format assessments with real participation metrics
    const formatted = rawAssessments.map((a) => {
      const computedStatus = computeAssessmentStatus(a.status, a.startDate, a.endDate);
      const totalQuestions = a.aptitudeQuestions.length + a.codingProblems.length;

      // Filter attempts to assigned cohort students (or all if management)
      const relevantAttempts = user.role === "MANAGEMENT"
        ? a.attempts
        : a.attempts.filter((att) => assignedStudentIds.has(att.studentId));

      const validScores = relevantAttempts
        .map((att) => att.percentage)
        .filter((pct): pct is number => pct !== null && pct !== undefined);

      const avgScore =
        validScores.length > 0
          ? Math.round((validScores.reduce((sum, val) => sum + val, 0) / validScores.length) * 10) / 10
          : null;

      // Count cohort students matching this assessment's year and branch
      const cohortStudents = assignedStudents.filter((s) => {
        if (a.year) {
          const matchYear = (a.year === "3rd Year" && s.year.includes("3")) ||
                            (a.year === "4th Year" && s.year.includes("4")) ||
                            (a.year === "2nd Year" && s.year.includes("2"));
          if (!matchYear) return false;
        }
        if (a.branch) {
          const sDept = s.department.toUpperCase();
          const bMatch = (a.branch === "AI & DS" && (sDept.includes("AI") && (sDept.includes("DS") || sDept.includes("DATA")))) ||
                         (a.branch === "CSE" && (sDept.includes("CSE") || sDept.includes("COMPUTER"))) ||
                         (a.branch === "Cyber Security" && sDept.includes("CYBER")) ||
                         (a.branch === "AI & ML" && sDept.includes("ML"));
          if (!bMatch) return false;
        }
        return true;
      });

      const totalCohortSize = Math.max(cohortStudents.length, relevantAttempts.length);

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        type: a.type,
        difficulty: a.difficulty.toLowerCase(),
        duration: a.duration,
        totalQuestions,
        status: a.status.toLowerCase(),
        computedStatus,
        year: a.year || "3rd Year",
        branch: a.branch || "AI & DS",
        startDate: a.startDate ? a.startDate.toISOString() : null,
        endDate: a.endDate ? a.endDate.toISOString() : a.deadline ? a.deadline.toISOString() : null,
        maxMarks: a.maxMarks || 100,
        fileName: a.fileName,
        filePath: a.filePath,
        fileType: a.fileType,
        fileSize: a.fileSize,
        uploadedBy: a.createdBy?.user?.name || "Placement Cell",
        uploadedById: a.createdById,
        createdAt: a.createdAt.toISOString(),
        studentsCount: totalCohortSize,
        submissionsCount: relevantAttempts.length,
        averageScore: avgScore,
      };
    });

    // Apply filtering
    let filtered = formatted;

    if (yearFilter && yearFilter !== "All") {
      filtered = filtered.filter((a) => a.year.toLowerCase() === yearFilter.toLowerCase());
    }

    if (branchFilter && branchFilter !== "All") {
      filtered = filtered.filter((a) => a.branch.toLowerCase() === branchFilter.toLowerCase());
    }

    if (search) {
      filtered = filtered.filter((a) =>
        a.title.toLowerCase().includes(search) ||
        (a.description && a.description.toLowerCase().includes(search))
      );
    }

    if (typeFilter && typeFilter !== "ALL") {
      filtered = filtered.filter((a) => a.type.toUpperCase() === typeFilter);
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((a) =>
        a.computedStatus === statusFilter ||
        a.status === statusFilter
      );
    }

    const activeCount = formatted.filter(
      (a) => a.computedStatus === "active" || a.status === "published"
    ).length;

    return NextResponse.json({
      assessments: filtered,
      totalAssessments: filtered.length,
      activeCount,
      yearStats,
      branchStats,
      allYears: ALL_YEARS,
      allBranches: ALL_BRANCHES,
      totalCohortStudents: assignedStudents.length,
    });
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string; status?: number };
    if (error.name === "ForbiddenError" || error.status === 403) {
      return NextResponse.json(
        { error: error.message || "Forbidden: Faculty role required" },
        { status: 403 }
      );
    }
    if (error.name === "UnauthorizedError" || error.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/faculty/assessments error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/faculty/assessments
 *
 * Creates a new assessment without a binary file (or file uploaded separately).
 */
export async function POST(request: Request) {
  try {
    const user = await requireRole(["FACULTY", "MANAGEMENT"]);

    // Resolve faculty profile
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

    const body = (await request.json()) as Record<string, unknown>;
    const title = body.title as string | undefined;
    const description = body.description as string | undefined;
    const type = body.type as string | undefined;
    const year = body.year as string | undefined;
    const branch = body.branch as string | undefined;
    const startDate = body.startDate as string | undefined;
    const endDate = body.endDate as string | undefined;
    const maxMarks = body.maxMarks as string | number | undefined;
    const duration = body.duration as string | number | undefined;
    const status = body.status as string | undefined;

    // Validation
    if (!title || typeof title !== "string" || !title.trim()) {
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
    const parsedDuration = Number(duration) > 0 ? Number(duration) : 60;

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
          duration: parsedDuration,
          status: parsedStatus,
          difficulty: "medium",
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
    console.error("POST /api/faculty/assessments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
