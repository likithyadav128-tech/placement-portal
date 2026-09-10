import { prisma } from "@/lib/prisma";
import { mockTests } from "@/data/mock/mock-tests";
import type { MockTest } from "@/types";

export async function getMockTests(): Promise<MockTest[]> {
  try {
    const dbTests = await prisma.mockTest.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (dbTests.length > 0) {
      return dbTests.map((t) => ({
        id: t.id,
        name: t.name,
        company: t.company,
        category: t.category,
        sections: t.sections,
        duration: t.duration,
        difficulty: t.difficulty as "easy" | "medium" | "hard",
        totalQuestions: t.totalQuestions,
        status: t.status.toLowerCase() as "published" | "draft" | "archived",
        description: t.description || undefined,
        createdAt: t.createdAt.toISOString(),
      }));
    }
  } catch {
    // Fallback
  }

  return mockTests;
}
