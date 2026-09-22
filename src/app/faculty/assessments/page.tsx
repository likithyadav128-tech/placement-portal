"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/ui/select";
import {
  Upload,
  Search,
  BookOpen,
  Users,
  Calendar,
  Clock,
  ArrowUpDown,
  Download,
  Eye,
  CheckCircle2,
  FolderTree,
  FileText,
  Layers,
  Sparkles,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";
import { UploadAssessmentModal } from "@/components/faculty/UploadAssessmentModal";
import { EmptyState, ErrorState } from "@/components/feedback/states";

interface AssessmentItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  difficulty: string;
  duration: number;
  totalQuestions: number;
  status: string;
  computedStatus: "draft" | "upcoming" | "active" | "closed" | "published";
  year: string;
  branch: string;
  startDate: string | null;
  endDate: string | null;
  maxMarks: number;
  fileName: string | null;
  filePath: string | null;
  fileType: string | null;
  fileSize: number | null;
  uploadedBy: string;
  createdAt: string;
  studentsCount: number;
  submissionsCount: number;
  averageScore: number | null;
}

interface YearBranchStats {
  [key: string]: {
    assessmentCount: number;
    studentCount: number;
  };
}

const ALL_YEARS = ["4th Year", "3rd Year", "2nd Year"];
const ALL_BRANCHES = ["AI & DS", "AI & ML", "CSE", "Cyber Security"];

export default function FacultyAssessmentsPage() {
  // Navigation & Hierarchy State: Default is 3rd Year / AI & DS as specified in prompt
  const [selectedYear, setSelectedYear] = useState<string>("3rd Year");
  const [selectedBranch, setSelectedBranch] = useState<string>("AI & DS");

  // Filter & Search State
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("all");

  // Sorting
  const [sortField, setSortField] = useState<"title" | "date" | "submissions" | "score">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Data & Loading State
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [yearStats, setYearStats] = useState<YearBranchStats>({});
  const [branchStats, setBranchStats] = useState<YearBranchStats>({});
  const [totalCohortStudents, setTotalCohortStudents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedYear && selectedYear !== "All") params.set("year", selectedYear);
      if (selectedBranch && selectedBranch !== "All") params.set("branch", selectedBranch);

      const res = await fetch(`/api/faculty/assessments?${params.toString()}`);
      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errJson.error || "Failed to load assessments.");
      }

      const json = (await res.json()) as {
        assessments?: AssessmentItem[];
        yearStats?: YearBranchStats;
        branchStats?: YearBranchStats;
        totalCohortStudents?: number;
      };
      setAssessments(json.assessments || []);
      setYearStats(json.yearStats || {});
      setBranchStats(json.branchStats || {});
      setTotalCohortStudents(json.totalCohortStudents || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading assessments.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedBranch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const filteredAssessments = useMemo(() => {
    return assessments
      .filter((a) => {
        if (search) {
          const q = search.toLowerCase();
          const matchesTitle = a.title.toLowerCase().includes(q);
          const matchesDesc = a.description?.toLowerCase().includes(q);
          if (!matchesTitle && !matchesDesc) return false;
        }
        if (typeFilter !== "ALL" && a.type.toUpperCase() !== typeFilter) {
          return false;
        }
        if (statusFilter !== "all") {
          if (a.computedStatus !== statusFilter && a.status !== statusFilter) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const factor = sortOrder === "asc" ? 1 : -1;
        if (sortField === "title") return factor * a.title.localeCompare(b.title);
        if (sortField === "date") return factor * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        if (sortField === "submissions") return factor * (a.submissionsCount - b.submissionsCount);
        if (sortField === "score") {
          const sA = a.averageScore ?? -1;
          const sB = b.averageScore ?? -1;
          return factor * (sA - sB);
        }
        return 0;
      });
  }, [assessments, search, typeFilter, statusFilter, sortField, sortOrder]);

  const getStatusBadge = (computedStatus: string, rawStatus: string) => {
    const s = computedStatus || rawStatus;
    switch (s.toLowerCase()) {
      case "active":
        return <Badge variant="success" className="text-[10px]">Active</Badge>;
      case "published":
        return <Badge variant="default" className="text-[10px]">Published</Badge>;
      case "upcoming":
        return <Badge variant="warning" className="text-[10px]">Upcoming</Badge>;
      case "closed":
        return <Badge variant="secondary" className="text-[10px]">Closed</Badge>;
      case "draft":
        return <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600">Draft</Badge>;
      case "evaluated":
        return <Badge className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">Evaluated</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{s}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case "CODING":
        return <Badge variant="default" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">Coding</Badge>;
      case "APTITUDE":
        return <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Aptitude</Badge>;
      case "QUIZ":
        return <Badge variant="warning" className="text-[10px]">Quiz</Badge>;
      case "THEORY":
        return <Badge className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">Theory</Badge>;
      case "ASSIGNMENT":
        return <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Assignment</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assessments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize, upload, and evaluate placement assessments across academic cohorts.
          </p>
        </div>

        <Button
          onClick={() => setUploadModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs"
        >
          <Upload className="h-4 w-4" />
          + Upload Assessment
        </Button>
      </div>

      {/* Top Filter Bar with Quick Selectors */}
      <Card className="rounded-xl border border-slate-200 shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Year Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Year</label>
              <SimpleSelect
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                options={[
                  { label: "All Years", value: "All" },
                  { label: "4th Year", value: "4th Year" },
                  { label: "3rd Year", value: "3rd Year" },
                  { label: "2nd Year", value: "2nd Year" },
                ]}
              />
            </div>

            {/* Branch Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Branch</label>
              <SimpleSelect
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                options={[
                  { label: "All Branches", value: "All" },
                  { label: "AI & DS", value: "AI & DS" },
                  { label: "AI & ML", value: "AI & ML" },
                  { label: "CSE", value: "CSE" },
                  { label: "Cyber Security", value: "Cyber Security" },
                ]}
              />
            </div>

            {/* Search */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search assessment..."
                  className="pl-8 text-xs"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Assessment Type</label>
              <SimpleSelect
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[
                  { label: "All Types", value: "ALL" },
                  { label: "Quiz", value: "QUIZ" },
                  { label: "Aptitude", value: "APTITUDE" },
                  { label: "Coding", value: "CODING" },
                  { label: "Theory", value: "THEORY" },
                  { label: "Assignment", value: "ASSIGNMENT" },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Year Selection Cards (Always accessible or active when selected) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Academic Year
          </h2>
          {selectedYear !== "All" && (
            <button
              onClick={() => setSelectedYear("All")}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Show All Years
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ALL_YEARS.map((y) => {
            const isSelected = selectedYear === y;
            const stats = yearStats[y] || { assessmentCount: 0, studentCount: 0 };
            return (
              <div
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-50/70 border-blue-500 shadow-xs ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-base font-bold ${isSelected ? "text-blue-900" : "text-slate-900"}`}>
                    {y}
                  </span>
                  <Badge variant={isSelected ? "default" : "secondary"} className="text-xs">
                    {stats.assessmentCount} Assessments
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  {stats.studentCount > 0 ? `${stats.studentCount} Students in cohort` : "Cohort active"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Branch Selection Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Branch / Department
          </h2>
          {selectedBranch !== "All" && (
            <button
              onClick={() => setSelectedBranch("All")}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Show All Branches
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ALL_BRANCHES.map((b) => {
            const isSelected = selectedBranch === b;
            const stats = branchStats[b] || { assessmentCount: 0, studentCount: 0 };
            return (
              <div
                key={b}
                onClick={() => setSelectedBranch(b)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-50/70 border-blue-500 shadow-xs ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${isSelected ? "text-blue-900" : "text-slate-900"}`}>
                    {b}
                  </span>
                </div>
                <div className="mt-2 flex flex-col gap-1 text-[11px] text-slate-500">
                  <span>{stats.assessmentCount} Assessments</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-slate-400" />
                    {stats.studentCount > 0 ? `${stats.studentCount} Students` : "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Filter Breadcrumb */}
      <div className="flex items-center justify-between py-2 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="font-semibold text-slate-900">Current Scope:</span>
          <Badge variant="outline" className="text-xs bg-white">
            {selectedYear}
          </Badge>
          <span>•</span>
          <Badge variant="outline" className="text-xs bg-white">
            {selectedBranch}
          </Badge>
          {typeFilter !== "ALL" && (
            <>
              <span>•</span>
              <Badge variant="secondary" className="text-xs">
                Type: {typeFilter}
              </Badge>
            </>
          )}
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong className="text-slate-900">{filteredAssessments.length}</strong> assessment(s)
        </div>
      </div>

      {/* Assessment List Table */}
      <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Loading cohort assessments...</p>
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorState
                title="Failed to load assessments"
                message={error || "An error occurred while loading assessments."}
                onRetry={loadData}
              />
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No assessments found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No assessments have been published yet for {selectedYear} • {selectedBranch}.
              </p>
              <Button
                onClick={() => setUploadModalOpen(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                size="sm"
              >
                <Upload className="h-3.5 w-3.5" /> + Upload Assessment
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                  <tr>
                    <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort("title")}>
                      <div className="flex items-center gap-1">
                        Assessment <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Uploaded By</th>
                    <th className="py-3 px-3 cursor-pointer hover:text-slate-900" onClick={() => handleSort("date")}>
                      <div className="flex items-center gap-1">
                        Uploaded On <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Start Date</th>
                    <th className="py-3 px-3">End Date</th>
                    <th className="py-3 px-3 text-center">Students</th>
                    <th className="py-3 px-3 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort("submissions")}>
                      <div className="flex items-center justify-center gap-1">
                        Submissions <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right cursor-pointer hover:text-slate-900" onClick={() => handleSort("score")}>
                      <div className="flex items-center justify-end gap-1">
                        Avg Score <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssessments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Title & Description */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 line-clamp-1">{a.title}</div>
                        {a.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{a.description}</div>
                        )}
                        {a.fileName && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-600 mt-1">
                            <FileText className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[180px]">{a.fileName}</span>
                          </div>
                        )}
                      </td>

                      {/* Type */}
                      <td className="py-3 px-3">{getTypeBadge(a.type)}</td>

                      {/* Uploaded By */}
                      <td className="py-3 px-3 text-slate-600 font-medium">{a.uploadedBy}</td>

                      {/* Uploaded On */}
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </td>

                      {/* Start Date */}
                      <td className="py-3 px-3 text-slate-500">
                        {a.startDate ? new Date(a.startDate).toLocaleDateString() : "—"}
                      </td>

                      {/* End Date */}
                      <td className="py-3 px-3 text-slate-500">
                        {a.endDate ? new Date(a.endDate).toLocaleDateString() : "—"}
                      </td>

                      {/* Students Count */}
                      <td className="py-3 px-3 text-center font-medium text-slate-700">
                        {a.studentsCount}
                      </td>

                      {/* Submissions */}
                      <td className="py-3 px-3 text-center font-semibold text-slate-900">
                        {a.submissionsCount} / {a.studentsCount}
                      </td>

                      {/* Average Score */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {a.averageScore !== null ? `${a.averageScore}%` : "—"}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(a.computedStatus, a.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/faculty/assessments/${a.id}/results`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Eye className="h-3 w-3 mr-1" /> View Results
                            </Button>
                          </Link>
                          {a.filePath && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/faculty/assessments/${a.id}/file`);
                                  const json = (await res.json()) as { downloadUrl?: string };
                                  if (json.downloadUrl) {
                                    window.open(json.downloadUrl, "_blank");
                                  }
                                } catch (err) {
                                  alert("Could not download assessment file.");
                                }
                              }}
                              className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
                              title="Download Attachment"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Assessment Modal */}
      <UploadAssessmentModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={loadData}
        defaultYear={selectedYear !== "All" ? selectedYear : "3rd Year"}
        defaultBranch={selectedBranch !== "All" ? selectedBranch : "AI & DS"}
      />
    </div>
  );
}
