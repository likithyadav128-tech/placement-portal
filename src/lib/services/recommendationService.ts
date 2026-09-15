import { syncRecommendationsForStudent } from "@/lib/recommendations/recommendationEngine";
import type { Recommendation, Student } from "@/types";

/**
 * Service to retrieve recommendations for a student.
 * Calls the deterministic recommendation engine and returns real persisted recommendations.
 */
export async function getRecommendationsForStudent(
  student: Student
): Promise<Recommendation[]> {
  const dbRecs = await syncRecommendationsForStudent(student.id);

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
