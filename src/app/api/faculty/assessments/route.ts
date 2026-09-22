import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";
import { matchesYear, matchesBranch } from "@/lib/assessment/slugs";
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

    // Calculate aggregate breakdown for Year and Branch hierarchy
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

    const cohortStats: Record<string, Record<string, { assessmentCount: number; studentCount: number }>> = {
      "4th Year": {
        "AI & DS": { assessmentCount: 0, studentCount: 0 },
        "AI & ML": { assessmentCount: 0, studentCount: 0 },
        "CSE": { assessmentCount: 0, studentCount: 0 },
        "Cyber Security": { assessmentCount: 0, studentCount: 0 },
      },
      "3rd Year": {
        "AI & DS": { assessmentCount: 0, studentCount: 0 },
        "AI & ML": { assessmentCount: 0, studentCount: 0 },
        "CSE": { assessmentCount: 0, studentCount: 0 },
        "Cyber Security": { assessmentCount: 0, studentCount: 0 },
      },
      "2nd Year": {
        "AI & DS": { assessmentCount: 0, studentCount: 0 },
        "AI & ML": { assessmentCount: 0, studentCount: 0 },
        "CSE": { assessmentCount: 0, studentCount: 0 },
        "Cyber Security": { assessmentCount: 0, studentCount: 0 },
      },
    };

    // Populate student counts per year, branch, and cohort matrix using normalized matching
    for (const s of assignedStudents) {
      for (const y of ALL_YEARS) {
        if (matchesYear(s.year, y)) {
          yearStats[y].studentCount++;
          for (const b of ALL_BRANCHES) {
            if (matchesBranch(s.department, b)) {
              cohortStats[y][b].studentCount++;
            }
          }
        }
      }

      for (const b of ALL_BRANCHES) {
        if (matchesBranch(s.department, b)) {
          branchStats[b].studentCount++;
        }
      }
    }

    // Populate assessment counts per year and branch
    for (const a of rawAssessments) {
      const aYear = a.year || "3rd Year";
      const aBranch = a.branch || "AI & DS";

      if (yearStats[aYear]) {
        yearStats[aYear].assessmentCount++;
      }
      if (branchStats[aBranch]) {
        branchStats[aBranch].assessmentCount++;
      }
      if (cohortStats[aYear]?.[aBranch]) {
        cohortStats[aYear][aBranch].assessmentCount++;
      }
    }

    // Format assessments with strictly cohort-authorized participation metrics
    const formatted = rawAssessments.map((a) => {
      const computedStatus = computeAssessmentStatus(a.status, a.startDate, a.endDate);
      const totalQuestions = a.aptitudeQuestions.length + a.codingProblems.length;
      const targetYear = a.year || "3rd Year";
      const targetBranch = a.branch || "AI & DS";

      // 1. Identify eligible students assigned to this faculty matching this assessment's Year and Branch
      const cohortStudents = assignedStudents.filter(
        (s) => matchesYear(s.year, targetYear) && matchesBranch(s.department, targetBranch)
      );
      const cohortStudentIds = new Set(cohortStudents.map((s) => s.id));

      // 2. Identify attempts submitted by these specific cohort students
      const cohortAttempts = a.attempts.filter((att) => cohortStudentIds.has(att.studentId));

      // 3. Count DISTINCT students in the cohort who attempted
      const attemptedStudentIds = new Set(cohortAttempts.map((att) => att.studentId));

      // 4. Calculate best scores for attempted students
      const bestPercentages: number[] = [];
      for (const sId of attemptedStudentIds) {
        const studentAttempts = cohortAttempts.filter((att) => att.studentId === sId);
        const validScores = studentAttempts
          .map((att) => att.percentage)
          .filter((pct): pct is number => pct !== null && pct !== undefined);
        if (validScores.length > 0) {
          bestPercentages.push(Math.max(...validScores));
        }
      }

      const avgScore =
        bestPercentages.length > 0
          ? Math.round((bestPercentages.reduce((sum, val) => sum + val, 0) / bestPercentages.length) * 10) / 10
          : null;

      const studentsCount = cohortStudents.length;
      const submissionsCount = attemptedStudentIds.size;
      const notAttemptedCount = Math.max(0, studentsCount - submissionsCount);

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
        year: targetYear,
        branch: targetBranch,
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
        studentsCount,
        submissionsCount,
        notAttemptedCount,
        averageScore: avgScore,
      };
    });

    // Apply filtering
    let filtered = formatted;

    if (yearFilter && yearFilter !== "All") {
      filtered = filtered.filter(
        (a) => a.year.toLowerCase() === yearFilter.toLowerCase() ||
               matchesYear(a.year, yearFilter) ||
               matchesYear(yearFilter, a.year)
      );
    }

    if (branchFilter && branchFilter !== "All") {
      filtered = filtered.filter(
        (a) => a.branch.toLowerCase() === branchFilter.toLowerCase() ||
               matchesBranch(a.branch, branchFilter) ||
               matchesBranch(branchFilter, a.branch)
      );
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
      if (statusFilter === "completed") {
        filtered = filtered.filter((a) =>
          a.computedStatus === "closed" ||
          a.status === "archived" ||
          a.submissionsCount > 0 ||
          a.computedStatus === "active" ||
          a.status === "published"
        );
      } else {
        filtered = filtered.filter((a) =>
          a.computedStatus === statusFilter ||
          a.status === statusFilter
        );
      }
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
      cohortStats,
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
