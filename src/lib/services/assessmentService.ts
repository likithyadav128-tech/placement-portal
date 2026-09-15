import { prisma } from "@/lib/prisma";
import type { Assessment, CodingProblem, AptitudeQuestion } from "@/types";

/**
 * Data Access Layer for Assessments and Question Banks.
 * Strictly reads real PostgreSQL records without mock fallbacks.
 */
export async function getAssessments(filters?: {
  type?: string;
  status?: string;
  search?: string;
}): Promise<Assessment[]> {
  try {
    const whereClause: Record<string, unknown> = {};

    if (filters?.type && filters.type !== "all") {
      whereClause.type = filters.type.toUpperCase();
    }
    if (filters?.status && filters.status !== "all") {
      whereClause.status = filters.status.toUpperCase();
    }

    const dbAssessments = await prisma.assessment.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    let list: Assessment[] = dbAssessments.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type.toLowerCase() as "coding" | "aptitude" | "mixed",
      difficulty: a.difficulty as "easy" | "medium" | "hard",
      duration: a.duration,
      totalQuestions: a.totalQuestions,
      status: a.status.toLowerCase() as "published" | "draft" | "archived",
      deadline: a.deadline?.toISOString().split("T")[0],
      description: a.description || undefined,
      createdAt: a.createdAt.toISOString(),
    }));

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q));
    }

    return list;
  } catch (error) {
    console.error("Error in getAssessments:", error);
    return [];
  }
}

export async function getAssessmentById(id: string): Promise<Assessment | null> {
  try {
    const a = await prisma.assessment.findUnique({ where: { id } });
    if (!a) return null;

    return {
      id: a.id,
      title: a.title,
      type: a.type.toLowerCase() as "coding" | "aptitude" | "mixed",
      difficulty: a.difficulty as "easy" | "medium" | "hard",
      duration: a.duration,
      totalQuestions: a.totalQuestions,
      status: a.status.toLowerCase() as "published" | "draft" | "archived",
      deadline: a.deadline?.toISOString().split("T")[0],
      description: a.description || undefined,
      createdAt: a.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("Error in getAssessmentById:", error);
    return null;
  }
}

export async function getCodingProblem(id?: string): Promise<CodingProblem | null> {
  try {
    if (!id) {
      const p = await prisma.codingProblem.findFirst();
      if (!p) return null;
      return {
        id: p.id,
        title: p.title,
        difficulty: p.difficulty as "easy" | "medium" | "hard",
        description: p.description,
        examples: p.examples as unknown as CodingProblem["examples"],
        constraints: p.constraints,
        starterCode: p.starterCode as unknown as Record<string, string>,
        testCases: p.testCases as unknown as CodingProblem["testCases"],
      };
    }

    const p = await prisma.codingProblem.findUnique({ where: { id } });
    if (!p) return null;

    return {
      id: p.id,
      title: p.title,
      difficulty: p.difficulty as "easy" | "medium" | "hard",
      description: p.description,
      examples: p.examples as unknown as CodingProblem["examples"],
      constraints: p.constraints,
      starterCode: p.starterCode as unknown as Record<string, string>,
      testCases: p.testCases as unknown as CodingProblem["testCases"],
    };
  } catch (error) {
    console.error("Error in getCodingProblem:", error);
    return null;
  }
}

/**
 * Retrieves aptitude questions for a test session.
 * SECURITY: Strips `correctAnswer` before sending to student!
 */
export async function getAptitudeQuestions(
  assessmentId?: string,
  includeAnswers = false
): Promise<AptitudeQuestion[]> {
  try {
    const dbQuestions = await prisma.aptitudeQuestion.findMany({
      where: assessmentId ? { assessmentId } : undefined,
      orderBy: { questionNumber: "asc" },
    });

    return dbQuestions.map((q) => ({
      id: q.id,
      questionNumber: q.questionNumber,
      question: q.question,
      options: q.options,
      category: q.category,
      correctAnswer: includeAnswers ? q.correctAnswer : undefined,
    }));
  } catch (error) {
    console.error("Error in getAptitudeQuestions:", error);
    return [];
  }
}
