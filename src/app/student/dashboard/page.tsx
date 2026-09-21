"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Code,
  Trophy,
  Target,
  Clock,
  TrendingUp,
  Sparkles,
  AlertCircle,
  ArrowRight,
  FileText,
  PlayCircle,
  Layers,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { TrendLineChart, StatCard } from "@/components/charts";
import { DashboardSkeleton, ErrorState } from "@/components/feedback/states";
import { getGreeting } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { useRole } from "@/context/RoleContext";
import { createClient } from "@/lib/supabase/client";

interface DashboardData {
  student: {
    id: string;
    name: string;
    email: string;
    rollNumber: string;
    department: string;
    year: string;
    placementReadiness: number;
    overallScore: number;
    codingScore: number;
    aptitudeScore: number;
    reasoningScore: number;
    communicationScore: number;
    trend: string;
    profileCompleteness: number;
  };
  kpiDeltas: {
    placementReadiness: { change: string; changeType: "positive" | "negative" | "neutral" };
    coding: { change: string; changeType: "positive" | "negative" | "neutral" };
    aptitude: { change: string; changeType: "positive" | "negative" | "neutral" };
    communication: { change: string; changeType: "positive" | "negative" | "neutral" };
  };
  performanceHistory: Array<{
    id: string;
    month: string;
    date: string;
    overall: number;
    score: number;
    maxScore: number;
    title: string;
  }>;
  focusAreas: Array<{
    id: string;
    skill: string;
    status: string;
    currentScore: number;
    targetScore: number;
    suggestion: string;
  }>;
  reminders: Array<{
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    actionUrl: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
  }>;
  recommendedNextStep: {
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    actionUrl: string;
  };
  upcomingAssessments: Array<{
    id: string;
    title: string;
    type: string;
    duration: number;
    totalQuestions: number;
    difficulty: string;
  }>;
  roadmap: {
    totalItems: number;
    completedItems: number;
    progressPercentage: number;
  };
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useRole();
  const greeting = getGreeting();
  const [timeRange, setTimeRange] = useState("all");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      const session = (await supabase.auth.getSession()).data?.session;
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/student/dashboard?timeRange=${timeRange}`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Failed to load dashboard (HTTP ${res.status})`);
      }
      const json = (await res.json()) as DashboardData;
      setDashboardData(json);
      setFetchError(null);
    } catch (err: unknown) {
      setFetchError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [router, timeRange]);

  const handleRetry = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const student = dashboardData?.student || user?.student;
  const kpiDeltas = dashboardData?.kpiDeltas;
  const chartData = dashboardData?.performanceHistory || [];
  const upcomingAssessments = dashboardData?.upcomingAssessments || [];
  const focusAreas = dashboardData?.focusAreas || [];
  const reminders = dashboardData?.reminders || [];
  const recommendedNextStep = dashboardData?.recommendedNextStep;
  const roadmapProgress = dashboardData?.roadmap.progressPercentage ?? 0;

  const displayName = user?.name
    ? user.name.split(" ")[0]
    : dashboardData?.student?.name
    ? dashboardData.student.name.split(" ")[0]
    : "Student";

  if (isLoading && !dashboardData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`${greeting}, ${displayName}`}
          description="Here's a summary of your placement readiness and recent progress."
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (fetchError && !dashboardData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`${greeting}, ${displayName}`}
          description="Here's a summary of your placement readiness and recent progress."
        />
        <ErrorState
          title="Unable to load dashboard data"
          message={fetchError}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title={`${greeting}, ${displayName}`}
        description="Here's an overview of your placement readiness, skills, and recommended preparation steps."
      />

      {/* Main KPI Row - Real calculated values from DB */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Placement Readiness"
          value={`${student?.placementReadiness ?? 0}%`}
          change={kpiDeltas?.placementReadiness.change}
          changeType={kpiDeltas?.placementReadiness.changeType}
          icon={<Target className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          title="Coding Proficiency"
          value={`${student?.codingScore ?? 0}%`}
          change={kpiDeltas?.coding.change}
          changeType={kpiDeltas?.coding.changeType}
          icon={<Code className="h-5 w-5 text-indigo-600" />}
        />
        <StatCard
          title="Aptitude & Reasoning"
          value={`${student?.aptitudeScore ?? 0}%`}
          change={kpiDeltas?.aptitude.change}
          changeType={kpiDeltas?.aptitude.changeType}
          icon={<Trophy className="h-5 w-5 text-amber-600" />}
        />
        <StatCard
          title="Communication / Verbal"
          value={`${student?.communicationScore ?? 0}%`}
          change={kpiDeltas?.communication.change}
          changeType={kpiDeltas?.communication.changeType}
          icon={<BookOpen className="h-5 w-5 text-emerald-600" />}
        />
      </div>

      {/* Actionable Reminders Banner Section */}
      {reminders.length > 0 && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base text-slate-900">
                Action Items & Pending Preparation Reminders
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-600">
              Complete these key steps to maximize placement screening success.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {reminders.map((rem) => (
              <div
                key={rem.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-amber-200/80 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">
                      {rem.title}
                    </span>
                    <Badge
                      variant="secondary"
                      className={
                        rem.priority === "HIGH"
                          ? "bg-rose-50 text-rose-700 border-rose-200 text-[10px]"
                          : "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                      }
                    >
                      {rem.priority} Priority
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{rem.description}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push(rem.actionUrl)}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 px-3 shrink-0 self-start sm:self-auto"
                >
                  {rem.actionLabel}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart with Date Range Tabs */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-3">
            <div>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>
                Your overall score progression across verified assessment records
              </CardDescription>
            </div>
            <Tabs value={timeRange} onValueChange={setTimeRange}>
              <TabsList className="flex flex-wrap h-auto p-1 bg-slate-100 gap-0.5">
                <TabsTrigger value="today" className="text-[11px] px-2 py-1">Today</TabsTrigger>
                <TabsTrigger value="7d" className="text-[11px] px-2 py-1">7D</TabsTrigger>
                <TabsTrigger value="30d" className="text-[11px] px-2 py-1">30D</TabsTrigger>
                <TabsTrigger value="3m" className="text-[11px] px-2 py-1">3M</TabsTrigger>
                <TabsTrigger value="6m" className="text-[11px] px-2 py-1">6M</TabsTrigger>
                <TabsTrigger value="1y" className="text-[11px] px-2 py-1">1Y</TabsTrigger>
                <TabsTrigger value="all" className="text-[11px] px-2 py-1">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  No performance records in this time window
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Complete assignments and mock tests to track your longitudinal score growth.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push("/student/assignments")}
                >
                  Start Assignment
                </Button>
              </div>
            ) : (
              <div className="h-[300px]">
                <TrendLineChart
                  data={chartData as unknown as Record<string, unknown>[]}
                  lines={[
                    {
                      key: "overall",
                      color: "#2563eb",
                      name: "Overall Score",
                    },
                  ]}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommended Next Step - Data-Driven */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Recommended Next Step</CardTitle>
            <CardDescription>
              Targeted action tailored to your weakest area
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center text-center p-6 bg-slate-50 mx-6 rounded-lg border border-slate-100 mb-6">
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">
              {recommendedNextStep?.title || "Complete Full Practice"}
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {recommendedNextStep?.description ||
                "Take benchmark assessments and practice mock tests to improve your readiness score."}
            </p>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
              onClick={() => router.push(recommendedNextStep?.actionUrl || "/student/assignments")}
            >
              {recommendedNextStep?.actionLabel || "Explore Assignments"}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Focus Areas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Skill Competency Focus Areas</CardTitle>
            <CardDescription>
              Prioritized technical feedback identified from your submitted assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {focusAreas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  No critical focus areas flagged
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  As you complete coding, aptitude, and reasoning assessments,
                  your performance will be continuously analyzed here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {focusAreas.map((area, idx) => (
                  <div
                    key={area.id || idx}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-white hover:border-slate-200 transition-colors"
                  >
                    <div className="flex flex-col pr-2">
                      <span className="font-medium text-sm text-slate-900">
                        {area.skill}
                      </span>
                      <span
                        className="text-xs text-slate-500 mt-0.5 line-clamp-1"
                        title={area.suggestion}
                      >
                        {area.suggestion}
                      </span>
                    </div>
                    <Badge
                      variant={
                        area.status === "needs_improvement"
                          ? "danger"
                          : area.status === "improving"
                          ? "warning"
                          : "success"
                      }
                      className="shrink-0 capitalize text-[10px]"
                    >
                      {area.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Work & Roadmap Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Work</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/student/assignments")}
              className="text-xs"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingAssessments.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No pending assessments at this time.
              </div>
            ) : (
              upcomingAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  onClick={() => router.push("/student/assignments")}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-xs text-slate-900 line-clamp-1">
                        {assessment.title}
                      </h4>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {assessment.duration} min • {assessment.totalQuestions} Qs
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="capitalize text-[10px] shrink-0"
                  >
                    {assessment.type}
                  </Badge>
                </div>
              ))
            )}

            {/* Placement Roadmap Tracker Card */}
            <div className="pt-3 border-t border-slate-100 mt-4">
              <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
                <span className="font-semibold text-slate-700">Roadmap Progress</span>
                <span className="font-bold text-blue-700">
                  {roadmapProgress}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${roadmapProgress}%` }}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/student/roadmap")}
                className="w-full mt-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                Continue Curriculum Roadmap <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
