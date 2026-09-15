import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/student/roadmap
 * Returns real personalized roadmap items with student's real progress.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await withDbRetry(() =>
      prisma.user.findFirst({
        where: {
          OR: [{ authUserId: authUser.id }, { email: authUser.email || "" }],
        },
        include: { student: true },
      })
    );

    if (!dbUser || dbUser.role !== "STUDENT" || !dbUser.student) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const student = dbUser.student;

    // Fetch all published roadmap items
    const items = await withDbRetry(() =>
      prisma.roadmapItem.findMany({
        orderBy: [{ order: "asc" }],
        include: {
          progressRecords: {
            where: { studentId: student.id },
          },
        },
      })
    );

    const mappedItems = items.map((item) => {
      const record = item.progressRecords[0];
      const status = record ? record.status : "NOT_STARTED";

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        phase: item.phase, // FOUNDATION, CURRENT, UPCOMING
        order: item.order,
        estimatedHours: item.estimatedHours,
        skills: item.skills,
        resources: item.resources,
        status: status.toLowerCase(), // "completed" | "in_progress" | "not_started"
        startedAt: record?.startedAt,
        completedAt: record?.completedAt,
      };
    });

    const totalCount = mappedItems.length;
    const completedCount = mappedItems.filter((i) => i.status === "completed").length;
    const progressPercentage =
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return NextResponse.json({
      items: mappedItems,
      totalCount,
      completedCount,
      progressPercentage,
    });
  } catch (error) {
    console.error("GET /api/student/roadmap error:", error);
    return NextResponse.json(
      { error: "Failed to load roadmap data." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/student/roadmap
 * Updates progress status for a specific roadmap item.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await withDbRetry(() =>
      prisma.user.findFirst({
        where: {
          OR: [{ authUserId: authUser.id }, { email: authUser.email || "" }],
        },
        include: { student: true },
      })
    );

    if (!dbUser || dbUser.role !== "STUDENT" || !dbUser.student) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const studentId = dbUser.student.id;
    const body = (await req.json()) as { roadmapItemId?: string; status?: string };
    const { roadmapItemId, status } = body; // status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"

    if (!roadmapItemId || !status) {
      return NextResponse.json(
        { error: "roadmapItemId and status are required." },
        { status: 400 }
      );
    }

    const validStatus = status.toUpperCase();
    if (!["NOT_STARTED", "IN_PROGRESS", "COMPLETED"].includes(validStatus)) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    const record = await withDbRetry(() =>
      prisma.studentRoadmapProgress.upsert({
        where: {
          studentId_roadmapItemId: {
            studentId,
            roadmapItemId,
          },
        },
        create: {
          studentId,
          roadmapItemId,
          status: validStatus as any,
          startedAt: validStatus !== "NOT_STARTED" ? new Date() : null,
          completedAt: validStatus === "COMPLETED" ? new Date() : null,
        },
        update: {
          status: validStatus as any,
          completedAt: validStatus === "COMPLETED" ? new Date() : null,
        },
      })
    );

    return NextResponse.json({
      success: true,
      record,
    });
  } catch (error) {
    console.error("POST /api/student/roadmap error:", error);
    return NextResponse.json(
      { error: "Failed to update roadmap progress." },
      { status: 500 }
    );
  }
}
