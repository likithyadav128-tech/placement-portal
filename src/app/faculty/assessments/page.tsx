"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/charts";
import { Clock, Users, FileText, ChevronDown } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/feedback/states";

interface FacultyAssessment {
  id: string;
  title: string;
  description: string | null;
  type: string;
  difficulty: string;
  duration: number;
  totalQuestions: number;
  status: string;
  participantsCount: number;
  averageScore: number | null;
  createdAt: string;
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<FacultyAssessment[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/faculty/assessments");
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed to load assessments");
      }
      const json = (await res.json()) as { assessments?: FacultyAssessment[]; activeCount?: number };
      setAssessments(json.assessments || []);
      setActiveCount(json.activeCount || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading assessments");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAssessments = assessments.filter((a) => {
    if (typeFilter !== "All" && a.type !== typeFilter.toLowerCase()) return false;
    if (statusFilter !== "All" && a.status !== statusFilter.toLowerCase()) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "published":
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "draft":
      case "upcoming":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "archived":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy":
        return "text-emerald-600 bg-emerald-50";
      case "medium":
        return "text-blue-600 bg-blue-50";
      case "hard":
        return "text-rose-600 bg-rose-50";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading assessments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load assessments"
        message={error}
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Assessment Monitoring"
          description="Track and monitor student performance on published benchmarks."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Benchmarks"
          value={assessments.length.toString()}
          icon={<FileText className="w-5 h-5" />}
        />
        <StatCard
          title="Published & Active"
          value={activeCount.toString()}
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          title="Total Submissions"
          value={assessments
            .reduce((sum, a) => sum + a.participantsCount, 0)
            .toString()}
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      <div className="flex gap-4">
        <select
          className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="All">All Types</option>
          <option value="coding">Coding</option>
          <option value="aptitude">Aptitude</option>
        </select>
        <select
          className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {filteredAssessments.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="No assessments found"
          description="There are no assessments matching your filter criteria in PostgreSQL."
          className="py-12"
        />
      ) : (
        <div className="space-y-4">
          {filteredAssessments.map((a) => (
            <Card key={a.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 text-base">{a.title}</h3>
                      <Badge variant="secondary" className="capitalize">{a.type}</Badge>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${getDifficultyColor(a.difficulty)}`}>
                        {a.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1">{a.description || "No description provided."}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {a.duration} mins
                      </span>
                      <span>•</span>
                      <span>{a.totalQuestions} questions</span>
                      <span>•</span>
                      <span>{a.participantsCount} attempts</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end md:self-center">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Cohort Avg</div>
                      <div className="text-lg font-bold text-slate-800">
                        {a.averageScore !== null ? `${a.averageScore}%` : "—"}
                      </div>
                    </div>
                    <Badge variant="secondary" className={getStatusColor(a.status)}>
                      {a.status.toUpperCase()}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expandedId === a.id ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </div>
                </div>

                {expandedId === a.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-lg">
                    <div>
                      <span className="font-medium text-slate-700">Created At:</span>{" "}
                      {new Date(a.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Completed Attempts:</span>{" "}
                      {a.participantsCount}
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Scoring Engine:</span>{" "}
                      Authoritative DB Evaluation
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
