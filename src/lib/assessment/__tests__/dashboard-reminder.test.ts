import assert from "node:assert";

interface Attempt {
  status: string;
  percentage?: number | null;
  startedAt: Date;
}

interface Assessment {
  id: string;
  title: string;
  type: string;
  duration: number;
  totalQuestions: number;
  difficulty: string;
  attempts: Attempt[];
}

interface Reminder {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

function processDashboardAssessments(publishedAssessments: Assessment[], nowTimestamp = Date.now()) {
  const processedAssessments = publishedAssessments.map((a) => {
    const completedAttempts = a.attempts.filter(
      (att) => att.status === "SUBMITTED" || att.status === "EVALUATED"
    );
    const isCompleted = completedAttempts.length > 0;
    const bestScore = isCompleted
      ? Math.max(...completedAttempts.map((att) => Math.round(att.percentage || 0)))
      : undefined;

    const inProgressAttempt = a.attempts.find((att) => {
      if (att.status !== "IN_PROGRESS") return false;
      const elapsedSeconds = Math.floor((nowTimestamp - att.startedAt.getTime()) / 1000);
      return elapsedSeconds < a.duration * 60;
    });

    return {
      id: a.id,
      title: a.title,
      type: a.type.toLowerCase(),
      duration: a.duration,
      totalQuestions: a.totalQuestions,
      difficulty: a.difficulty,
      isCompleted,
      bestScore,
      isInProgress: Boolean(inProgressAttempt),
    };
  });

  const pendingAssessments = processedAssessments.filter((a) => !a.isCompleted);
  const completedAssessments = processedAssessments.filter((a) => a.isCompleted);

  const upcomingAssessments = pendingAssessments.slice(0, 3).map((a) => ({
    id: a.id,
    title: a.title,
    type: a.type,
    duration: a.duration,
    totalQuestions: a.totalQuestions,
    difficulty: a.difficulty,
  }));

  const reminders: Reminder[] = [];

  if (pendingAssessments.length > 0) {
    const pendingAssignment = pendingAssessments[0];
    if (pendingAssignment.isInProgress) {
      reminders.push({
        id: "rem-assess",
        title: "Resume Placement Assignment",
        description: `Assignment "${pendingAssignment.title}" is in progress. Continue to complete your submission.`,
        actionLabel: "Continue Assignment",
        actionUrl: "/student/assignments",
        priority: "MEDIUM",
      });
    } else {
      reminders.push({
        id: "rem-assess",
        title: "Placement Assignment Available",
        description: `Benchmark assignment "${pendingAssignment.title}" is ready for completion.`,
        actionLabel: "Start Assignment",
        actionUrl: "/student/assignments",
        priority: "MEDIUM",
      });
    }
  } else if (completedAssessments.length > 0) {
    const improvable = [...completedAssessments].sort(
      (a, b) => (a.bestScore ?? 0) - (b.bestScore ?? 0)
    )[0];

    if (improvable && (improvable.bestScore ?? 0) < 70) {
      reminders.push({
        id: "rem-assess",
        title: "Improve Assignment Benchmark",
        description: `Retake "${improvable.title}" (current best: ${improvable.bestScore}%) to strengthen your placement readiness score.`,
        actionLabel: "Retake Assignment",
        actionUrl: "/student/assignments",
        priority: "LOW",
      });
    }
  }

  return { upcomingAssessments, reminders };
}

async function runDashboardReminderTests() {
  console.log("=== RUNNING DASHBOARD ASSIGNMENT REMINDER TESTS ===");

  const coreAlgo: Assessment = {
    id: "5ee35c47-d81c-4e5e-b349-9f16adc2447a",
    title: "Core Algorithms & Problem Solving Benchmark",
    type: "CODING",
    duration: 60,
    totalQuestions: 5,
    difficulty: "medium",
    attempts: [],
  };

  const quantLogical: Assessment = {
    id: "1b78877c-1dc8-4ec0-be17-918299caf6de",
    title: "Quantitative & Logical Placement Benchmark",
    type: "APTITUDE",
    duration: 30,
    totalQuestions: 10,
    difficulty: "medium",
    attempts: [],
  };

  // Test 1: Neither assignment completed -> shows first pending assignment
  {
    const { upcomingAssessments, reminders } = processDashboardAssessments([
      { ...coreAlgo, attempts: [] },
      { ...quantLogical, attempts: [] },
    ]);
    const rem = reminders.find((r) => r.id === "rem-assess");
    assert(rem, "Must have rem-assess reminder");
    assert.strictEqual(rem?.title, "Placement Assignment Available");
    assert(rem?.description.includes("Core Algorithms"));
    assert.strictEqual(upcomingAssessments.length, 2);
    console.log("✅ Test 1 Passed: Uncompleted assignments trigger 'Placement Assignment Available'");
  }

  // Test 2: Core Algorithms completed with 100%, Quantitative & Logical NOT completed
  // Core Algorithms MUST NOT appear as available; Quantitative & Logical MUST appear
  {
    const { upcomingAssessments, reminders } = processDashboardAssessments([
      {
        ...coreAlgo,
        attempts: [
          { status: "SUBMITTED", percentage: 100, startedAt: new Date(Date.now() - 3600000) },
        ],
      },
      { ...quantLogical, attempts: [] },
    ]);
    const rem = reminders.find((r) => r.id === "rem-assess");
    assert(rem, "Must have rem-assess reminder");
    assert.strictEqual(rem?.title, "Placement Assignment Available");
    assert(
      rem?.description.includes("Quantitative & Logical Placement Benchmark"),
      "Must show Quantitative & Logical, NOT Core Algorithms"
    );
    assert(
      !rem?.description.includes("Core Algorithms"),
      "Core Algorithms must NOT be shown as available once completed"
    );
    assert.strictEqual(upcomingAssessments.length, 1);
    assert.strictEqual(upcomingAssessments[0].title, "Quantitative & Logical Placement Benchmark");
    console.log("✅ Test 2 Passed: Completed 100% Core Algorithms is NOT shown; pending Quantitative is shown");
  }

  // Test 3: Both Core Algorithms (100%) and Quantitative & Logical (40%) completed
  // Neither should show 'ready for completion'; should show improvement action for Quantitative (40%)
  {
    const { upcomingAssessments, reminders } = processDashboardAssessments([
      {
        ...coreAlgo,
        attempts: [
          { status: "SUBMITTED", percentage: 100, startedAt: new Date(Date.now() - 7200000) },
        ],
      },
      {
        ...quantLogical,
        attempts: [
          { status: "SUBMITTED", percentage: 40, startedAt: new Date(Date.now() - 3600000) },
        ],
      },
    ]);
    const rem = reminders.find((r) => r.id === "rem-assess");
    assert(rem, "Must have rem-assess reminder for improvement");
    assert.strictEqual(rem?.title, "Improve Assignment Benchmark");
    assert(
      rem?.description.includes("Quantitative & Logical"),
      "Must recommend improving lowest scoring assessment"
    );
    assert(
      rem?.description.includes("40%"),
      "Must show actual best score (40%)"
    );
    assert.strictEqual(rem?.actionLabel, "Retake Assignment");
    assert.strictEqual(upcomingAssessments.length, 0, "No upcoming pending assessments");
    console.log("✅ Test 3 Passed: Low score completed assessment generates improvement reminder, not stale available reminder");
  }

  // Test 4: Both assignments completed with high scores (100% and 85%) -> reminder is cleanly hidden
  {
    const { upcomingAssessments, reminders } = processDashboardAssessments([
      {
        ...coreAlgo,
        attempts: [
          { status: "SUBMITTED", percentage: 100, startedAt: new Date(Date.now() - 7200000) },
        ],
      },
      {
        ...quantLogical,
        attempts: [
          { status: "SUBMITTED", percentage: 85, startedAt: new Date(Date.now() - 3600000) },
        ],
      },
    ]);
    const rem = reminders.find((r) => r.id === "rem-assess");
    assert.strictEqual(rem, undefined, "When all assignments are mastered (>=70%), rem-assess is hidden");
    assert.strictEqual(upcomingAssessments.length, 0);
    console.log("✅ Test 4 Passed: Mastered assignments (>=70%) cleanly hide assignment reminder");
  }

  // Test 5: In-progress assignment shows "Resume Placement Assignment"
  {
    const { reminders } = processDashboardAssessments([
      {
        ...coreAlgo,
        attempts: [
          { status: "SUBMITTED", percentage: 100, startedAt: new Date(Date.now() - 7200000) },
        ],
      },
      {
        ...quantLogical,
        attempts: [
          { status: "IN_PROGRESS", percentage: null, startedAt: new Date(Date.now() - 60000) }, // 1 min ago
        ],
      },
    ]);
    const rem = reminders.find((r) => r.id === "rem-assess");
    assert(rem, "Must have rem-assess reminder");
    assert.strictEqual(rem?.title, "Resume Placement Assignment");
    assert.strictEqual(rem?.actionLabel, "Continue Assignment");
    console.log("✅ Test 5 Passed: Active in-progress assignment prompts to resume");
  }

  console.log("\n🎉 All 5/5 Dashboard Assignment Reminder Tests Passed Successfully!");
}

runDashboardReminderTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
