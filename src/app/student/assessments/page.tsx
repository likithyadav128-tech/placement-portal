"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, FileText, CheckCircle, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState } from "@/components/feedback/states";

interface AssessmentItem {
  id: string;
  title: string;
  type: "coding" | "aptitude" | "mixed";
  difficulty: "easy" | "medium" | "hard";
  duration: number;
  totalQuestions: number;
  status: "upcoming" | "in_progress" | "completed";
  bestScore?: number;
  activeAttemptId?: string;
  description?: string;
  createdAt: string;
}

export default function StudentAssessments() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const router = useRouter();

  const loadAssessments = useCallback(async () => {
    try {
      const res = await fetch("/api/student/assessments");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Failed to load assessments (HTTP ${res.status})`);
      }
      const data = (await res.json()) as { assessments: AssessmentItem[] };
      setAssessments(data.assessments || []);
      setFetchError(null);
    } catch (err: unknown) {
      setFetchError(
        err instanceof Error ? err.message : "Failed to load assessments"
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setFetchError(null);
    loadAssessments();
  }, [loadAssessments]);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  const filteredAssessments = assessments.filter((a) => {
    if (filter === "completed" && a.status !== "completed") return false;
    if (filter === "upcoming" && a.status !== "upcoming") return false;
    if (filter === "coding" && a.type !== "coding") return false;
    if (filter === "aptitude" && a.type !== "aptitude") return false;

    if (search && !a.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const handleAction = (assessment: AssessmentItem) => {
    if (assessment.type === "coding") {
      router.push(`/student/assessments/coding?assessmentId=${assessment.id}`);
    } else {
      router.push(`/student/assessments/aptitude?assessmentId=${assessment.id}`);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy":
        return "bg-emerald-100 text-emerald-800";
      case "medium":
        return "bg-amber-100 text-amber-800";
      case "hard":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessments"
        description="Practice and evaluate your skills with targeted assessments from real training curriculum."
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Tabs
          value={filter}
          onValueChange={setFilter}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-3 sm:flex">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="coding">Coding</TabsTrigger>
            <TabsTrigger value="aptitude">Aptitude</TabsTrigger>
            <TabsTrigger value="completed" className="hidden sm:inline-flex">
              Completed
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="hidden sm:inline-flex">
              Upcoming
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search assessments..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-64 bg-white border border-slate-200 rounded-xl p-6"
            >
              <div className="flex justify-between mb-4">
                <div className="h-5 bg-slate-200 rounded w-16" />
                <div className="h-5 bg-slate-200 rounded w-16" />
              </div>
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-8" />
              <div className="h-10 bg-slate-200 rounded w-full mt-auto" />
            </div>
          ))}
        </div>
      ) : fetchError ? (
        <ErrorState
          title="Unable to load assessments"
          message={fetchError}
          onRetry={handleRetry}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map((assessment) => (
            <Card key={assessment.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="capitalize">
                    {assessment.type}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "capitalize",
                      getDifficultyColor(assessment.difficulty)
                    )}
                  >
                    {assessment.difficulty}
                  </Badge>
                </div>
                <CardTitle
                  className="text-lg line-clamp-1"
                  title={assessment.title}
                >
                  {assessment.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 text-sm text-slate-500">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{assessment.duration} min</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    <span>{assessment.totalQuestions} questions</span>
                  </div>
                </div>

                {assessment.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {assessment.description}
                  </p>
                )}

                {assessment.status === "completed" &&
                  assessment.bestScore !== undefined && (
                    <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-md border border-emerald-100">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium text-emerald-900 text-xs">
                        Best Score: {assessment.bestScore}%
                      </span>
                    </div>
                  )}

                {assessment.status === "in_progress" && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md border border-blue-100">
                    <Play className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900 text-xs">
                      Attempt in progress
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-3 border-t border-slate-100">
                {assessment.status === "completed" ? (
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push("/student/performance")}
                    >
                      View Results
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleAction(assessment)}
                    >
                      Retake
                    </Button>
                  </div>
                ) : assessment.status === "in_progress" ? (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleAction(assessment)}
                  >
                    Continue Attempt
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleAction(assessment)}
                  >
                    Start Assessment
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}

          {filteredAssessments.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                title="No assessments found"
                description={
                  search
                    ? `No assessments match "${search}". Try adjusting your search or filters.`
                    : "No published assessments available for this category."
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
