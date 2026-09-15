"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard, ComparisonBarChart, DonutChart } from "@/components/charts";
import { Users, UserCheck, Activity, BookOpen, AlertCircle, FileText, Target } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/feedback/states";

interface ManagementOverviewData {
  totalStudents: number;
  totalFaculty: number;
  avgReadiness: number;
  participationRate: number;
  studentsNeedingAttention: number;
  activeAssessments: number;
  availableTests: number;
  totalRoadmaps: number;
  recentAuditLogs: Array<{
    id: string;
    actor: string;
    role: string;
    action: string;
    target: string;
    status: string;
    timestamp: string;
  }>;
  deptComparison: Array<{
    name: string;
    readiness: number;
  }>;
}

export default function ManagementDashboardPage() {
  const [data, setData] = useState<ManagementOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/management/overview");
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed to load management overview");
      }
      const json = (await res.json()) as ManagementOverviewData;
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading dashboard");
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
          <p className="text-sm text-slate-500 font-medium">Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Unable to load management dashboard"
        message={error || "An unexpected error occurred while fetching institutional data."}
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Executive Dashboard"
        description="Comprehensive institutional metrics, placement readiness, and audit activity"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={data.totalStudents.toString()}
          icon={<Users className="w-5 h-5" />}
          change="Registered"
          changeType="positive"
        />
        <StatCard
          title="Total Faculty"
          value={data.totalFaculty.toString()}
          icon={<UserCheck className="w-5 h-5" />}
          change="Appointed"
          changeType="positive"
        />
        <StatCard
          title="Avg Readiness"
          value={`${data.avgReadiness}%`}
          icon={<Target className="w-5 h-5" />}
          change="Institutional Mean"
          changeType="positive"
        />
        <StatCard
          title="Participation Rate"
          value={`${data.participationRate}%`}
          icon={<Activity className="w-5 h-5" />}
          change="Active assessment rate"
          changeType="positive"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-rose-50 border-rose-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-900">{data.studentsNeedingAttention}</div>
            <p className="text-xs text-rose-600 mt-1">Readiness below 50%</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Active Benchmarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{data.activeAssessments}</div>
            <p className="text-xs text-blue-600 mt-1">Published tests</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Mock Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{data.availableTests}</div>
            <p className="text-xs text-emerald-600 mt-1">Available in portal</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Curated Roadmaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{data.totalRoadmaps}</div>
            <p className="text-xs text-purple-600 mt-1">Learning paths</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Department Readiness Comparison</CardTitle>
            <CardDescription>Average readiness score across engineering branches</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {data.deptComparison.length > 0 ? (
              <ComparisonBarChart
                data={data.deptComparison}
                xKey="name"
                bars={[{ key: "readiness", color: "#3b82f6", name: "Readiness %" }]}
              />
            ) : (
              <EmptyState
                title="No department data"
                description="Department metrics will appear as students register and are evaluated."
                className="h-full"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assessment Participation</CardTitle>
            <CardDescription>Cohort participation breakdown</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {data.totalStudents > 0 ? (
              <DonutChart
                data={[
                  { name: "Participated", value: data.participationRate, color: "#10b981" },
                  { name: "Pending", value: 100 - data.participationRate, color: "#94a3b8" },
                ]}
              />
            ) : (
              <EmptyState
                title="Awaiting registrations"
                description="Participation distributions will populate once students join the portal."
                className="h-full"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail & Security Activity</CardTitle>
          <CardDescription>Recent immutable audit logs recorded in PostgreSQL</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentAuditLogs.length > 0 ? (
            <div className="space-y-4">
              {data.recentAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{log.action}</p>
                    <p className="text-xs text-slate-500">
                      {log.actor} ({log.role}) • Target: {log.target}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="capitalize">
                      {log.status}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No recent audit logs"
              description="Administrative actions and security events will be logged here."
              className="py-8"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
