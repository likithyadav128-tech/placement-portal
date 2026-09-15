"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { DashboardSkeleton, ErrorState, EmptyState } from "@/components/feedback/states";
import { cn } from "@/lib/utils";

interface RoadmapItemData {
  id: string;
  title: string;
  description: string;
  phase: "FOUNDATION" | "CURRENT" | "UPCOMING";
  order: number;
  estimatedHours: number;
  skills: string[];
  resources: string[];
  status: "completed" | "in_progress" | "not_started";
  startedAt?: string;
  completedAt?: string;
}

export default function PlacementRoadmapPage() {
  const router = useRouter();
  const [items, setItems] = useState<RoadmapItemData[]>([]);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadRoadmap = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/student/roadmap");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Failed to load roadmap (HTTP ${res.status})`);
      }
      const data = (await res.json()) as any;
      setItems(data.items || []);
      setProgressPercentage(data.progressPercentage || 0);
      setCompletedCount(data.completedCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load roadmap.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadRoadmap();
  }, [loadRoadmap]);

  const handleUpdateStatus = async (
    roadmapItemId: string,
    newStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
  ) => {
    setUpdatingId(roadmapItemId);
    try {
      const res = await fetch("/api/student/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmapItemId, status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status.");
      }

      await loadRoadmap();
    } catch (err: any) {
      alert(`Error updating roadmap item: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader
          title="Placement Roadmap"
          description="Your personalized curricular progression toward campus placement readiness."
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader
          title="Placement Roadmap"
          description="Your personalized curricular progression toward campus placement readiness."
        />
        <ErrorState
          title="Unable to load roadmap"
          message={error}
          onRetry={loadRoadmap}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      <PageHeader
        title="Personalized Placement Roadmap"
        description="Structured progression across programming foundations, aptitude, algorithms, core theory, and full mock drives."
      />

      {/* Progress Card */}
      <Card className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-none shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                Curricular Advancement
              </span>
              <h2 className="text-3xl font-extrabold mt-1">{progressPercentage}% Complete</h2>
              <p className="text-xs text-blue-200 mt-0.5">
                {completedCount} of {items.length} milestone modules finished
              </p>
            </div>
            <div className="text-sm font-medium text-blue-200 bg-white/10 px-3 py-1.5 rounded-lg w-fit">
              Target: Campus Ready by 2026
            </div>
          </div>
          <Progress value={progressPercentage} className="h-3 bg-blue-950/80 [&>div]:bg-blue-400" />
        </CardContent>
      </Card>

      {/* Timeline Items */}
      {items.length === 0 ? (
        <EmptyState
          title="No roadmap items found"
          description="Roadmap curriculum is currently being assembled for your academic batch."
        />
      ) : (
        <div className="relative border-l-2 border-slate-200 ml-4 md:ml-6 space-y-8 pb-8">
          {items.map((item) => {
            const isCompleted = item.status === "completed";
            const isInProgress = item.status === "in_progress";
            const isUpdating = updatingId === item.id;

            return (
              <div key={item.id} className="relative pl-8 md:pl-10">
                {/* Timeline status indicator dot */}
                <div className="absolute -left-[17px] top-2 bg-white p-1 rounded-full">
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 bg-white" />
                  ) : isInProgress ? (
                    <div className="h-6 w-6 rounded-full border-2 border-blue-600 flex items-center justify-center bg-white">
                      <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                    </div>
                  ) : (
                    <Circle className="h-6 w-6 text-slate-300 bg-white" />
                  )}
                </div>

                <Card
                  className={cn(
                    "transition-all duration-200",
                    isInProgress
                      ? "ring-2 ring-blue-600 shadow-md border-transparent"
                      : isCompleted
                      ? "border-emerald-200 bg-emerald-50/20"
                      : "border-slate-200"
                  )}
                >
                  <CardContent className="p-5 md:p-6 space-y-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                            Phase: {item.phase}
                          </span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              isCompleted && "bg-emerald-100 text-emerald-800",
                              isInProgress && "bg-blue-100 text-blue-800",
                              !isCompleted && !isInProgress && "bg-slate-100 text-slate-600"
                            )}
                          >
                            {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Upcoming"}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                      </div>

                      <div className="flex items-center text-slate-500 text-xs font-medium bg-slate-50 px-3 py-1.5 rounded-lg w-fit border border-slate-100 shrink-0">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                        <span>~{item.estimatedHours} hrs</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>

                    {item.skills && item.skills.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                          Target Competencies
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.skills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="text-xs bg-white text-slate-700"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-slate-400">
                        {isCompleted
                          ? "Milestone verified"
                          : isInProgress
                          ? "Currently working through materials"
                          : "Scheduled for upcoming training block"}
                      </span>

                      <div className="flex gap-2">
                        {isCompleted ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(item.id, "IN_PROGRESS")}
                            className="text-xs"
                          >
                            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                            Mark In Progress
                          </Button>
                        ) : isInProgress ? (
                          <Button
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(item.id, "COMPLETED")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                          >
                            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                            Mark Complete
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(item.id, "IN_PROGRESS")}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          >
                            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <PlayCircle className="h-3.5 w-3.5 mr-1" />}
                            Start Module
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
