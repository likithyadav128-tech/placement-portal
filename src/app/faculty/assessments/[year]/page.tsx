"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/states";
import { ArrowLeft, ArrowRight, Binary, Cpu, ShieldCheck, Database } from "lucide-react";
import { BRANCHES, slugToYear } from "@/lib/assessment/slugs";

interface BranchStats {
  assessmentCount: number;
  studentCount: number;
}

interface ApiResponse {
  branchStats: Record<string, BranchStats>;
  cohortStats?: Record<string, Record<string, BranchStats>>;
}

const BRANCH_ICONS: Record<string, typeof Binary> = {
  "AI & DS": Database,
  "AI & ML": Cpu,
  "CSE": Binary,
  "Cyber Security": ShieldCheck,
};

export default function FacultyAssessmentsBranchPage(props: {
  params: Promise<{ year: string }>;
}) {
  const params = use(props.params);
  const yearSlug = params.year;
  const yearLabel = slugToYear(yearSlug);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/faculty/assessments?year=${encodeURIComponent(yearLabel)}`);
        if (!res.ok) {
          throw new Error("Failed to load departments data");
        }
        const json = (await res.json()) as ApiResponse;
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [yearLabel]);

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/faculty/assessments">
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Back to Assessments
          </Button>
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-medium text-slate-500">{yearLabel}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {yearLabel}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Select a department or branch to view assessments, cohorts, and performance.
        </p>
      </div>

      {/* 4 Branch Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-10 w-10 rounded-lg mb-4" />
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-20 mb-6" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BRANCHES.map((branch) => {
            const Icon = BRANCH_ICONS[branch.label] || Binary;
            // Prefer cohort-specific stats for this year + branch if available
            const stats =
              data?.cohortStats?.[yearLabel]?.[branch.label] ||
              data?.branchStats?.[branch.label] ||
              { assessmentCount: 0, studentCount: 0 };

            return (
              <Card
                key={branch.slug}
                className="group hover:border-blue-300 hover:shadow-md transition-all duration-200 border-slate-200"
              >
                <CardContent className="p-6 flex flex-col justify-between h-full space-y-6">
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-105 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {branch.label}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Engineering Cohort
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-sm">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Students</span>
                      <span className="font-semibold text-slate-900">
                        {stats.studentCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Assessments</span>
                      <span className="font-semibold text-slate-900">
                        {stats.assessmentCount}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/faculty/assessments/${yearSlug}/${branch.slug}`}
                    className="block w-full"
                  >
                    <Button
                      variant="outline"
                      className="w-full justify-between text-blue-600 border-blue-200 hover:bg-blue-50 group-hover:border-blue-400"
                    >
                      <span>Open</span>
                      <ArrowRight className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
