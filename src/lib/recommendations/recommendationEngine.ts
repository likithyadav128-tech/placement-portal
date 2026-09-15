import { prisma } from "@/lib/prisma";
import { Priority } from "@prisma/client";

export interface GeneratedRecommendation {
  key: string;
  title: string;
  description: string;
  reason: string;
  priority: Priority;
  expectedBenefit: string;
  category: string;
  actionLabel: string;
  actionUrl: string;
  sortWeight: number; // Lower number = higher priority / more critical
}

/**
 * Deterministic recommendation engine for student placement readiness.
 *
 * Rules:
 * - Score Bands:
 *   0–39: Critical weakness (HIGH priority)
 *   40–59: Needs improvement (MEDIUM priority)
 *   60–74: Developing
 *   75–89: Strong
 *   90–100: Excellent
 *
 * - Rule 1 (Coding):
 *   < 40: HIGH priority ("Build Coding Fundamentals")
 *   40–59: MEDIUM priority ("Strengthen Coding Problem Solving")
 *   >= 60: No basic coding weakness recommendation
 *
 * - Rule 2 (Aptitude):
 *   < 40: HIGH priority ("Build Quantitative Aptitude")
 *   40–59: MEDIUM priority ("Improve Quantitative & Logical Reasoning")
 *   >= 60: No basic aptitude weakness recommendation
 *
 * - Rule 3 (Communication):
 *   < 40: HIGH priority ("Improve Communication Skills")
 *   40–59: MEDIUM priority ("Enhance Professional Communication")
 *   >= 60: No weakness recommendation
 *
 * - Rule 4 (Placement Readiness):
 *   < 50: "Build Overall Placement Readiness"
 *
 * - Rule 5 (Assessment Completion):
 *   Recommend published assessments that the student hasn't completed yet
 *
 * Idempotence:
 * - Deterministic identification prevents duplicate rows on repeated runs.
 */
export async function generateRecommendationsForStudent(
  studentId: string
): Promise<GeneratedRecommendation[]> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      assessmentAttempts: {
        include: { assessment: true },
      },
      performanceHistory: true,
    },
  });

  if (!student) {
    throw new Error(`Student with ID ${studentId} not found.`);
  }

  const publishedAssessments = await prisma.assessment.findMany({
    where: { status: "PUBLISHED" },
  });

  const candidates: GeneratedRecommendation[] = [];

  // RULE 1 — CODING
  if (student.codingScore < 40) {
    candidates.push({
      key: "rec-coding-fundamentals",
      title: "Build Coding Fundamentals",
      description:
        `Your coding score is currently ${Math.round(student.codingScore)}%, which is below the placement benchmark. Start with arrays, strings, hash maps, and basic problem-solving patterns.`,
      reason: `Coding score is ${Math.round(student.codingScore)}%, below the 40% benchmark.`,
      priority: Priority.HIGH,
      expectedBenefit:
        "Builds essential algorithmic thinking needed to clear initial technical coding rounds.",
      category: "Coding",
      actionLabel: "Practice Coding",
      actionUrl: "/student/assessments/coding",
      sortWeight: student.codingScore,
    });
  } else if (student.codingScore < 60) {
    candidates.push({
      key: "rec-coding-strengthen",
      title: "Strengthen Coding Problem Solving",
      description:
        `Your coding score is ${Math.round(student.codingScore)}%. Deepen your practice with dynamic programming, trees, and graph algorithms.`,
      reason: `Coding score is ${Math.round(student.codingScore)}%, in the developing range.`,
      priority: Priority.MEDIUM,
      expectedBenefit:
        "Increases test-case pass rate and speeds up implementation during live coding rounds.",
      category: "Coding",
      actionLabel: "Practice Coding",
      actionUrl: "/student/assessments/coding",
      sortWeight: student.codingScore,
    });
  }

  // RULE 2 — APTITUDE
  if (student.aptitudeScore < 40) {
    candidates.push({
      key: "rec-aptitude-fundamentals",
      title: "Build Quantitative Aptitude",
      description:
        `Your aptitude score is currently ${Math.round(student.aptitudeScore)}%. Master core arithmetic topics including percentages, ratios, time & work, and number series.`,
      reason: `Aptitude score is ${Math.round(student.aptitudeScore)}%, below the 40% threshold.`,
      priority: Priority.HIGH,
      expectedBenefit:
        "Establishes strong numerical calculation ability required for entrance screening.",
      category: "Aptitude",
      actionLabel: "Practice Aptitude",
      actionUrl: "/student/assessments/aptitude",
      sortWeight: student.aptitudeScore,
    });
  } else if (student.aptitudeScore < 60) {
    candidates.push({
      key: "rec-aptitude-improve",
      title: "Improve Quantitative & Logical Reasoning",
      description:
        `Your aptitude score is currently ${Math.round(student.aptitudeScore)}%. Strengthen quantitative and logical reasoning before moving to advanced placement assessments.`,
      reason: `Aptitude score is at ${Math.round(student.aptitudeScore)}%, requiring improvement to reliably clear company cutoffs.`,
      priority: Priority.MEDIUM,
      expectedBenefit:
        "Significantly improves accuracy and sectional speed across aptitude assessments.",
      category: "Aptitude",
      actionLabel: "Practice Aptitude",
      actionUrl: "/student/assessments/aptitude",
      sortWeight: student.aptitudeScore,
    });
  }

  // RULE 3 — COMMUNICATION
  if (student.communicationScore < 40) {
    candidates.push({
      key: "rec-communication-fundamentals",
      title: "Improve Communication Skills",
      description:
        "Your communication score is below benchmark. Focus on professional articulation, active listening, and technical presentation.",
      reason: `Communication score is ${Math.round(student.communicationScore)}%, below the 40% benchmark.`,
      priority: Priority.HIGH,
      expectedBenefit:
        "Vital for group discussions, technical presentations, and HR behavioral interviews.",
      category: "Communication",
      actionLabel: "Explore Assessments",
      actionUrl: "/student/assessments",
      sortWeight: student.communicationScore,
    });
  } else if (student.communicationScore < 60) {
    candidates.push({
      key: "rec-communication-develop",
      title: "Enhance Professional Communication",
      description:
        "Refine structured response techniques (such as the STAR method) for behavioral and situational interview questions.",
      reason: `Communication score is ${Math.round(student.communicationScore)}%.`,
      priority: Priority.MEDIUM,
      expectedBenefit: "Delivers crisp, structured answers under interview conditions.",
      category: "Communication",
      actionLabel: "Explore Assessments",
      actionUrl: "/student/assessments",
      sortWeight: student.communicationScore,
    });
  }

  // RULE 4 — UNCOMPLETED PUBLISHED ASSESSMENTS
  const completedAssessmentIds = new Set(
    student.assessmentAttempts
      .filter((a) => a.status === "SUBMITTED" || a.status === "EVALUATED")
      .map((a) => a.assessmentId)
  );

  const uncompletedAssessments = publishedAssessments.filter(
    (a) => !completedAssessmentIds.has(a.id)
  );

  if (uncompletedAssessments.length > 0) {
    const nextAssessment = uncompletedAssessments[0];
    const targetUrl =
      nextAssessment.type === "CODING"
        ? "/student/assessments/coding"
        : "/student/assessments/aptitude";

    candidates.push({
      key: `rec-complete-assessment-${nextAssessment.id}`,
      title: `Complete ${nextAssessment.title}`,
      description: `Evaluate your competency in ${nextAssessment.type.toLowerCase()} by completing this ${nextAssessment.duration}-minute benchmark assessment.`,
      reason: "Published benchmark assessment awaiting evaluation.",
      priority: Priority.MEDIUM,
      expectedBenefit:
        "Generates objective performance data and refines your placement readiness metrics.",
      category: "Assessment",
      actionLabel: "Start Assessment",
      actionUrl: targetUrl,
      sortWeight: 50,
    });
  }

  // RULE 5 — PLACEMENT READINESS
  if (student.placementReadiness < 50 && candidates.length < 5) {
    candidates.push({
      key: "rec-placement-readiness",
      title: "Build Overall Placement Readiness",
      description:
        `Your overall placement readiness is at ${Math.round(student.placementReadiness)}%. Multiple preparation areas still need development to meet top campus recruitment criteria.`,
      reason: `Overall placement readiness is ${Math.round(student.placementReadiness)}%, below the 50% target.`,
      priority: Priority.MEDIUM,
      expectedBenefit:
        "Balances aptitude, coding, and communication to clear all interview stages.",
      category: "Placement Readiness",
      actionLabel: "Explore Assessments",
      actionUrl: "/student/assessments",
      sortWeight: student.placementReadiness + 10,
    });
  }

  // SORTING:
  // 1. HIGH before MEDIUM before LOW
  // 2. Lowest sortWeight first (weakest score)
  // 3. Prefer core technical domain (Coding before Aptitude before Communication)
  const priorityOrder: Record<Priority, number> = {
    [Priority.HIGH]: 1,
    [Priority.MEDIUM]: 2,
    [Priority.LOW]: 3,
  };

  const categoryOrder: Record<string, number> = {
    Coding: 1,
    Aptitude: 2,
    Communication: 3,
    Assessment: 4,
    "Placement Readiness": 5,
  };

  candidates.sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    const wDiff = a.sortWeight - b.sortWeight;
    if (wDiff !== 0) return wDiff;
    return (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99);
  });

  // Limit to top 4 recommendations
  return candidates.slice(0, 4);
}

/**
 * Synchronizes generated recommendations to the PostgreSQL database for a student.
 * Guarantees strict idempotence:
 * - Upserts active recommendations matching by studentId and title.
 * - Prunes any existing recommendations that are no longer applicable.
 */
export async function syncRecommendationsForStudent(
  studentId: string
) {
  const generated = await generateRecommendationsForStudent(studentId);

  const existing = await prisma.recommendation.findMany({
    where: { studentId },
  });

  const generatedTitles = new Set(generated.map((g) => g.title));

  // Prune any recommendations that no longer match the current profile
  const toDelete = existing.filter((e) => !generatedTitles.has(e.title));
  if (toDelete.length > 0) {
    await prisma.recommendation.deleteMany({
      where: {
        id: { in: toDelete.map((d) => d.id) },
      },
    });
  }

  // Upsert or insert generated recommendations
  for (const item of generated) {
    const match = existing.find((e) => e.title === item.title);
    if (match) {
      // Update fields if priority, description, or action changed
      if (
        match.priority !== item.priority ||
        match.description !== item.description ||
        match.actionUrl !== item.actionUrl ||
        match.reason !== item.reason ||
        match.expectedBenefit !== item.expectedBenefit
      ) {
        await prisma.recommendation.update({
          where: { id: match.id },
          data: {
            description: item.description,
            reason: item.reason,
            priority: item.priority,
            expectedBenefit: item.expectedBenefit,
            category: item.category,
            actionLabel: item.actionLabel,
            actionUrl: item.actionUrl,
          },
        });
      }
    } else {
      // Insert new recommendation
      await prisma.recommendation.create({
        data: {
          studentId,
          title: item.title,
          description: item.description,
          reason: item.reason,
          priority: item.priority,
          expectedBenefit: item.expectedBenefit,
          category: item.category,
          actionLabel: item.actionLabel,
          actionUrl: item.actionUrl,
        },
      });
    }
  }

  // Fetch final active recommendations ordered by Priority (HIGH -> MEDIUM -> LOW) and createdAt
  const finalRecs = await prisma.recommendation.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  });

  // Sort by priority order: HIGH (1), MEDIUM (2), LOW (3), then category preference
  const priorityRank: Record<Priority, number> = {
    [Priority.HIGH]: 1,
    [Priority.MEDIUM]: 2,
    [Priority.LOW]: 3,
  };

  const categoryRank: Record<string, number> = {
    Coding: 1,
    Aptitude: 2,
    Communication: 3,
    Assessment: 4,
    "Placement Readiness": 5,
  };

  return finalRecs.sort((a, b) => {
    const pDiff = priorityRank[a.priority] - priorityRank[b.priority];
    if (pDiff !== 0) return pDiff;
    return (categoryRank[a.category] || 99) - (categoryRank[b.category] || 99);
  });
}
