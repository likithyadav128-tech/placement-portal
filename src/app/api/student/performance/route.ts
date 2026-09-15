import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/student/performance
 *
 * Secure endpoint to fetch real performance analytics for the authenticated student.
 * Scoped strictly to the authenticated student's real PostgreSQL data (Anti-IDOR).
 * Does not fall back to mock data under any circumstance.
 */
export async function GET(req: Request) {
  try {
    // 1. Authenticate user from cookie session
    let authUser = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!authError && user) {
        authUser = user;
      }
    } catch {
      // Unauthenticated context
    }

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Resolve User & Student
    let dbUser = await prisma.user.findUnique({
      where: { authUserId: authUser.id },
      include: { student: true },
    });

    if (!dbUser && authUser.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: authUser.email },
        include: { student: true },
      });
    }

    if (!dbUser) {
      return NextResponse.json(
        { error: "User record not found in application database." },
        { status: 404 }
      );
    }

    if (dbUser.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Forbidden: Access restricted to students." },
        { status: 403 }
      );
    }

    if (dbUser.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Forbidden: Account is not active." },
        { status: 403 }
      );
    }

    const student = dbUser.student;
    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found." },
        { status: 404 }
      );
    }

    // Parse timeRange from URL query
    const url = new URL(req.url);
    const timeRangeParam = (url.searchParams.get("timeRange") || "6M").toLowerCase().trim();

    // 3. Fetch real historical performance records
    const dbRecords = await prisma.performanceRecord.findMany({
      where: { studentId: student.id },
      orderBy: { completedAt: "asc" },
    });

    // 4. Fetch real completed assessment attempts
    const completedAttempts = await prisma.assessmentAttempt.findMany({
      where: {
        studentId: student.id,
        status: { in: ["SUBMITTED", "EVALUATED"] },
      },
      include: {
        assessment: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    // 5. Fetch real student milestones
    const dbMilestones = await prisma.performanceMilestone.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "asc" },
    });

    // Calculate cutoff date based on timeRange
    const now = new Date();
    let cutoffDate: Date | null = null;

    if (timeRangeParam === "today") {
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeRangeParam === "7d" || timeRangeParam === "7 days") {
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRangeParam === "30d" || timeRangeParam === "30 days" || timeRangeParam === "1m") {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRangeParam === "3m" || timeRangeParam === "3 months") {
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (timeRangeParam === "6m" || timeRangeParam === "6 months") {
      cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    } else if (timeRangeParam === "1y" || timeRangeParam === "1 year" || timeRangeParam === "12m") {
      cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    } else {
      cutoffDate = null; // All time
    }

    // Filter records and attempts by real date
    const slicedRecords = cutoffDate
      ? dbRecords.filter((r) => r.completedAt >= cutoffDate)
      : [...dbRecords];

    const windowAttempts = cutoffDate
      ? completedAttempts.filter((a) => a.submittedAt && a.submittedAt >= cutoffDate)
      : [...completedAttempts];

    // Compute chart data (fallback to last record if empty window to avoid blank chart)
    const recordsForChart =
      slicedRecords.length > 0
        ? slicedRecords
        : dbRecords.slice(-1);

    const chartData = recordsForChart.map((r) => ({
      month: r.month,
      date: r.completedAt.toISOString().split("T")[0],
      overall: r.percentage,
      coding: r.skillArea.toLowerCase() === "coding" ? r.percentage : student.codingScore,
      aptitude: r.skillArea.toLowerCase() === "aptitude" ? r.percentage : student.aptitudeScore,
      reasoning: student.reasoningScore,
      communication: student.communicationScore,
      title: r.title,
    }));

    // KPI Metrics calculation
    const currentScore = student.overallScore;

    // Starting score: earliest record in the selected window, or current score if no records
    const startingScore =
      slicedRecords.length > 0 ? slicedRecords[0].percentage : currentScore;

    const improvement = Math.round((currentScore - startingScore) * 10) / 10;

    // Best score across attempts/records in the selected window
    const windowPercentages = [
      ...windowAttempts
        .map((a) => a.percentage)
        .filter((p): p is number => p !== null && p !== undefined),
      ...slicedRecords.map((r) => r.percentage),
      currentScore,
    ];
    const bestScore = Math.max(...windowPercentages, 0);

    // Assessments completed count within the selected time window
    const assessmentsCompleted = windowAttempts.length;

    // Previous record for delta calculations
    const prevRecord =
      slicedRecords.length > 1
        ? slicedRecords[slicedRecords.length - 2]
        : dbRecords.length > 1
        ? dbRecords[dbRecords.length - 2]
        : null;

    const skillTrends = [
      {
        name: "Coding",
        current: student.codingScore,
        previous: prevRecord?.skillArea.toLowerCase() === "coding" ? prevRecord.percentage : student.codingScore,
        change: prevRecord?.skillArea.toLowerCase() === "coding" ? student.codingScore - prevRecord.percentage : 0,
        color: "bg-blue-600",
      },
      {
        name: "Aptitude",
        current: student.aptitudeScore,
        previous: prevRecord?.skillArea.toLowerCase() === "aptitude" ? prevRecord.percentage : student.aptitudeScore,
        change: prevRecord?.skillArea.toLowerCase() === "aptitude" ? student.aptitudeScore - prevRecord.percentage : 0,
        color: "bg-purple-600",
      },
      {
        name: "Reasoning",
        current: student.reasoningScore,
        previous: student.reasoningScore,
        change: 0,
        color: "bg-emerald-600",
      },
      {
        name: "Communication",
        current: student.communicationScore,
        previous: student.communicationScore,
        change: 0,
        color: "bg-amber-600",
      },
    ];

    // Formatted Assessment History Table rows
    const assessmentHistory = completedAttempts.map((att) => ({
      id: att.id,
      title: att.assessment.title,
      type: att.assessment.type.toLowerCase(),
      duration: att.assessment.duration,
      totalQuestions: att.assessment.totalQuestions,
      score: att.percentage !== null && att.percentage !== undefined ? att.percentage : null,
      rawScore: att.score,
      status: "Completed",
      date: att.submittedAt
        ? att.submittedAt.toISOString().split("T")[0]
        : att.startedAt.toISOString().split("T")[0],
    }));

    // Formatted Milestones
    const milestones = dbMilestones.map((m) => ({
      id: m.id,
      title: m.title,
      achieved: m.achieved,
      achievedDate: m.achievedDate ? m.achievedDate.toISOString().split("T")[0] : undefined,
    }));

    return NextResponse.json(
      {
        analytics: {
          timeRange: timeRangeParam,
          currentScore,
          startingScore,
          improvement,
          bestScore,
          assessmentsCompleted,
          chartData,
          skillTrends,
          assessmentHistory,
          milestones,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/student/performance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
