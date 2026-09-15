"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/charts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { EmptyState, ErrorState } from "@/components/feedback/states";

interface FacultyAnalyticsData {
  averagePerformance: number;
  medianScore: number;
  improvingCount: number;
  decliningCount: number;
  completionRate: number;
  scoreDistribution: Array<{ range: string; count: number }>;
  monthlyTrends: Array<{
    month: string;
    coding: number;
    aptitude: number;
    reasoning: number;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<FacultyAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/faculty/analytics");
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed to load faculty analytics");
      }
      const json = (await res.json()) as FacultyAnalyticsData;
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading analytics");
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
          <p className="text-sm text-slate-500 font-medium">Loading cohort analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Unable to load analytics"
        message={error || "An unexpected error occurred while fetching analytics."}
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Deep dive into comprehensive performance analytics and benchmark distributions."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Average Performance"
          value={`${data.averagePerformance}%`}
          change="Cohort Mean"
          changeType="positive"
        />
        <StatCard title="Median Score" value={`${data.medianScore}%`} />
        <StatCard
          title="Students Improving"
          value={data.improvingCount.toString()}
          change="Upward trend"
          changeType="positive"
        />
        <StatCard
          title="Students Declining"
          value={data.decliningCount.toString()}
          change={data.decliningCount > 0 ? "Requires review" : "None declining"}
          changeType={data.decliningCount > 0 ? "negative" : "positive"}
        />
        <StatCard
          title="Completion Rate"
          value={`${data.completionRate}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>Number of students in each performance tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.scoreDistribution} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "#f1f5f9" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Domain Trends</CardTitle>
            <CardDescription>Average performance by domain across completed months</CardDescription>
          </CardHeader>
          <CardContent>
            {data.monthlyTrends.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyTrends} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />
                    <Tooltip
                      cursor={{ fill: "#f1f5f9" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar dataKey="coding" fill="#2563eb" name="Coding" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="aptitude" fill="#10b981" name="Aptitude" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="reasoning" fill="#f59e0b" name="Reasoning" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                title="Awaiting monthly submissions"
                description="Domain trends will appear as cohort attempts are evaluated over time."
                className="h-[300px]"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
