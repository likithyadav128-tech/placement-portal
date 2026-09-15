"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/ui/select";
import { ComparisonBarChart } from "@/components/charts";
import { Download, FileBarChart, PieChart, TrendingUp, Users } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/feedback/states";

interface DepartmentPerf {
  department: string;
  studentsCount: number;
  avgReadiness: number;
  avgCoding: number;
  avgAptitude: number;
}

interface ReportItem {
  id: string;
  title: string;
  description: string;
  lastGenerated: string;
}

interface ReportsResponse {
  totalStudents: number;
  departmentPerformance: DepartmentPerf[];
  assessmentsCount: number;
  reports: ReportItem[];
}

export default function ReportsManagementPage() {
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/management/reports");
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed to load reports");
      }
      const json = (await res.json()) as ReportsResponse;
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading reports");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const reportIcons = [
    <PieChart key="1" className="w-5 h-5 text-emerald-500" />,
    <TrendingUp key="2" className="w-5 h-5 text-amber-500" />,
    <FileBarChart key="3" className="w-5 h-5 text-purple-500" />,
    <Users key="4" className="w-5 h-5 text-blue-500" />,
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading report analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Unable to load reports"
        message={error || "An unexpected error occurred."}
        onRetry={fetchReports}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Report Center"
        description="Generate and analyze institutional placement performance reports"
      />

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <Input type="date" className="w-full md:w-auto" />
          <span className="text-sm text-slate-500">to</span>
          <Input type="date" className="w-full md:w-auto" />
          <SimpleSelect
            placeholder="Department"
            options={[
              { label: "All Departments", value: "all" },
              { label: "Computer Science", value: "Computer Science" },
              { label: "Information Technology", value: "Information Technology" },
            ]}
          />
          <SimpleSelect
            placeholder="Year"
            options={[
              { label: "All Years", value: "all" },
              { label: "3rd Year", value: "3" },
              { label: "4th Year", value: "4" },
            ]}
          />
        </CardContent>
      </Card>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.reports.map((cat, i) => (
          <Card key={cat.id || i} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center mb-2">
                {reportIcons[i % reportIcons.length]}
              </div>
              <CardTitle className="text-base">{cat.title}</CardTitle>
              <CardDescription className="text-xs">{cat.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-4">
              <div className="text-xs text-slate-500 mb-3">
                Last generated: {new Date(cat.lastGenerated).toLocaleDateString()}
              </div>
              <Button className="w-full gap-2" variant="outline">
                Generate Report
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Department Comparison Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Department Comparison Preview</CardTitle>
            <CardDescription>
              Aggregated from {data.totalStudents} student records across {data.departmentPerformance.length} branches
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" /> PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          {data.departmentPerformance.length > 0 ? (
            <ComparisonBarChart
              data={data.departmentPerformance.map((d) => ({
                department: d.department.length > 15 ? d.department.substring(0, 15) + "..." : d.department,
                avgReadiness: d.avgReadiness,
                avgCoding: d.avgCoding,
                avgAptitude: d.avgAptitude,
              }))}
              xKey="department"
              bars={[
                { key: "avgReadiness", color: "#10b981", name: "Readiness %" },
                { key: "avgCoding", color: "#3b82f6", name: "Coding Avg %" },
                { key: "avgAptitude", color: "#f59e0b", name: "Aptitude Avg %" },
              ]}
            />
          ) : (
            <EmptyState
              title="No department data available"
              description="Comparative metrics will appear as students register and are evaluated."
              className="h-full"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
