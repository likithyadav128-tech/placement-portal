"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Code,
  Brain,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Search,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import { DashboardSkeleton, ErrorState, EmptyState } from "@/components/feedback/states";

interface AssessmentItem {
  id: string;
  title: string;
  type: "CODING" | "APTITUDE" | "MIXED";
  difficulty: string;
  duration: number;
  totalQuestions: number;
  deadline?: string;
  description?: string;
  status: "upcoming" | "in_progress" | "completed";
  bestScore?: number;
  lastAttemptScore?: number;
  attemptsCount: number;
  activeAttemptId?: string;
}

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "cat1" | "cat2">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "not_started" | "in_progress" | "completed">("all");

  const loadAssignments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/student/assessments");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Failed to load assignments (HTTP ${res.status})`);
      }
      const data = (await res.json()) as { assessments?: AssessmentItem[] };
      setAssessments(data.assessments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assignments.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleStart = (assessment: AssessmentItem) => {
    if (assessment.type === "CODING") {
      router.push(`/student/assessments/coding?id=${assessment.id}`);
    } else {
      router.push(`/student/assessments/aptitude?id=${assessment.id}`);
    }
  };

  // Classify into Category 1 vs Category 2
  // Category 1: Aptitude, Reasoning & Verbal
  // Category 2: Coding & Theoretical Questions
  const filteredAssignments = useMemo(() => {
    return assessments.filter((item) => {
      // Search
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Category filter
      if (categoryFilter === "cat1" && item.type !== "APTITUDE") return false;
      if (categoryFilter === "cat2" && item.type !== "CODING" && item.type !== "MIXED") return false;

      // Status filter
      if (statusFilter === "not_started" && item.status !== "upcoming") return false;
      if (statusFilter === "in_progress" && item.status !== "in_progress") return false;
      if (statusFilter === "completed" && item.status !== "completed") return false;

      return true;
    });
  }, [assessments, searchQuery, categoryFilter, statusFilter]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Placement Assignments"
          description="Personalized assignments across aptitude, reasoning, verbal, coding, and theory."
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Placement Assignments"
          description="Personalized assignments across aptitude, reasoning, verbal, coding, and theory."
        />
        <ErrorState
          title="Unable to load assignments"
          message={error}
          onRetry={loadAssignments}
        />
      </div>
    );
  }

  const cat1Count = assessments.filter((a) => a.type === "APTITUDE").length;
  const cat2Count = assessments.filter((a) => a.type === "CODING" || a.type === "MIXED").length;

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Placement Assignments"
          description="Assigned coursework structured to build campus placement competence."
        />
        <Button
          variant="outline"
          onClick={() => router.push("/student/assessments")}
          className="flex items-center gap-2 self-start sm:self-auto border-slate-300"
        >
          <Layers className="h-4 w-4 text-blue-600" />
          Standard Assessment View
        </Button>
      </div>

      {/* Category Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          onClick={() => setCategoryFilter("cat1")}
          className={`cursor-pointer transition-all border-2 ${
            categoryFilter === "cat1"
              ? "border-blue-600 bg-blue-50/40 shadow-sm"
              : "border-slate-200 hover:border-slate-300 bg-white"
          }`}
        >
          <CardContent className="pt-5 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-purple-100 text-purple-700 shrink-0">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Category 1: Aptitude & Verbal</h3>
                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                  {cat1Count} Available
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Quantitative aptitude, mathematical logic, logical reasoning puzzles, and English verbal ability.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setCategoryFilter("cat2")}
          className={`cursor-pointer transition-all border-2 ${
            categoryFilter === "cat2"
              ? "border-blue-600 bg-blue-50/40 shadow-sm"
              : "border-slate-200 hover:border-slate-300 bg-white"
          }`}
        >
          <CardContent className="pt-5 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-700 shrink-0">
              <Code className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Category 2: Coding & Theory</h3>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  {cat2Count} Available
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Hands-on algorithms, data structure problems with real execution, and core computer science theory.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Tabs
            value={categoryFilter}
            onValueChange={(val) => setCategoryFilter(val as any)}
          >
            <TabsList>
              <TabsTrigger value="all">All Categories</TabsTrigger>
              <TabsTrigger value="cat1">Category 1</TabsTrigger>
              <TabsTrigger value="cat2">Category 2</TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as any)}
          >
            <TabsList>
              <TabsTrigger value="all">All Statuses</TabsTrigger>
              <TabsTrigger value="not_started">Not Started</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Assignments Grid */}
      {filteredAssignments.length === 0 ? (
        <EmptyState
          title="No assignments found"
          description="No assignments match your current filters. Try resetting the filters or check back later."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((item) => {
            const isCat1 = item.type === "APTITUDE";
            const isCompleted = item.status === "completed";
            const isInProgress = item.status === "in_progress";

            return (
              <Card
                key={item.id}
                className="flex flex-col hover:border-slate-300 transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <Badge
                      variant="secondary"
                      className={
                        isCat1
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }
                    >
                      {isCat1 ? "Category 1: Aptitude" : "Category 2: Coding"}
                    </Badge>

                    {isCompleted ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
                        Completed
                      </Badge>
                    ) : isInProgress ? (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
                        In Progress
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-600">
                        Not Started
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-lg leading-snug line-clamp-2">
                    {item.title}
                  </CardTitle>
                  {item.description && (
                    <CardDescription className="line-clamp-2 text-xs mt-1">
                      {item.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex-1 space-y-3 text-xs text-slate-600">
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{item.duration} mins</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                      <span>{item.totalQuestions} questions</span>
                    </div>
                  </div>

                  {isCompleted && item.bestScore !== undefined && (
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="font-semibold text-slate-700">Best Score:</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {item.bestScore}%
                      </span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-2 border-t border-slate-100">
                  <Button
                    onClick={() => handleStart(item)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                  >
                    {isCompleted ? (
                      <>
                        <PlayCircle className="h-4 w-4" /> Retake Assignment
                      </>
                    ) : isInProgress ? (
                      <>
                        <PlayCircle className="h-4 w-4" /> Continue Assignment
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4" /> Start Assignment
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
