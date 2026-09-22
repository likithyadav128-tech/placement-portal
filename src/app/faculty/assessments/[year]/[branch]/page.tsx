"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState, EmptyState } from "@/components/feedback/states";
import {
  ArrowLeft,
  Plus,
  Eye,
  Download,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Code2,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import { UploadAssessmentModal } from "@/components/faculty/UploadAssessmentModal";
import { slugToYear, slugToBranch } from "@/lib/assessment/slugs";

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
  uploadedBy: string;
  createdAt: string;
  studentsCount: number;
  submissionsCount: number;
  notAttemptedCount: number;
  averageScore: number | null;
}

interface ApiResponse {
  assessments: AssessmentItem[];
  totalAssessments: number;
  totalCohortStudents: number;
}

export default function FacultyBranchAssessmentsPage(props: {
  params: Promise<{ year: string; branch: string }>;
}) {
  const params = use(props.params);
  const yearSlug = params.year;
  const branchSlug = params.branch;
  const yearLabel = slugToYear(yearSlug);
  const branchLabel = slugToBranch(branchSlug);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/faculty/assessments?year=${encodeURIComponent(yearLabel)}&branch=${encodeURIComponent(branchLabel)}`
      );
      if (!res.ok) {
        throw new Error("Failed to load branch assessments");
      }
      const json = (await res.json()) as ApiResponse;
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [yearLabel, branchLabel]);

  // Helper for type badges
  const getTypeBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case "CODING":
        return (
          <Badge variant="default" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 text-[11px]">
            <Code2 className="h-3 w-3" /> Coding
          </Badge>
        );
      case "APTITUDE":
        return (
          <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 gap-1 text-[11px]">
            <BookOpen className="h-3 w-3" /> Aptitude
          </Badge>
        );
      case "QUIZ":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-[11px]">
            <ClipboardList className="h-3 w-3" /> Quiz
          </Badge>
        );
      case "THEORY":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-[11px]">
            <FileText className="h-3 w-3" /> Theory
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1 text-[11px]">
            {type}
          </Badge>
        );
    }
  };

  // Helper for status badges
  const getStatusBadge = (computedStatus: string, rawStatus: string) => {
    if (computedStatus === "closed" || rawStatus === "archived") {
      return (
        <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 text-[11px]">
          Completed
        </Badge>
      );
    }
    if (computedStatus === "active" || rawStatus === "published") {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-[11px]">
          <CheckCircle2 className="h-3 w-3" /> Active
        </Badge>
      );
    }
    if (computedStatus === "upcoming") {
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200 gap-1 text-[11px]">
          <Clock className="h-3 w-3" /> Upcoming
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-[11px]">
        Draft
      </Badge>
    );
  };

  const assessments = data?.assessments || [];

  // Completed or evaluated assessments (primary view requested)
  const completedAssessments = assessments.filter(
    (a) =>
      a.computedStatus === "closed" ||
      a.status === "archived" ||
      a.submissionsCount > 0 ||
      a.computedStatus === "active" ||
      a.status === "published"
  );

  // Check if cohort has students assigned
  const cohortStudentCount = assessments.length > 0 ? assessments[0].studentsCount : (data?.totalCohortStudents ?? 0);

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <ErrorState message={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/faculty/assessments/${yearSlug}`}>
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-slate-600 hover:text-slate-900 px-2">
              <ArrowLeft className="h-4 w-4" />
              Back to {yearLabel}
            </Button>
          </Link>
          <span className="text-slate-300">/</span>
          <Link href="/faculty/assessments" className="text-slate-500 hover:text-slate-800 text-xs">
            Assessments
          </Link>
          <span className="text-slate-300">/</span>
          <Link href={`/faculty/assessments/${yearSlug}`} className="text-slate-500 hover:text-slate-800 text-xs">
            {yearLabel}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-semibold text-slate-800">{branchLabel}</span>
        </div>

        {/* Upload Assessment Button (Always at top right) */}
        <Button
          onClick={() => setUploadModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm text-sm"
        >
          <Plus className="h-4 w-4" />
          Upload Assessment
        </Button>
      </div>

      {/* Cohort Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {yearLabel} / {branchLabel}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {cohortStudentCount > 0
            ? `${cohortStudentCount} assigned student${cohortStudentCount === 1 ? "" : "s"} in this cohort.`
            : "No students assigned to this cohort."}
        </p>
      </div>

      {/* Completed Assessments Section */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">
                Completed Assessments
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Evaluated assessments and student attempt benchmarks for {yearLabel} • {branchLabel}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="font-semibold text-slate-700">
              {completedAssessments.length} assessment{completedAssessments.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-9 w-28 rounded-lg" />
                </div>
              ))}
            </div>
          ) : completedAssessments.length === 0 ? (
            <div className="p-12 text-center">
              <EmptyState
                title="No completed assessments"
                description={`There are no completed assessments recorded for ${yearLabel} / ${branchLabel} yet.`}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadModalOpen(true)}
                    className="mt-2 text-blue-600 border-blue-200"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Create or Upload Assessment
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Assessment Name</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 text-center">Students</th>
                    <th className="py-3 px-3 text-center">Attempted</th>
                    <th className="py-3 px-3 text-right">Average Score</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedAssessments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & optional attachment */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{a.title}</div>
                        {a.description && (
                          <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{a.description}</div>
                        )}
                        {a.fileName && (
                          <div className="flex items-center gap-1 text-[11px] text-blue-600 mt-1">
                            <FileText className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[200px]">{a.fileName}</span>
                          </div>
                        )}
                      </td>

                      {/* Type */}
                      <td className="py-3 px-3">{getTypeBadge(a.type)}</td>

                      {/* Date */}
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {new Date(a.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Students Count */}
                      <td className="py-3 px-3 text-center font-medium text-slate-700">
                        {a.studentsCount}
                      </td>

                      {/* Attempted Count */}
                      <td className="py-3 px-3 text-center font-semibold text-slate-900">
                        {a.submissionsCount}
                      </td>

                      {/* Average Score */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {a.averageScore !== null ? `${a.averageScore}%` : "—"}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(a.computedStatus, a.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/faculty/assessments/${yearSlug}/${branchSlug}/${a.id}/results`}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs font-medium text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> View Results
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
                                } catch {
                                  alert("Could not download assessment file.");
                                }
                              }}
                              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800"
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

      {/* Upload Assessment Modal with locked/prefilled year and branch */}
      <UploadAssessmentModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={loadData}
        defaultYear={yearLabel}
        defaultBranch={branchLabel}
      />
    </div>
  );
}
