import { prisma } from "@/lib/prisma";
import {
  mockAssessments,
  mockCodingProblems,
  mockAptitudeQuestions,
} from "@/data/mock/assessments";
import type { Assessment, CodingProblem, AptitudeQuestion } from "@/types";

/**
 * Data Access Layer for Assessments and Question Banks.
 */
export async function getAssessments(filters?: {
  type?: string;
  status?: string;
  search?: string;
}): Promise<Assessment[]> {
  try {
    const dbAssessments = await prisma.assessment.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (dbAssessments.length > 0) {
      return dbAssessments.map((a) => ({
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
    }
  } catch {
    // Fallback
  }

  let list = [...mockAssessments];
  if (filters?.type && filters.type !== "all") {
    list = list.filter((a) => a.type === filters.type);
  }
  if (filters?.status && filters.status !== "all") {
    list = list.filter((a) => a.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter((a) => a.title.toLowerCase().includes(q));
  }
  return list;
}

export async function getAssessmentById(id: string): Promise<Assessment | null> {
  try {
    const a = await prisma.assessment.findUnique({ where: { id } });
    if (a) {
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
    }
  } catch {
    // Fallback
  }

  return mockAssessments.find((a) => a.id === id) || mockAssessments[0];
}

export async function getCodingProblem(id?: string): Promise<CodingProblem> {
  try {
    if (id) {
      const p = await prisma.codingProblem.findUnique({ where: { id } });
      if (p) {
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
    }
  } catch {
    // Fallback
  }
  return mockCodingProblems[0];
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

    if (dbQuestions.length > 0) {
      return dbQuestions.map((q) => ({
        id: q.id,
        questionNumber: q.questionNumber,
        question: q.question,
        options: q.options,
        category: q.category,
        correctAnswer: includeAnswers ? q.correctAnswer : undefined,
      }));
    }
  } catch {
    // Fallback
  }

  return mockAptitudeQuestions.map((q) => ({
    ...q,
    correctAnswer: includeAnswers ? q.correctAnswer : undefined,
  }));
}
