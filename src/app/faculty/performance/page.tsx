"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ComparisonBarChart, TrendLineChart, DonutChart } from "@/components/charts";
import { EmptyState, ErrorState } from "@/components/feedback/states";

interface PerformanceResponse {
  totalStudents: number;
  skillDistribution: Array<{ name: string; value: number; color: string }>;
  deptComparison: Array<{ name: string; score: number }>;
  trendData: Array<{ month: string; overall: number }>;
}

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/faculty/performance");
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed to load faculty performance metrics");
      }
      const json = (await res.json()) as PerformanceResponse;
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading performance data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading performance analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Unable to load performance metrics"
        message={error || "An unexpected error occurred while fetching cohort data."}
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Performance"
        description="Analyze performance metrics and skill distributions across your assigned cohort."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Department Comparison</CardTitle>
            <CardDescription>Average performance across branches in your assigned cohort</CardDescription>
          </CardHeader>
          <CardContent>
            {data.deptComparison.length > 0 ? (
              <ComparisonBarChart
                data={data.deptComparison}
                bars={[{ key: "score", color: "#3b82f6", name: "Score" }]}
                height={300}
              />
            ) : (
              <EmptyState
                title="No department data"
                description="Department metrics will populate once students in your cohort complete assessments."
                className="h-[280px]"
              />
            )}
          </CardContent>
        </Card>

        {/* Skill Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Domain Skill Distribution</CardTitle>
            <CardDescription>Average proficiency across Coding, Aptitude, Reasoning, and Communication</CardDescription>
          </CardHeader>
          <CardContent>
            {data.totalStudents > 0 ? (
              <DonutChart data={data.skillDistribution} height={300} />
            ) : (
              <EmptyState
                title="No skill data"
                description="Skill distributions will appear once students are assigned and evaluated."
                className="h-[280px]"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cohort Progression Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends Over Time</CardTitle>
          <CardDescription>Progression trends calculated from completed benchmark assessments</CardDescription>
        </CardHeader>
        <CardContent>
          {data.trendData.length > 0 ? (
            <TrendLineChart
              data={data.trendData}
              lines={[{ key: "overall", color: "#2563eb", name: "Cohort Average" }]}
              height={300}
            />
          ) : (
            <EmptyState
              title="Awaiting evaluation milestones"
              description="Historical trend curves will appear here as students complete benchmark tests."
              className="h-[280px]"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
