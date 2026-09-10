import { prisma } from "@/lib/prisma";
import { mockRecommendations } from "@/data/mock/recommendations";
import type { Recommendation, Student } from "@/types";

/**
 * Deterministic, explainable recommendation engine.
 * Generates personalized actionable guidance based on skill scores and assessment history.
 */
export async function getRecommendationsForStudent(
  student: Student
): Promise<Recommendation[]> {
  try {
    const dbRecs = await prisma.recommendation.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
    });

    if (dbRecs.length > 0) {
      return dbRecs.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        reason: r.reason,
        priority: r.priority.toLowerCase() as "high" | "medium" | "low",
        expectedBenefit: r.expectedBenefit,
        category: r.category,
        actionLabel: r.actionLabel,
        actionUrl: r.actionUrl,
      }));
    }
  } catch {
    // Fallback
  }

  // Generate dynamic, explainable recommendations if no static DB recommendations exist
  const dynamicRecs: Recommendation[] = [];

  // Rule 1: Coding threshold check (< 75%)
  if (student.codingScore < 75) {
    dynamicRecs.push({
      id: "rec-coding-boost",
      title: "Master Dynamic Programming & Array Manipulation",
      description: "Your coding score is currently at " + student.codingScore + "%. Focus on two-pointer techniques and recurrence relations.",
      reason: "Coding score is below placement benchmark (75%)",
      priority: "high",
      expectedBenefit: "+8-12% expected increase in coding assessment accuracy",
      category: "Coding Practice",
      actionLabel: "Start Problem Set",
      actionUrl: "/student/assessments/coding",
    });
  }

  // Rule 2: Aptitude threshold check (< 80%)
  if (student.aptitudeScore < 80) {
    dynamicRecs.push({
      id: "rec-aptitude-speed",
      title: "Quantitative Speed Drills — Time & Work",
      description: "Improve mental math and formula shortcuts to solve questions in under 45 seconds.",
      reason: "Aptitude speed currently bottlenecks test completion",
      priority: "medium",
      expectedBenefit: "+15% time saved per quantitative section",
      category: "Aptitude",
      actionLabel: "Practice Speed Drill",
      actionUrl: "/student/assessments/aptitude",
    });
  }

  // Rule 3: Mock Test Preparation
  dynamicRecs.push({
    id: "rec-mock-test",
    title: "Complete Company Mock Test (TCS NQT)",
    description: "Simulate a live 90-minute timed environment matching the latest recruitment syllabus.",
    reason: "Consistent mock test practice builds examination stamina",
    priority: "high",
    expectedBenefit: "Familiarity with company-specific section sectional cutoffs",
    category: "Mock Tests",
    actionLabel: "Take Mock Test",
    actionUrl: "/student/mock-tests",
  });

  return dynamicRecs.length > 0 ? dynamicRecs : mockRecommendations;
}
