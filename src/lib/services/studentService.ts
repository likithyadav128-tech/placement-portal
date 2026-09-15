import { prisma } from "@/lib/prisma";
import { mockStudents } from "@/data/mock/students";
import type { Student } from "@/types";

/**
 * Data Access Layer for Students.
 * Bridges Prisma PostgreSQL with graceful fallback to mock data.
 */
export async function getStudents(filters?: {
  department?: string;
  year?: string;
  search?: string;
  status?: string;
}): Promise<Student[]> {
  try {
    const dbStudents = await prisma.student.findMany({
      include: {
        user: true,
      },
      orderBy: { overallScore: "desc" },
    });

    if (dbStudents.length > 0) {
      return dbStudents.map((s) => ({
        id: s.id,
        name: s.user.name,
        email: s.user.email,
        rollNumber: s.rollNumber,
        department: s.department,
        year: s.year,
        avatar: s.user.avatarUrl || undefined,
        phone: s.phone || undefined,
        skills: s.skills,
        placementReadiness: s.placementReadiness,
        overallScore: s.overallScore,
        codingScore: s.codingScore,
        aptitudeScore: s.aptitudeScore,
        reasoningScore: s.reasoningScore,
        communicationScore: s.communicationScore,
        trend: s.trend as "improving" | "stable" | "declining",
        status: s.status as "active" | "inactive" | "graduated",
        lastActivity: s.lastActivity.toISOString(),
        joinedAt: s.createdAt.toISOString(),
      }));
    }
  } catch {
    // Database unconfigured or unreachable -> fallback to mock dataset
  }

  // Fallback to mock data with filter application
  let results = [...mockStudents];
  if (filters?.department && filters.department !== "All") {
    results = results.filter((s) => s.department === filters.department);
  }
  if (filters?.year && filters.year !== "All") {
    results = results.filter((s) => s.year === filters.year);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }
  return results;
}

export async function getStudentById(id: string): Promise<Student | null> {
  try {
    const dbStudent = await prisma.student.findFirst({
      where: {
        OR: [{ id }, { rollNumber: id }],
      },
      include: {
        user: true,
      },
    });

    if (dbStudent) {
      return {
        id: dbStudent.id,
        name: dbStudent.user.name,
        email: dbStudent.user.email,
        rollNumber: dbStudent.rollNumber,
        department: dbStudent.department,
        year: dbStudent.year,
        avatar: dbStudent.user.avatarUrl || undefined,
        phone: dbStudent.phone || undefined,
        skills: dbStudent.skills,
        placementReadiness: dbStudent.placementReadiness,
        overallScore: dbStudent.overallScore,
        codingScore: dbStudent.codingScore,
        aptitudeScore: dbStudent.aptitudeScore,
        reasoningScore: dbStudent.reasoningScore,
        communicationScore: dbStudent.communicationScore,
        trend: dbStudent.trend as "improving" | "stable" | "declining",
        status: dbStudent.status as "active" | "inactive" | "graduated",
        lastActivity: dbStudent.lastActivity.toISOString(),
        joinedAt: dbStudent.createdAt.toISOString(),
      };
    }
  } catch {
    // Fallback
  }

  const normalized = id.toLowerCase();
  return (
    mockStudents.find(
      (s) =>
        s.id.toLowerCase() === normalized ||
        s.rollNumber.toLowerCase() === normalized
    ) || null
  );
}
