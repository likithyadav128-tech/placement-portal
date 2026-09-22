"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Search,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  AlertTriangle,
  FileText,
  Eye,
  Loader2,
  ArrowUpDown,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { StudentAttemptDetailModal } from "@/components/faculty/StudentAttemptDetailModal";
import { EmptyState, ErrorState } from "@/components/feedback/states";

interface AssessmentResultsData {
  assessment: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    year: string;
    branch: string;
    maxMarks: number;
    duration: number;
    status: string;
    startDate: string | null;
    endDate: string | null;
    uploadedBy: string;
  };
  summary: {
    totalStudents: number;
    submittedCount: number;
    pendingCount: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passPercentage: number;
  };
  distribution: Array<{
    range: string;
    count: number;
  }>;
  results: Array<{
    studentId: string;
    name: string;
    email: string;
    rollNumber: string;
    department: string;
    year: string;
    attemptId: string | null;
    score: number | null;
    percentage: number | null;
    status: "Passed" | "Failed" | "Needs Attention" | "Not Attempted";
    submissionTime: string | null;
    timeTaken: string;
    hasAttempt: boolean;
  }>;
}

export default function AssessmentResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const assessmentId = resolvedParams.id;

  const [data, setData] = useState<AssessmentResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortField, setSortField] = useState<"name" | "roll" | "score" | "pct" | "time">("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selected student for detail modal
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/faculty/assessments/${assessmentId}/results`)
      .then(async (res) => {
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error || "Failed to load assessment results.");
        }
        return (await res.json()) as AssessmentResultsData;
      })
      .then((json: AssessmentResultsData) => {
        if (isMounted) {
          setData(json);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error loading results.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [assessmentId]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const rawResults = data?.results;
  const filteredResults = useMemo(() => {
    if (!rawResults) return [];

    return rawResults
      .filter((r) => {
        if (statusFilter !== "All" && r.status !== statusFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            r.name.toLowerCase().includes(q) ||
            r.rollNumber.toLowerCase().includes(q) ||
            r.department.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const factor = sortOrder === "asc" ? 1 : -1;
        if (sortField === "name") return factor * a.name.localeCompare(b.name);
        if (sortField === "roll") return factor * a.rollNumber.localeCompare(b.rollNumber);
        if (sortField === "score") {
          const sA = a.score ?? -1;
          const sB = b.score ?? -1;
          return factor * (sA - sB);
        }
        if (sortField === "pct") {
          const pA = a.percentage ?? -1;
          const pB = b.percentage ?? -1;
          return factor * (pA - pB);
        }
        if (sortField === "time") {
          const tA = a.submissionTime ? new Date(a.submissionTime).getTime() : 0;
          const tB = b.submissionTime ? new Date(b.submissionTime).getTime() : 0;
          return factor * (tA - tB);
        }
        return 0;
      });
  }, [rawResults, statusFilter, search, sortField, sortOrder]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Aggregating cohort assessment results...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Link href="/faculty/assessments">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
            <ArrowLeft className="h-4 w-4" /> Back to Assessments
          </Button>
        </Link>
        <ErrorState
          title="Could not load results"
          message={error || "An error occurred while loading assessment results."}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const { assessment, summary, distribution } = data;

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 font-medium">
            <Link href="/faculty/assessments" className="hover:text-blue-600">
              Assessments
            </Link>
            <span>/</span>
            <span>{assessment.year}</span>
            <span>/</span>
            <span>{assessment.branch}</span>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Results</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {assessment.title}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {assessment.year} • {assessment.branch} • Type: <span className="uppercase font-medium">{assessment.type}</span> • Max Marks: {assessment.maxMarks}
          </p>
        </div>

        <Link href={`/faculty/assessments?year=${encodeURIComponent(assessment.year)}&branch=${encodeURIComponent(assessment.branch)}`}>
          <Button variant="outline" size="sm" className="gap-2 text-slate-600">
            <ArrowLeft className="h-4 w-4" /> Back to Assessments
          </Button>
        </Link>
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Total Students</p>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{summary.totalStudents}</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Submitted</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{summary.submittedCount}</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Pending</p>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{summary.pendingCount}</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Average Score</p>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">{summary.averageScore}%</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Highest Score</p>
            <Award className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{summary.highestScore}%</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Lowest Score</p>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{summary.lowestScore}%</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Pass Rate</p>
            <Award className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600 mt-2">{summary.passPercentage}%</p>
        </div>
      </div>

      {/* Score Distribution Histogram */}
      <Card className="rounded-xl border border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center justify-between">
            <span>Score Distribution</span>
            <span className="text-xs font-normal text-slate-500">Cohort Score Ranges</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#cbd5e1" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#cbd5e1" }} />
                <Tooltip
                  cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded shadow">
                          <p className="font-semibold">{payload[0].payload.range}</p>
                          <p>{payload[0].value} student(s)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distribution.map((entry, index) => {
                    const colors = ["#10b981", "#3b82f6", "#6366f1", "#f59e0b", "#f43f5e"];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Student Results Table with Search & Filters */}
      <Card className="rounded-xl border border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Student Results ({filteredResults.length})
            </CardTitle>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student or roll..."
                  className="h-8 pl-8 text-xs"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                {["All", "Passed", "Failed", "Needs Attention", "Not Attempted"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      statusFilter === status
                        ? "bg-white text-slate-900 font-semibold shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                <tr>
                  <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-1">
                      Student Name <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("roll")}>
                    <div className="flex items-center gap-1">
                      Roll Number <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 cursor-pointer hover:text-slate-900 text-right" onClick={() => handleSort("score")}>
                    <div className="flex items-center justify-end gap-1">
                      Score <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:text-slate-900 text-right" onClick={() => handleSort("pct")}>
                    <div className="flex items-center justify-end gap-1">
                      Percentage <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("time")}>
                    <div className="flex items-center gap-1">
                      Submission Time <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Time Taken</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      No student results found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((r) => (
                    <tr key={r.studentId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{r.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{r.rollNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{r.department}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">
                        {r.score !== null ? `${r.score}/${assessment.maxMarks}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        {r.percentage !== null ? `${r.percentage}%` : "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            r.status === "Passed"
                              ? "success"
                              : r.status === "Needs Attention"
                              ? "danger"
                              : r.status === "Failed"
                              ? "warning"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {r.submissionTime ? new Date(r.submissionTime).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{r.timeTaken}</td>
                      <td className="py-3 px-4 text-right">
                        {r.hasAttempt ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedStudentId(r.studentId);
                              setDetailModalOpen(true);
                            }}
                            className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Unattempted</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Student Attempt Detail Modal */}
      <StudentAttemptDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        assessmentId={assessmentId}
        studentId={selectedStudentId}
      />
    </div>
  );
}
