"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/states";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  Award,
  Eye,
  FileText,
  Clock,
  Code2,
  BookOpen,
} from "lucide-react";
import { StudentAttemptDetailModal } from "@/components/faculty/StudentAttemptDetailModal";
import { slugToYear, slugToBranch } from "@/lib/assessment/slugs";

interface StudentResultRow {
  studentId: string;
  name: string;
  email: string;
  rollNumber: string;
  department: string;
  year: string;
  attemptId: string | null;
  score: number | null;
  maxMarks: number;
  percentage: number | null;
  result: "PASS" | "FAIL" | "Not Evaluated";
  status: "Passed" | "Failed" | "Not Attempted";
  attemptStatus: "Attempted" | "Not Attempted";
  submissionTime: string | null;
  timeTaken: string;
  hasAttempt: boolean;
}

interface ResultsApiResponse {
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
    attemptedCount: number;
    notAttemptedCount: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passPercentage: number;
  };
  results: StudentResultRow[];
}

export default function AssessmentCohortResultsPage(props: {
  params: Promise<{ year: string; branch: string; assessmentId: string }>;
}) {
  const params = use(props.params);
  const yearSlug = params.year;
  const branchSlug = params.branch;
  const assessmentId = params.assessmentId;

  const yearLabel = slugToYear(yearSlug);
  const branchLabel = slugToBranch(branchSlug);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ResultsApiResponse | null>(null);

  // Modal inspection state
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/faculty/assessments/${assessmentId}/results`);
        if (!res.ok) {
          throw new Error("Failed to load assessment results");
        }
        const json = (await res.json()) as ResultsApiResponse;
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [assessmentId]);

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const assessment = data?.assessment;
  const summary = data?.summary;
  const results = data?.results || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Link href={`/faculty/assessments/${yearSlug}/${branchSlug}`}>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-slate-600 hover:text-slate-900 px-2">
            <ArrowLeft className="h-4 w-4" />
            Back to {yearLabel} / {branchLabel}
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
        <Link href={`/faculty/assessments/${yearSlug}/${branchSlug}`} className="text-slate-500 hover:text-slate-800 text-xs">
          {branchLabel}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
          Results
        </span>
      </div>

      {/* Header */}
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-4 w-48" />
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {assessment?.title}
            </h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">
              {assessment?.type}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-3">
            <span>{yearLabel} • {branchLabel}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-400" />
              {assessment?.duration} mins
            </span>
            <span>•</span>
            <span>Max Marks: {assessment?.maxMarks || 100}</span>
          </p>
        </div>
      )}

      {/* Summary KPI Cards (5 Cards as specified) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Students */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Students</span>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {loading ? <Skeleton className="h-7 w-12" /> : summary?.totalStudents ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Assigned cohort
            </div>
          </CardContent>
        </Card>

        {/* Attempted */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Attempted</span>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-2">
              {loading ? <Skeleton className="h-7 w-12" /> : summary?.attemptedCount ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Submitted attempts
            </div>
          </CardContent>
        </Card>

        {/* Not Attempted */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Not Attempted</span>
              <XCircle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-700 mt-2">
              {loading ? <Skeleton className="h-7 w-12" /> : summary?.notAttemptedCount ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Pending attempts
            </div>
          </CardContent>
        </Card>

        {/* Average Score */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Average Score</span>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {loading ? <Skeleton className="h-7 w-16" /> : `${summary?.averageScore ?? 0}%`}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Attempted students
            </div>
          </CardContent>
        </Card>

        {/* Highest Score */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Highest Score</span>
              <Award className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-2">
              {loading ? <Skeleton className="h-7 w-16" /> : `${summary?.highestScore ?? 0}%`}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Top benchmark
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Result Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-lg font-bold text-slate-900">
            Student Performance & Attempts
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Authoritative results for all eligible cohort students. Non-attempted students are listed with un-evaluated status.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No students are assigned to this cohort.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-3">Roll Number</th>
                    <th className="py-3 px-3 text-center">Marks</th>
                    <th className="py-3 px-3 text-center">Percentage</th>
                    <th className="py-3 px-3 text-center">Result</th>
                    <th className="py-3 px-3 text-center">Attempt</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r) => (
                    <tr key={r.studentId} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{r.name}</div>
                        <div className="text-xs text-slate-400">{r.email}</div>
                      </td>

                      {/* Roll Number */}
                      <td className="py-3 px-3 font-mono text-xs text-slate-700">
                        {r.rollNumber || "—"}
                      </td>

                      {/* Marks Obtained */}
                      <td className="py-3 px-3 text-center font-medium text-slate-900">
                        {r.hasAttempt && r.score !== null ? (
                          <span>
                            {r.score} <span className="text-slate-400 font-normal">/ {r.maxMarks}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Percentage */}
                      <td className="py-3 px-3 text-center font-bold text-slate-900">
                        {r.hasAttempt && r.percentage !== null ? (
                          `${r.percentage}%`
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      {/* Result: PASS / FAIL / Not Evaluated */}
                      <td className="py-3 px-3 text-center">
                        {r.result === "PASS" ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold">
                            PASS
                          </Badge>
                        ) : r.result === "FAIL" ? (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-bold">
                            FAIL
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200 text-xs">
                            Not Evaluated
                          </Badge>
                        )}
                      </td>

                      {/* Attempt Status: Attempted / Not Attempted */}
                      <td className="py-3 px-3 text-center">
                        {r.hasAttempt ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium">
                            Attempted
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-medium">
                            Not Attempted
                          </Badge>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        {r.hasAttempt ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedStudentId(r.studentId);
                              setDetailModalOpen(true);
                            }}
                            className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" /> Inspect Attempt
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400 italic pr-2">No submission</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
