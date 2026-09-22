"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Code2,
  HelpCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface StudentAttemptDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: string | null;
  studentId: string | null;
}

interface AttemptDetailData {
  student: {
    id: string;
    name: string;
    email: string;
    rollNumber: string;
    department: string;
    year: string;
  };
  assessment: {
    id: string;
    title: string;
    type: string;
    maxMarks: number;
  };
  attempt: {
    id: string;
    score: number;
    percentage: number;
    status: "Passed" | "Failed" | "Needs Attention";
    startedAt: string;
    submittedAt: string | null;
    timeTaken: string;
    correctCount: number;
    wrongCount: number;
    totalAnswered: number;
    answers: Array<{
      type: string;
      questionNumber?: number;
      question?: string;
      options?: string[];
      selectedOption?: number | null;
      correctAnswer?: number;
      isCorrect?: boolean | null;
      scoreAwarded?: number | null;
      maxMarks?: number;
      category?: string;
      explanation?: string | null;
      problemTitle?: string;
      difficulty?: string;
      codeSubmission?: string | null;
    }>;
  } | null;
  message?: string;
}

export function StudentAttemptDetailModal({
  open,
  onOpenChange,
  assessmentId,
  studentId,
}: StudentAttemptDetailModalProps) {
  const [data, setData] = useState<AttemptDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !assessmentId || !studentId) {
      setData(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/faculty/assessments/${assessmentId}/results/${studentId}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(errData.error || "Failed to load student attempt details.");
        }
        return (await res.json()) as AttemptDetailData;
      })
      .then((json: AttemptDetailData) => {
        if (isMounted) {
          setData(json);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error loading attempt");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open, assessmentId, studentId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center justify-between pr-6">
            <span>Student Submission Review</span>
            {data?.attempt && (
              <Badge
                variant={
                  data.attempt.status === "Passed"
                    ? "success"
                    : data.attempt.status === "Needs Attention"
                    ? "danger"
                    : "warning"
                }
                className="text-xs px-2.5 py-1"
              >
                {data.attempt.status} ({data.attempt.percentage}%)
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {data ? `${data.student.name} • Roll: ${data.student.rollNumber}` : "Attempt Details"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-500">Loading student submission...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : !data?.attempt ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
            <User className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No submission recorded</p>
            <p className="text-xs text-slate-500 mt-1">This student has not submitted this assessment yet.</p>
          </div>
        ) : (
          <div className="space-y-6 text-sm">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-500 font-medium">Final Score</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {data.attempt.score} <span className="text-xs text-slate-400 font-normal">/ {data.assessment.maxMarks}</span>
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-500 font-medium">Time Taken</p>
                <p className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {data.attempt.timeTaken}
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-500 font-medium">Correct Answers</p>
                <p className="text-xl font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  {data.attempt.correctCount}
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-500 font-medium">Submitted At</p>
                <p className="text-xs font-semibold text-slate-800 mt-2 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {data.attempt.submittedAt ? new Date(data.attempt.submittedAt).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>

            {/* Questions / Answers Breakdown */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                Itemized Answers ({data.attempt.answers.length})
              </h3>

              {data.attempt.answers.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-lg border border-slate-100">
                  Itemized question answers were evaluated directly via autograding.
                </p>
              ) : (
                data.attempt.answers.map((ans, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-colors ${
                      ans.isCorrect === true
                        ? "bg-emerald-50/40 border-emerald-200"
                        : ans.isCorrect === false
                        ? "bg-rose-50/40 border-rose-200"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    {ans.type === "coding" ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Code2 className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-slate-900">
                              Problem: {ans.problemTitle || `Problem #${idx + 1}`}
                            </span>
                            {ans.difficulty && (
                              <Badge variant="secondary" className="text-[10px]">
                                {ans.difficulty}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs font-semibold">
                            Awarded: {ans.scoreAwarded ?? 0} pts
                          </span>
                        </div>
                        {ans.codeSubmission && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-slate-500 mb-1">Submitted Solution:</p>
                            <pre className="p-3 rounded-lg bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-48">
                              {ans.codeSubmission}
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <HelpCircle className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                            <p className="font-medium text-slate-900">
                              Q{ans.questionNumber || idx + 1}: {ans.question}
                            </p>
                          </div>
                          <div className="shrink-0">
                            {ans.isCorrect ? (
                              <Badge variant="success" className="text-[10px]">
                                Correct (+{ans.scoreAwarded || 1})
                              </Badge>
                            ) : (
                              <Badge variant="danger" className="text-[10px]">
                                Incorrect (0)
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Options */}
                        {ans.options && ans.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            {ans.options.map((opt, optIdx) => {
                              const isStudentSelected = ans.selectedOption === optIdx;
                              const isCorrectAnswer = ans.correctAnswer === optIdx;

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2.5 rounded-lg text-xs flex items-center justify-between border ${
                                    isCorrectAnswer
                                      ? "bg-emerald-100/70 border-emerald-300 font-medium text-emerald-900"
                                      : isStudentSelected
                                      ? "bg-rose-100/70 border-rose-300 text-rose-900 font-medium"
                                      : "bg-white border-slate-200 text-slate-600"
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {isStudentSelected && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-white/80 rounded">
                                      Student Selected
                                    </span>
                                  )}
                                  {isCorrectAnswer && !isStudentSelected && (
                                    <span className="text-[10px] font-bold text-emerald-700">
                                      Correct
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {ans.explanation && (
                          <p className="text-xs text-slate-500 mt-2 bg-white/80 p-2.5 rounded border border-slate-100">
                            <strong className="text-slate-700">Explanation:</strong> {ans.explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
