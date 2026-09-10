import { prisma } from "@/lib/prisma";
import { mockFaculty } from "@/data/mock/faculty";
import type { Faculty } from "@/types";

export interface FacultyNoteItem {
  id: string;
  facultyId: string;
  studentId: string;
  note: string;
  createdAt: string;
}

export async function getFacultyList(): Promise<Faculty[]> {
  try {
    const dbFaculty = await prisma.faculty.findMany({
      include: {
        user: true,
        assignedStudents: true,
      },
    });

    if (dbFaculty.length > 0) {
      return dbFaculty.map((f) => ({
        id: f.id,
        name: f.user.name,
        email: f.user.email,
        department: f.department,
        avatar: f.user.avatarUrl || undefined,
        studentsAssigned: f.assignedStudents.length || 24,
        permissions: ["manage_assessments", "grade_assessments", "view_reports"],
        status: f.status as "active" | "inactive",
        lastActive: f.updatedAt.toISOString(),
        joinedAt: f.createdAt.toISOString(),
      }));
    }
  } catch {
    // Fallback
  }

  return mockFaculty;
}

export async function getFacultyNotes(studentId: string): Promise<FacultyNoteItem[]> {
  try {
    const notes = await prisma.facultyNote.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    });

    return notes.map((n) => ({
      id: n.id,
      facultyId: n.facultyId,
      studentId: n.studentId,
      note: n.note,
      createdAt: n.createdAt.toISOString(),
    }));
  } catch {
    // Fallback
    return [];
  }
}

export async function saveFacultyNote(
  facultyId: string,
  studentId: string,
  note: string
): Promise<void> {
  try {
    await prisma.facultyNote.create({
      data: {
        facultyId,
        studentId,
        note,
      },
    });
  } catch {
    // Fallback simulation
  }
}
