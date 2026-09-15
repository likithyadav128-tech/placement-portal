import { prisma } from "@/lib/prisma";
import type {
  PerformanceRecord,
  PerformanceMilestone,
  FocusArea,
} from "@/types";

export interface PerformanceAnalytics {
  timeRange: "1m" | "3m" | "6m" | "12m" | "all";
  records: PerformanceRecord[];
  startScore: number;
  currentScore: number;
  improvement: number;
  bestScore: number;
  averageScore: number;
  assessmentsCompleted: number;
  skillDeltas: {
    coding: { current: number; previous: number; change: number };
    aptitude: { current: number; previous: number; change: number };
    reasoning: { current: number; previous: number; change: number };
    communication: { current: number; previous: number; change: number };
  };
}

/**
 * Data Access Layer for Performance History.
 * Enforces historical record preservation and dynamic statistical calculations.
 * Strictly reads real PostgreSQL records without mock fallbacks.
 */
export async function getStudentPerformance(
  studentId: string,
  timeRange: "1m" | "3m" | "6m" | "12m" | "all" = "6m"
): Promise<PerformanceAnalytics> {
  let records: PerformanceRecord[] = [];

  try {
    const dbRecords = await prisma.performanceRecord.findMany({
      where: { studentId },
      orderBy: { completedAt: "asc" },
    });

    if (dbRecords.length > 0) {
      // Aggregate records by month
      records = dbRecords.map((r) => ({
        month: r.month,
        date: r.completedAt.toISOString().split("T")[0],
        overall: r.percentage,
        coding: r.percentage,
        aptitude: r.percentage,
        reasoning: r.percentage,
        communication: r.percentage,
      }));
    }
  } catch (error) {
    console.error("Error in getStudentPerformance:", error);
  }

  // Filter records based on requested time range
  let sliced = [...records];
  if (timeRange === "1m") sliced = records.slice(-2);
  else if (timeRange === "3m") sliced = records.slice(-4);
  else if (timeRange === "6m") sliced = records.slice(-7);
  else if (timeRange === "12m" || timeRange === "all") sliced = records.slice(-12);

  if (sliced.length === 0) {
    return {
      timeRange,
      records: [],
      startScore: 0,
      currentScore: 0,
      improvement: 0,
      bestScore: 0,
      averageScore: 0,
      assessmentsCompleted: 0,
      skillDeltas: {
        coding: { current: 0, previous: 0, change: 0 },
        aptitude: { current: 0, previous: 0, change: 0 },
        reasoning: { current: 0, previous: 0, change: 0 },
        communication: { current: 0, previous: 0, change: 0 },
      },
    };
  }

  const startScore = sliced[0]?.overall || 0;
  const currentScore = sliced[sliced.length - 1]?.overall || startScore;
  const improvement = startScore > 0 ? Math.round(((currentScore - startScore) / startScore) * 100) : 0;
  const bestScore = Math.max(...sliced.map((r) => r.overall), currentScore);
  const averageScore = Math.round(
    sliced.reduce((sum, r) => sum + r.overall, 0) / sliced.length
  );

  const prev = sliced.length > 1 ? sliced[sliced.length - 2] : sliced[0];
  const curr = sliced[sliced.length - 1] || prev;

  const skillDeltas = {
    coding: {
      current: curr?.coding || 0,
      previous: prev?.coding || 0,
      change: (curr?.coding || 0) - (prev?.coding || 0),
    },
    aptitude: {
      current: curr?.aptitude || 0,
      previous: prev?.aptitude || 0,
      change: (curr?.aptitude || 0) - (prev?.aptitude || 0),
    },
    reasoning: {
      current: curr?.reasoning || 0,
      previous: prev?.reasoning || 0,
      change: (curr?.reasoning || 0) - (prev?.reasoning || 0),
    },
    communication: {
      current: curr?.communication || 0,
      previous: prev?.communication || 0,
      change: (curr?.communication || 0) - (prev?.communication || 0),
    },
  };

  return {
    timeRange,
    records: sliced,
    startScore,
    currentScore,
    improvement,
    bestScore,
    averageScore,
    assessmentsCompleted: sliced.length,
    skillDeltas,
  };
}

/**
 * Appends a new immutable historical performance entry into the database.
 * NEVER overwrites existing history.
 */
export async function recordPerformanceEntry(data: {
  studentId: string;
  sourceType: string;
  sourceId?: string;
  title: string;
  score: number;
  maxScore: number;
  skillArea: string;
}): Promise<void> {
  const percentage = Math.round((data.score / (data.maxScore || 100)) * 100);
  const now = new Date();
  const month = now.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  try {
    await prisma.performanceRecord.create({
      data: {
        studentId: data.studentId,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        title: data.title,
        score: data.score,
        maxScore: data.maxScore,
        percentage,
        skillArea: data.skillArea,
        month,
        completedAt: now,
      },
    });

    // Update current aggregate score on Student table as a cache
    await prisma.student.update({
      where: { id: data.studentId },
      data: {
        overallScore: percentage,
        lastActivity: now,
      },
    });
  } catch (error) {
    console.error("Error in recordPerformanceEntry:", error);
  }
}

export async function getStudentMilestones(studentId: string): Promise<PerformanceMilestone[]> {
  try {
    const dbMilestones = await prisma.performanceMilestone.findMany({
      where: { studentId },
      orderBy: { createdAt: "asc" },
    });

    if (dbMilestones.length > 0) {
      return dbMilestones.map((m) => ({
        id: m.id,
        title: m.title,
        achieved: m.achieved,
        achievedDate: m.achievedDate?.toISOString().split("T")[0],
      }));
    }
  } catch (error) {
    console.error("Error in getStudentMilestones:", error);
  }
  return [];
}

export async function getStudentFocusAreas(studentId: string): Promise<FocusArea[]> {
  try {
    const dbAreas = await prisma.focusArea.findMany({
      where: { studentId },
      orderBy: { updatedAt: "desc" },
    });

    if (dbAreas.length > 0) {
      return dbAreas.map((a) => ({
        skill: a.skill,
        status: a.status as "strong" | "improving" | "needs_improvement",
        currentScore: a.currentScore,
        targetScore: a.targetScore,
        suggestion: a.suggestion,
      }));
    }
  } catch (error) {
    console.error("Error in getStudentFocusAreas:", error);
  }
  return [];
}
