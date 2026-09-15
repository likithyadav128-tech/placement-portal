"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import {
  Clock,
  Building,
  BarChart2,
  Code,
  Brain,
  BookOpen,
  CheckCircle2,
  PlayCircle,
  Sparkles,
  Layers,
} from "lucide-react";
import { DashboardSkeleton, ErrorState, EmptyState } from "@/components/feedback/states";

interface MockTestItem {
  id: string;
  name: string;
  company: string;
  category: string;
  sections: string[];
  duration: number;
  difficulty: string;
  totalQuestions: number;
  description?: string;
  courseTag?: string;
  departmentTag?: string;
  status: "upcoming" | "in_progress" | "completed";
  bestScore?: number;
  lastAttemptScore?: number;
  attemptsCount: number;
  activeAttemptId?: string;
  levelsSummary: {
    level1: string;
    level2: string;
    level3: string;
    level4: string;
  };
}

export default function MockTestsPage() {
  const router = useRouter();
  const [mockTests, setMockTests] = useState<MockTestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMockTests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/student/mock-tests");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Failed to load mock tests (HTTP ${res.status})`);
      }
      const data = (await res.json()) as { mockTests?: MockTestItem[] };
      setMockTests(data.mockTests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load mock tests.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadMockTests();
  }, [loadMockTests]);

  const handleStart = (testId: string) => {
    router.push(`/student/mock-tests/${testId}/take`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Full-Length Mock Tests"
          description="Company-specific 4-level mock tests preparing you for actual campus placement rounds."
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Full-Length Mock Tests"
          description="Company-specific 4-level mock tests preparing you for actual campus placement rounds."
        />
        <ErrorState
          title="Unable to load mock tests"
          message={error}
          onRetry={loadMockTests}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Full-Length Mock Tests"
          description="Comprehensive 4-level assessments evaluating aptitude, verbal, course theory, and live coding under placement conditions."
        />
      </div>

      {/* 4-Level Structure Explainer Banner */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Standard 4-Level Campus Recruitment Assessment Structure
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-lg border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Level 1</span>
              <p className="font-semibold text-xs text-slate-900 mt-0.5">Aptitude & Reasoning</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Speed math & analytical logic</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Level 2</span>
              <p className="font-semibold text-xs text-slate-900 mt-0.5">Verbal Ability</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Grammar, reading & vocab</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Level 3</span>
              <p className="font-semibold text-xs text-slate-900 mt-0.5">Course Theory</p>
              <p className="text-[11px] text-slate-500 mt-0.5">OS, DBMS, CN & OOP</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Level 4</span>
              <p className="font-semibold text-xs text-slate-900 mt-0.5">Live Coding</p>
              <p className="text-[11px] text-slate-500 mt-0.5">5 Progressive problems</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mock Tests List */}
      {mockTests.length === 0 ? (
        <EmptyState
          title="No mock tests available"
          description="There are currently no published mock tests. Check back shortly as new placement benchmarks are scheduled."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockTests.map((test) => {
            const isCompleted = test.status === "completed";
            const isInProgress = test.status === "in_progress";

            return (
              <Card
                key={test.id}
                className="flex flex-col hover:border-slate-300 transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="bg-slate-50 font-normal">
                      {test.category}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={
                        test.difficulty === "hard"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : test.difficulty === "medium"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }
                    >
                      {test.difficulty.toUpperCase()}
                    </Badge>
                  </div>

                  <CardTitle className="text-xl leading-snug">
                    {test.name}
                  </CardTitle>
                  {test.company && (
                    <div className="flex items-center text-slate-500 text-xs mt-1">
                      <Building className="h-3.5 w-3.5 mr-1 text-slate-400" />
                      <span>{test.company} Drive Pattern</span>
                      {test.courseTag && (
                        <span className="ml-2 text-slate-400">• {test.courseTag}</span>
                      )}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="flex-1 space-y-4 text-xs text-slate-600">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>{test.duration} mins</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BarChart2 className="h-4 w-4 text-slate-400" />
                      <span>{test.totalQuestions} Questions</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      4 Examination Levels Included:
                    </p>
                    <div className="space-y-1 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-purple-600" />
                        <span>Level 1: Aptitude & Logical Reasoning (10 Qs)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-blue-600" />
                        <span>Level 2: English Verbal Ability (10 Qs)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span>Level 3: Core Course Theory Exam (10 Qs)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-amber-600" />
                        <span>Level 4: Live Coding (5 Progressive Problems)</span>
                      </div>
                    </div>
                  </div>

                  {isCompleted && test.bestScore !== undefined && (
                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span className="font-semibold text-slate-700">Best Performance:</span>
                      <span className="text-base font-bold text-emerald-600">
                        {test.bestScore}%
                      </span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-2 border-t border-slate-100">
                  <Button
                    onClick={() => handleStart(test.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                  >
                    {isCompleted ? (
                      <>
                        <PlayCircle className="h-4 w-4" /> Retake Mock Test
                      </>
                    ) : isInProgress ? (
                      <>
                        <PlayCircle className="h-4 w-4" /> Resume In-Progress Attempt
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4" /> Start Full Mock Test
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
