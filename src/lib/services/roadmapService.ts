import { prisma } from "@/lib/prisma";
import { mockRoadmapItems, mockRoadmaps } from "@/data/mock/roadmap";
import type { RoadmapItem, Roadmap } from "@/types";

export async function getRoadmapItems(studentId?: string): Promise<RoadmapItem[]> {
  try {
    const items = await prisma.roadmapItem.findMany({
      orderBy: { order: "asc" },
      include: {
        progressRecords: studentId ? { where: { studentId } } : false,
      },
    });

    if (items.length > 0) {
      return items.map((item) => {
        let status: "completed" | "in_progress" | "not_started" = "not_started";
        if (studentId && "progressRecords" in item && Array.isArray(item.progressRecords)) {
          const p = item.progressRecords[0];
          if (p) {
            status = p.status.toLowerCase() as typeof status;
          }
        }
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          phase: item.phase.toLowerCase() as "foundation" | "current" | "upcoming",
          status,
          estimatedHours: item.estimatedHours,
          skills: item.skills,
          resources: item.resources,
          order: item.order,
        };
      });
    }
  } catch {
    // Fallback
  }

  return mockRoadmapItems;
}

export async function getRoadmaps(): Promise<Roadmap[]> {
  try {
    const dbRoadmaps = await prisma.roadmap.findMany({
      include: { items: true },
    });

    if (dbRoadmaps.length > 0) {
      return dbRoadmaps.map((r) => ({
        id: r.id,
        title: r.title,
        targetGroup: r.targetGroup,
        completion: 68,
        status: r.status.toLowerCase() as "active" | "draft" | "archived",
        items: r.items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          phase: item.phase.toLowerCase() as "foundation" | "current" | "upcoming",
          status: "in_progress",
          estimatedHours: item.estimatedHours,
          skills: item.skills,
          resources: item.resources,
          order: item.order,
        })),
        lastUpdated: r.updatedAt.toISOString().split("T")[0],
      }));
    }
  } catch {
    // Fallback
  }

  return mockRoadmaps;
}
