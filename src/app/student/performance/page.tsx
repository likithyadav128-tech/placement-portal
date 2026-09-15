"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaTrendChart, TrendLineChart } from "@/components/charts";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardSkeleton, ErrorState, EmptyState } from "@/components/feedback/states";

interface SkillTrendItem {
  name: string;
  current: number;
  previous: number;
  change: number;
  color: string;
}

interface AssessmentHistoryItem {
  id: string;
  title: string;
  type: string;
  duration: number;
  totalQuestions: number;
  score: number | null;
  rawScore: number | null;
  status: string;
  date: string;
}

interface MilestoneItem {
  id: string;
  title: string;
  achieved: boolean;
  achievedDate?: string;
}

interface PerformanceAnalyticsData {
  timeRange: string;
  currentScore: number;
  startingScore: number;
  improvement: number;
  bestScore: number;
  assessmentsCompleted: number;
  chartData: Array<{
    month: string;
    date: string;
    overall: number;
    coding: number;
    aptitude: number;
    reasoning: number;
    communication: number;
    title?: string;
  }>;
  skillTrends: SkillTrendItem[];
  assessmentHistory: AssessmentHistoryItem[];
  milestones: MilestoneItem[];
}

export default function StudentPerformance() {
  const [timeRange, setTimeRange] = useState("all");
  const [data, setData] = useState<PerformanceAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPerformanceData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`/api/student/performance?timeRange=${timeRange}`);
      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errJson.error || "Failed to load performance analytics");
      }

      const json = (await res.json()) as {
        analytics: PerformanceAnalyticsData;
      };
      setData(json.analytics);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while loading performance data."
      );
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Performance Analytics"
          description="Track your placement readiness and skill improvements from your first assessment to today."
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Performance Analytics"
          description="Track your placement readiness and skill improvements from your first assessment to today."
        />
        <ErrorState
          title="Unable to load performance data"
          message={error || "Could not retrieve real student performance data."}
          onRetry={loadPerformanceData}
        />
      </div>
    );
  }

  const {
    currentScore,
    startingScore,
    improvement,
    bestScore,
    assessmentsCompleted,
    chartData,
    skillTrends,
    assessmentHistory,
    milestones,
  } = data;

  const rawChartData = chartData as unknown as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Analytics"
        description="Track your placement readiness and skill improvements from your first assessment to today."
      >
        <Tabs value={timeRange} onValueChange={setTimeRange}>
          <TabsList className="flex flex-wrap h-auto p-1 bg-slate-100 gap-1">
            <TabsTrigger value="today" className="text-xs px-2.5 py-1.5">Today</TabsTrigger>
            <TabsTrigger value="7d" className="text-xs px-2.5 py-1.5">Last 7 Days</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs px-2.5 py-1.5">Last 30 Days</TabsTrigger>
            <TabsTrigger value="3m" className="text-xs px-2.5 py-1.5">Last 3 Months</TabsTrigger>
            <TabsTrigger value="6m" className="text-xs px-2.5 py-1.5">Last 6 Months</TabsTrigger>
            <TabsTrigger value="1y" className="text-xs px-2.5 py-1.5">Last 1 Year</TabsTrigger>
            <TabsTrigger value="all" className="text-xs px-2.5 py-1.5">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{currentScore}%</div>
            <p className="text-xs text-slate-500 mt-1">Current Overall</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{startingScore}%</div>
            <p className="text-xs text-slate-500 mt-1">
              Starting Score ({timeRange})
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div
              className={cn(
                "text-2xl font-bold",
                improvement >= 0 ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {improvement >= 0 ? `+${improvement}%` : `${improvement}%`}
            </div>
            <p className="text-xs text-slate-500 mt-1">Improvement</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{bestScore}%</div>
            <p className="text-xs text-slate-500 mt-1">Best Score</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-4 lg:col-span-1">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{assessmentsCompleted}</div>
            <p className="text-xs text-slate-500 mt-1">Assessments Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Historical Chart */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2">
          <div>
            <CardTitle>Performance Progression ({timeRange})</CardTitle>
            <CardDescription>
              Track trajectory across all assessments over the selected timeframe
            </CardDescription>
          </div>
          <Badge variant="outline" className="mt-2 sm:mt-0 w-fit">
            <TrendingUp className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            Active Baseline
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            {rawChartData.length > 0 ? (
              <AreaTrendChart
                data={rawChartData}
                areas={[
                  { key: "overall", color: "#2563eb", name: "Overall Score" },
                ]}
              />
            ) : (
              <EmptyState
                icon={<AlertCircle className="h-6 w-6" />}
                title="No assessment records yet"
                description="Complete your first assessment to begin visualizing your progress trajectory."
                className="h-[300px]"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Multi-skill comparative trends */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Trends Comparison</CardTitle>
          <CardDescription>
            Multi-domain score curves across Coding, Aptitude, Reasoning, and Communication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {rawChartData.length > 0 ? (
              <TrendLineChart
                data={rawChartData}
                lines={[
                  { key: "coding", color: "#2563eb", name: "Coding" },
                  { key: "aptitude", color: "#9333ea", name: "Aptitude" },
                  { key: "reasoning", color: "#059669", name: "Reasoning" },
                  { key: "communication", color: "#d97706", name: "Communication" },
                ]}
              />
            ) : (
              <EmptyState
                icon={<TrendingUp className="h-6 w-6" />}
                title="Awaiting skill evaluations"
                description="Participate in skill assessments to populate comparative domain curves."
                className="h-[280px]"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skill Breakdown & Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Skill Breakdown & Changes</CardTitle>
            <CardDescription>
              Current score compared with previous evaluation period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {skillTrends.map((skill) => (
              <div key={skill.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">
                      {skill.name}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded font-medium",
                        skill.change >= 0
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      )}
                    >
                      {skill.change >= 0
                        ? `+${skill.change}%`
                        : `${skill.change}%`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Previous:{" "}
                    <span className="font-medium text-slate-700">
                      {skill.previous}%
                    </span>{" "}
                    | Current:{" "}
                    <span className="font-bold text-slate-900">
                      {skill.current}%
                    </span>
                  </div>
                </div>
                <Progress value={skill.current} className="h-2 bg-slate-100" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Milestones</CardTitle>
            <CardDescription>
              Verified achievements along your preparation journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            {milestones.length > 0 ? (
              <div className="space-y-4">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {milestone.achieved ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          milestone.achieved
                            ? "text-slate-900"
                            : "text-slate-400"
                        )}
                      >
                        {milestone.title}
                      </p>
                      {milestone.achieved && milestone.achievedDate && (
                        <p className="text-xs text-slate-500">
                          Achieved on{" "}
                          {new Date(milestone.achievedDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </p>
                      )}
                    </div>
                    {milestone.achieved && (
                      <Badge variant="success" className="text-[10px]">
                        Unlocked
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg">
                <Circle className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                <p className="font-medium text-slate-700">No milestones yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Milestones will unlock automatically as you complete placement benchmarks.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assessment History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
          <CardDescription>
            Record of completed tests and scored evaluations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assessmentHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Assessment</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Questions</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assessmentHistory.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="p-3 font-medium text-slate-900">
                        {a.title}
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="capitalize">
                          {a.type}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {a.duration} mins
                      </td>
                      <td className="p-3 text-slate-600">
                        {a.totalQuestions}
                      </td>
                      <td className={cn("p-3 font-semibold", a.score !== null ? "text-emerald-600" : "text-slate-500 font-normal")}>
                        {a.score !== null ? `${a.score}%` : "Legacy Submission"}
                      </td>
                      <td className="p-3">
                        <Badge variant="success">Completed</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg">
              <Clock className="h-6 w-6 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-700">
                No completed assessments
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Completed assessment attempts will appear here once submitted.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
