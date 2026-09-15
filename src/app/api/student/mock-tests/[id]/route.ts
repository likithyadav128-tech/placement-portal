import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/student/mock-tests/[id]
 * Loads mock test details, 4-level question bank (sanitized), and initializes or returns active attempt.
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id: mockTestId } = await params;
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

    // Fetch mock test
    const mockTest = await withDbRetry(() =>
      prisma.mockTest.findUnique({
        where: { id: mockTestId },
      })
    );

    if (!mockTest || mockTest.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Mock test not found or not published." },
        { status: 404 }
      );
    }

    // Check for existing in-progress attempt or create a new one
    let attempt = await withDbRetry(() =>
      prisma.mockTestAttempt.findFirst({
        where: {
          mockTestId,
          studentId,
          status: "IN_PROGRESS",
        },
        orderBy: { startedAt: "desc" },
      })
    );

    const now = Date.now();
    const isExpired =
      attempt && Math.floor((now - attempt.startedAt.getTime()) / 1000) > mockTest.duration * 60;

    if (!attempt || isExpired) {
      attempt = await withDbRetry(() =>
        prisma.mockTestAttempt.create({
          data: {
            mockTestId,
            studentId,
            status: "IN_PROGRESS",
            startedAt: new Date(),
          },
        })
      );
    }

    const timeElapsedSeconds = Math.floor(
      (Date.now() - attempt.startedAt.getTime()) / 1000
    );
    const timeLeftSeconds = Math.max(0, mockTest.duration * 60 - timeElapsedSeconds);

    // Sanitize levels: remove `correctAnswer` before sending to browser
    const rawLevels = (mockTest.levels as any) || {};

    const sanitizedLevels = {
      level1: {
        title: rawLevels.level1?.title || "Level 1: Aptitude & Reasoning",
        description: rawLevels.level1?.description || "",
        timeMinutes: rawLevels.level1?.timeMinutes || 30,
        questions: (rawLevels.level1?.questions || []).map((q: any) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          marks: q.marks,
        })),
      },
      level2: {
        title: rawLevels.level2?.title || "Level 2: Verbal Ability",
        description: rawLevels.level2?.description || "",
        timeMinutes: rawLevels.level2?.timeMinutes || 25,
        questions: (rawLevels.level2?.questions || []).map((q: any) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          marks: q.marks,
        })),
      },
      level3: {
        title: rawLevels.level3?.title || "Level 3: Course Theory",
        description: rawLevels.level3?.description || "",
        department: rawLevels.level3?.department || mockTest.departmentTag,
        course: rawLevels.level3?.course || mockTest.courseTag,
        timeMinutes: rawLevels.level3?.timeMinutes || 30,
        questions: (rawLevels.level3?.questions || []).map((q: any) => ({
          id: q.id,
          subject: q.subject,
          topic: q.topic,
          difficulty: q.difficulty,
          question: q.question,
          options: q.options,
          marks: q.marks,
        })),
      },
      level4: {
        title: rawLevels.level4?.title || "Level 4: Live Coding (5 Problems)",
        description: rawLevels.level4?.description || "",
        timeMinutes: rawLevels.level4?.timeMinutes || 35,
        problems: (rawLevels.level4?.problems || []).map((p: any) => ({
          id: p.id,
          tier: p.tier,
          order: p.order,
          title: p.title,
          difficulty: p.difficulty,
          description: p.description,
          examples: p.examples,
          constraints: p.constraints,
          starterCode: p.starterCode,
          testCases: (p.testCases || []).map((tc: any) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            hidden: tc.hidden,
          })),
        })),
      },
    };

    return NextResponse.json({
      mockTest: {
        id: mockTest.id,
        name: mockTest.name,
        company: mockTest.company,
        duration: mockTest.duration,
        difficulty: mockTest.difficulty,
        totalQuestions: mockTest.totalQuestions,
        courseTag: mockTest.courseTag,
        departmentTag: mockTest.departmentTag,
      },
      attempt: {
        id: attempt.id,
        startedAt: attempt.startedAt,
        status: attempt.status,
      },
      timeLeftSeconds,
      levels: sanitizedLevels,
    });
  } catch (error) {
    console.error("GET /api/student/mock-tests/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to load mock test questions." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/student/mock-tests/[id]
 * Submits and grades the 4-level mock test attempt immutably.
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: mockTestId } = await params;
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
    const body = (await req.json()) as { attemptId?: string; answers?: any };
    const { attemptId, answers } = body;

    // Verify attempt ownership and active status
    const attempt = await withDbRetry(() =>
      prisma.mockTestAttempt.findUnique({
        where: { id: attemptId },
        include: { mockTest: true },
      })
    );

    if (!attempt || attempt.studentId !== studentId) {
      return NextResponse.json(
        { error: "Attempt not found or unauthorized." },
        { status: 404 }
      );
    }

    if (attempt.status === "SUBMITTED" || attempt.status === "EVALUATED") {
      return NextResponse.json(
        {
          error: "This attempt has already been submitted and is immutable.",
          percentage: attempt.percentage,
          score: attempt.score,
          levelScores: attempt.levelScores,
        },
        { status: 400 }
      );
    }

    const mockTest = attempt.mockTest;
    const rawLevels = (mockTest.levels as any) || {};

    // ------------------------------------------
    // Grade Level 1: Aptitude & Reasoning
    // ------------------------------------------
    const l1Questions: any[] = rawLevels.level1?.questions || [];
    let l1Score = 0;
    const l1Total = l1Questions.length * 2;
    const l1Answers = answers?.level1 || {};

    for (const q of l1Questions) {
      const selected = l1Answers[q.id];
      if (typeof selected === "number" && selected === q.correctAnswer) {
        l1Score += q.marks || 2;
      }
    }
    const l1Pct = l1Total > 0 ? Math.round((l1Score / l1Total) * 100) : 0;

    // ------------------------------------------
    // Grade Level 2: Verbal Ability
    // ------------------------------------------
    const l2Questions: any[] = rawLevels.level2?.questions || [];
    let l2Score = 0;
    const l2Total = l2Questions.length * 2;
    const l2Answers = answers?.level2 || {};

    for (const q of l2Questions) {
      const selected = l2Answers[q.id];
      if (typeof selected === "number" && selected === q.correctAnswer) {
        l2Score += q.marks || 2;
      }
    }
    const l2Pct = l2Total > 0 ? Math.round((l2Score / l2Total) * 100) : 0;

    // ------------------------------------------
    // Grade Level 3: Course Theory
    // ------------------------------------------
    const l3Questions: any[] = rawLevels.level3?.questions || [];
    let l3Score = 0;
    const l3Total = l3Questions.length * 2;
    const l3Answers = answers?.level3 || {};

    for (const q of l3Questions) {
      const selected = l3Answers[q.id];
      if (typeof selected === "number" && selected === q.correctAnswer) {
        l3Score += q.marks || 2;
      }
    }
    const l3Pct = l3Total > 0 ? Math.round((l3Score / l3Total) * 100) : 0;

    // ------------------------------------------
    // Grade Level 4: Live Coding (5 Problems)
    // ------------------------------------------
    const l4Problems: any[] = rawLevels.level4?.problems || [];
    let l4Score = 0;
    const l4Total = l4Problems.length * 20; // 20 marks each, total 100
    const l4Submissions = answers?.level4 || {}; // { [problemId]: { passedTests: number, totalTests: number } }

    for (const p of l4Problems) {
      const sub = l4Submissions[p.id];
      if (sub && sub.totalTests > 0) {
        const passRatio = sub.passedTests / sub.totalTests;
        l4Score += Math.round(passRatio * 20);
      }
    }
    const l4Pct = l4Total > 0 ? Math.round((l4Score / l4Total) * 100) : 0;

    // Overall Weighted Percentage (25% per level)
    const overallPercentage = Math.round(
      l1Pct * 0.25 + l2Pct * 0.25 + l3Pct * 0.25 + l4Pct * 0.25
    );

    const levelScores = {
      level1: { score: l1Score, maxScore: l1Total, percentage: l1Pct },
      level2: { score: l2Score, maxScore: l2Total, percentage: l2Pct },
      level3: { score: l3Score, maxScore: l3Total, percentage: l3Pct },
      level4: { score: l4Score, maxScore: l4Total, percentage: l4Pct },
    };

    const timeSpentSeconds = Math.floor(
      (Date.now() - attempt.startedAt.getTime()) / 1000
    );

    // Immutably submit attempt
    const submittedAttempt = await withDbRetry(() =>
      prisma.mockTestAttempt.update({
        where: { id: attemptId },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
          score: l1Score + l2Score + l3Score + l4Score,
          percentage: overallPercentage,
          timeSpent: timeSpentSeconds,
          levelScores,
          answers: answers || {},
        },
      })
    );

    // Record immutable PerformanceRecord
    const month = new Date().toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });

    await withDbRetry(() =>
      prisma.performanceRecord.create({
        data: {
          studentId,
          sourceType: "MOCK_TEST",
          sourceId: mockTest.id,
          title: mockTest.name,
          score: overallPercentage,
          maxScore: 100,
          percentage: overallPercentage,
          skillArea: "overall",
          month,
          completedAt: new Date(),
        },
      })
    );

    // Update student's overall readiness
    const student = dbUser.student;
    const newOverall = Math.round(
      ((student.overallScore || 50) * 0.7) + (overallPercentage * 0.3)
    );
    await withDbRetry(() =>
      prisma.student.update({
        where: { id: studentId },
        data: {
          overallScore: newOverall,
          lastActivity: new Date(),
        },
      })
    );

    return NextResponse.json({
      success: true,
      message: "Mock test submitted and evaluated successfully.",
      attemptId: submittedAttempt.id,
      overallPercentage,
      levelScores,
    });
  } catch (error) {
    console.error("POST /api/student/mock-tests/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate and submit mock test." },
      { status: 500 }
    );
  }
}
