"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  Loader2,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorState } from "@/components/feedback/states";

interface QuestionItem {
  id: string;
  questionNumber: number;
  category: string;
  question: string;
  options: string[];
  marks: number;
}

interface AttemptDetails {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  type: string;
  duration: number;
  startedAt: string;
  status: string;
}

interface SubmissionResult {
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number;
}

function AptitudeAssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentIdFromQuery = searchParams.get("assessmentId");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<AttemptDetails | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null);

  // Initialize attempt and load questions
  const initializeTest = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Resolve Assessment ID
      let assessmentId = assessmentIdFromQuery;
      if (!assessmentId) {
        // Find published aptitude assessment
        const assessRes = await fetch("/api/student/assessments");
        if (!assessRes.ok) throw new Error("Failed to load assessments list");
        const assessData = (await assessRes.json()) as {
          assessments: Array<{ id: string; type: string }>;
        };
        const apt = assessData.assessments.find((a) => a.type === "aptitude");
        if (!apt) {
          throw new Error("No published aptitude assessments found.");
        }
        assessmentId = apt.id;
      }

      // 2. Start or resume attempt
      const startRes = await fetch(
        `/api/student/assessments/${assessmentId}/start`,
        { method: "POST" }
      );
      if (!startRes.ok) {
        if (startRes.status === 401) {
          router.push("/login");
          return;
        }
        const errJson = (await startRes.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errJson.error || "Failed to start assessment attempt.");
      }
      const startData = (await startRes.json()) as { attempt: AttemptDetails };
      const currentAttempt = startData.attempt;
      setAttempt(currentAttempt);

      // 3. Load questions & existing saved answers
      const qRes = await fetch(
        `/api/student/attempts/${currentAttempt.id}/questions`
      );
      if (!qRes.ok) {
        if (qRes.status === 401) {
          router.push("/login");
          return;
        }
        const errJson = (await qRes.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errJson.error || "Failed to load questions.");
      }

      const qData = (await qRes.json()) as {
        questions: QuestionItem[];
        savedAnswers: Record<string, number>;
      };

      setQuestions(qData.questions || []);
      setAnswers(qData.savedAnswers || {});

      // Calculate remaining time
      const startTime = new Date(currentAttempt.startedAt).getTime();
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const totalSeconds = currentAttempt.duration * 60;
      const remaining = Math.max(0, totalSeconds - elapsedSeconds);
      setTimeLeft(remaining);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to initialize assessment"
      );
    } finally {
      setIsLoading(false);
    }
  }, [assessmentIdFromQuery, router]);

  useEffect(() => {
    initializeTest();
  }, [initializeTest]);

  const handleAutoSubmit = useCallback(async () => {
    if (!attempt || isSubmitting || submissionResult) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/student/attempts/${attempt.id}/submit`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Submission failed");
      const data = (await res.json()) as {
        attempt: SubmissionResult;
      };
      setSubmissionResult(data.attempt);
    } catch (submitErr) {
      console.error("Auto-submit error:", submitErr);
    } finally {
      setIsSubmitting(false);
    }
  }, [attempt, isSubmitting, submissionResult]);

  // Countdown timer
  useEffect(() => {
    if (isLoading || isSubmitting || submissionResult) return;
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit when time expires
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoading, isSubmitting, submissionResult, timeLeft, handleAutoSubmit]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = async (optIdx: number) => {
    if (!attempt || !questions[currentIdx] || isSubmitting || timeLeft <= 0) return;
    const currentQ = questions[currentIdx];

    // 1. Optimistic UI update
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optIdx }));

    // 2. Incremental autosave to backend
    try {
      await fetch(`/api/student/attempts/${attempt.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQ.id,
          selectedOption: optIdx,
        }),
      });
    } catch (saveErr) {
      console.warn("Autosave background sync failed:", saveErr);
    }
  };

  const toggleMark = () => {
    const currentQ = questions[currentIdx];
    if (!currentQ) return;
    setMarked((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  const handleSubmit = async () => {
    if (!attempt || isSubmitting) return;
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = questions.length - answeredCount;

    const confirmMsg =
      unansweredCount > 0
        ? `You have ${unansweredCount} unanswered questions. Are you sure you want to finalize and submit your assessment?`
        : "Are you sure you want to submit your assessment?";

    if (!confirm(confirmMsg)) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/student/attempts/${attempt.id}/submit`, {
        method: "POST",
      });
      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errJson.error || "Failed to submit assessment.");
      }
      const data = (await res.json()) as {
        attempt: SubmissionResult;
      };
      setSubmissionResult(data.attempt);
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : "Failed to submit assessment."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-600">
          Loading secure assessment environment...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <ErrorState
          title="Unable to load assessment"
          message={error}
          onRetry={initializeTest}
        />
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            onClick={() => router.push("/student/assessments")}
          >
            Back to Assessments
          </Button>
        </div>
      </div>
    );
  }

  // Submission Results Modal / View
  if (submissionResult) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-lg w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Trophy className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Assessment Submitted Successfully!
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Your test has been graded and recorded in your permanent performance record.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {submissionResult.score}/{submissionResult.maxScore}
              </div>
              <div className="text-xs text-slate-500 mt-1">Raw Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">
                {submissionResult.percentage}%
              </div>
              <div className="text-xs text-slate-500 mt-1">Percentage</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {formatTime(submissionResult.timeSpent)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Time Spent</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/student/dashboard")}
            >
              Go to Dashboard
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => router.push("/student/assessments")}
            >
              Back to Assessments
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const progress =
    questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

  if (!currentQ) {
    return (
      <div className="p-6 text-center text-slate-500">
        No questions available for this assessment.
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col -m-4 lg:-m-6 bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            {attempt?.assessmentTitle || "Aptitude Assessment"}
          </h1>
          <p className="text-xs text-slate-500">
            Real Quantitative & Logical Examination • Attempt ID:{" "}
            <span className="font-mono text-[11px] text-slate-700">
              {attempt?.id.slice(0, 8)}...
            </span>
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-lg border font-mono font-semibold text-sm",
            timeLeft < 300
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-slate-100 border-slate-200 text-slate-900"
          )}
        >
          <Clock className="h-4 w-4" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white px-6 py-2 border-b border-slate-200 shrink-0">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="font-medium text-slate-700">
            Question {currentIdx + 1} of {questions.length}
          </span>
          <span className="text-slate-500">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col">
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {currentQ.category}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMark}
                className={cn(
                  marked[currentQ.id]
                    ? "text-amber-600 bg-amber-50"
                    : "text-slate-500"
                )}
              >
                <Flag className="h-4 w-4 mr-1.5" />
                {marked[currentQ.id] ? "Marked for Review" : "Mark for Review"}
              </Button>
            </div>

            <div className="prose prose-slate max-w-none mb-8">
              <p className="text-lg md:text-xl text-slate-900 leading-relaxed font-medium">
                {currentIdx + 1}. {currentQ.question}
              </p>
            </div>

            <div className="space-y-3 mt-auto">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = answers[currentQ.id] === optIdx;
                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={timeLeft <= 0 || isSubmitting}
                    onClick={() => handleSelectOption(optIdx)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4",
                      isSelected
                        ? "border-blue-600 bg-blue-50/50"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50",
                      (timeLeft <= 0 || isSubmitting) && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0",
                        isSelected ? "border-blue-600" : "border-slate-300"
                      )}
                    >
                      {isSelected && (
                        <div className="h-3 w-3 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-base",
                        isSelected
                          ? "text-slate-900 font-medium"
                          : "text-slate-700"
                      )}
                    >
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Navigator */}
        <div className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 hidden lg:flex">
          <div className="p-4 border-b border-slate-200 font-semibold text-slate-900 text-sm">
            Question Navigator
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isMarked = !!marked[q.id];
                const isCurrent = idx === currentIdx;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={cn(
                      "h-10 w-10 rounded-lg text-sm font-medium flex items-center justify-center border transition-all",
                      isCurrent ? "ring-2 ring-blue-600 ring-offset-1" : "",
                      isMarked
                        ? "bg-amber-100 border-amber-300 text-amber-800"
                        : isAnswered
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-sm" />
                <span className="text-slate-600">
                  Answered ({Object.keys(answers).length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-100 border border-amber-300 rounded-sm" />
                <span className="text-slate-600">
                  Marked ({Object.keys(marked).length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white border border-slate-200 rounded-sm" />
                <span className="text-slate-600">
                  Unanswered ({questions.length - Object.keys(answers).length})
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-200">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Test"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <Button
          variant="outline"
          onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> Previous
        </Button>
        <div className="lg:hidden font-medium text-slate-700 text-sm">
          {currentIdx + 1} / {questions.length}
        </div>
        {currentIdx === questions.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...
              </>
            ) : (
              "Submit Test"
            )}
          </Button>
        ) : (
          <Button
            onClick={() =>
              setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))
            }
          >
            Next <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AptitudeAssessmentPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[80vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <AptitudeAssessmentContent />
    </Suspense>
  );
}
