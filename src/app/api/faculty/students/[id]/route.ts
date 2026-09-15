import { NextResponse } from "next/server";
import { requireRole, requireFacultyAccessToStudent } from "@/lib/auth/rbac";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/faculty/students/[id]
 *
 * Returns detailed student profile, performance history, and assessment records.
 * Strict RBAC & Anti-IDOR:
 * 1. Requires Role.FACULTY.
 * 2. Enforces FacultyStudentAssignment: returns 403 Forbidden if student is not assigned to this faculty.
 * 3. Returns 404 if student does not exist.
 */
export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("FACULTY");
    const params = await props.params;
    const studentIdentifier = params.id;

    if (!studentIdentifier) {
      return NextResponse.json(
        { error: "Student ID parameter is required" },
        { status: 400 }
      );
    }

    const student = await withDbRetry(() =>
      prisma.student.findFirst({
        where: {
          OR: [{ id: studentIdentifier }, { rollNumber: studentIdentifier }],
        },
        include: {
          user: {
            select: { name: true, email: true, avatarUrl: true },
          },
          performanceHistory: {
            orderBy: { completedAt: "asc" },
          },
          assessmentAttempts: {
            where: { status: { in: ["SUBMITTED", "EVALUATED"] } },
            orderBy: { submittedAt: "desc" },
            include: {
              assessment: {
                select: { title: true, type: true, duration: true },
              },
            },
          },
          facultyNotes: {
            orderBy: { createdAt: "desc" },
          },
        },
      })
    );

    if (!student) {
      return NextResponse.json(
        { error: "Student not found in institutional database." },
        { status: 404 }
      );
    }

    // Enforce FacultyStudentAssignment anti-IDOR check
    await requireFacultyAccessToStudent(student.id);

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        avatarUrl: student.user.avatarUrl,
        rollNumber: student.rollNumber,
        department: student.department,
        year: student.year,
        skills: student.skills,
        placementReadiness: student.placementReadiness,
        overallScore: student.overallScore,
        codingScore: student.codingScore,
        aptitudeScore: student.aptitudeScore,
        reasoningScore: student.reasoningScore,
        communicationScore: student.communicationScore,
        trend: student.trend,
        status: student.status,
        lastActivity: student.lastActivity.toISOString(),
      },
      performanceHistory: student.performanceHistory.map((p) => ({
        id: p.id,
        title: p.title,
        skillArea: p.skillArea,
        score: p.score,
        maxScore: p.maxScore,
        percentage: p.percentage,
        month: p.month,
        completedAt: p.completedAt.toISOString(),
      })),
      assessmentHistory: student.assessmentAttempts.map((a) => ({
        id: a.id,
        title: a.assessment.title,
        type: a.assessment.type,
        duration: a.assessment.duration,
        score: a.percentage,
        submittedAt: a.submittedAt?.toISOString() || null,
        status: a.status,
      })),
      notes: student.facultyNotes.map((n) => ({
        id: n.id,
        note: n.note,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string; status?: number };
    if (error.name === "ForbiddenError" || error.status === 403) {
      return NextResponse.json(
        { error: error.message || "Forbidden: You are not assigned to this student." },
        { status: 403 }
      );
    }
    if (error.name === "UnauthorizedError" || error.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/faculty/students/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
