"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  AlertTriangle,
  BookOpen,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  StatCard,
  TrendLineChart,
  ComparisonBarChart,
} from "@/components/charts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRole } from "@/context/RoleContext";
import { EmptyState, ErrorState } from "@/components/feedback/states";

interface FacultyDashboardData {
  faculty: {
    id: string;
    name: string;
    department: string;
    designation: string;
  };
  totalStudents: number;
  averagePerformance: number;
  needingAttentionCount: number;
  activeAssessments: number;
  performanceTrends: Array<{ month: string; average: number }>;
  deptComparison: Array<{ name: string; score: number }>;
  studentsNeedingAttention: Array<{
    id: string;
    name: string;
    rollNumber: string;
    department: string;
    overallScore: number;
    trend: string;
    issue: string;
    lastActivity: string;
  }>;
}

export default function FacultyDashboard() {
  const { user } = useRole();
  const [data, setData] = useState<FacultyDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [time] = useState<string>(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 18) return "Afternoon";
    return "Evening";
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/faculty/dashboard");
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed to load faculty dashboard data");
      }
      const json = (await res.json()) as FacultyDashboardData;
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
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
          <p className="text-sm text-slate-500 font-medium">Loading faculty dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Unable to load dashboard"
        message={error || "An unexpected error occurred while fetching faculty data."}
        onRetry={loadData}
      />
    );
  }

  const displayName = user?.name ? `, ${user.name}` : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good ${time}${displayName}`}
        description="Here is what's happening with your assigned student cohort today."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Students"
          value={data.totalStudents.toString()}
          icon={<Users className="w-5 h-5" />}
          change={data.totalStudents > 0 ? "Active cohort" : "No students assigned"}
          changeType="positive"
        />
        <StatCard
          title="Average Performance"
          value={`${data.averagePerformance}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          change={data.totalStudents > 0 ? "Cohort average" : "N/A"}
          changeType="positive"
        />
        <StatCard
          title="Needing Attention"
          value={data.needingAttentionCount.toString()}
          icon={<AlertTriangle className="w-5 h-5" />}
          change={data.needingAttentionCount > 0 ? "Action recommended" : "Cohort on track"}
          changeType={data.needingAttentionCount > 0 ? "negative" : "positive"}
        />
        <StatCard
          title="Active Assessments"
          value={data.activeAssessments.toString()}
          icon={<BookOpen className="w-5 h-5" />}
          description="Published benchmark tests"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Cohort Performance Trend</CardTitle>
            <CardDescription>Average scores over completed evaluation periods</CardDescription>
          </CardHeader>
          <CardContent>
            {data.performanceTrends.length > 0 ? (
              <TrendLineChart
                data={data.performanceTrends}
                lines={[{ key: "average", color: "#2563eb", name: "Cohort Average" }]}
                height={300}
              />
            ) : (
              <EmptyState
                icon={<TrendingUp className="h-6 w-6" />}
                title="No performance trends"
                description="Performance curves will populate as assigned students complete assessments."
                className="h-[280px]"
              />
            )}
          </CardContent>
        </Card>

        {/* Department Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Department Comparison</CardTitle>
            <CardDescription>Average performance across engineering departments</CardDescription>
          </CardHeader>
          <CardContent>
            {data.deptComparison.length > 0 ? (
              <ComparisonBarChart
                data={data.deptComparison}
                bars={[{ key: "score", color: "#3b82f6", name: "Avg Score" }]}
                height={300}
              />
            ) : (
              <EmptyState
                icon={<Users className="h-6 w-6" />}
                title="No department data"
                description="Comparative metrics will appear as students are assigned across branches."
                className="h-[280px]"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attention Panel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Students Needing Attention</CardTitle>
            <CardDescription>
              Assigned students with declining trends or overall score below 60%
            </CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href="/faculty/attention">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data.studentsNeedingAttention.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">Issue</th>
                    <th className="px-4 py-3 font-medium">Trend</th>
                    <th className="px-4 py-3 font-medium">Last Activity</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.studentsNeedingAttention.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                              {student.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-slate-900">
                              {student.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {student.rollNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            student.overallScore < 50
                              ? "text-rose-600 font-medium"
                              : "text-amber-600 font-medium"
                          }
                        >
                          {student.overallScore}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className={
                            student.trend === "declining"
                              ? "border-rose-200 text-rose-700 bg-rose-50"
                              : "border-amber-200 text-amber-700 bg-amber-50"
                          }
                        >
                          {student.issue}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {student.trend === "declining" ? (
                          <ArrowDownRight className="w-4 h-4 text-rose-500" />
                        ) : student.trend === "improving" ? (
                          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <span className="text-slate-400 text-xl leading-none">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(student.lastActivity).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          asChild
                        >
                          <Link href={`/faculty/students/${student.id}`}>
                            View Student
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No students requiring intervention"
              description="All students in your assigned cohort are currently performing within benchmark expectations."
              className="py-12"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
