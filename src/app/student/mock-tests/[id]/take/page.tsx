"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  Clock,
  Shield,
  Code,
  Brain,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Send,
  Loader2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { DashboardSkeleton, ErrorState } from "@/components/feedback/states";
import { pythonRunner, TestCaseResult } from "@/lib/assessment/python-runner";

interface TakeMockTestPageProps {
  params: Promise<{ id: string }>;
}

export default function TakeMockTestPage({ params }: TakeMockTestPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const testId = resolvedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mockTestData, setMockTestData] = useState<any>(null);
  const [attemptId, setAttemptId] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(7200);

  // Active level: 1, 2, 3, 4
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3 | 4>(1);

  // Question indices within each level
  const [l1CurrentIdx, setL1CurrentIdx] = useState(0);
  const [l2CurrentIdx, setL2CurrentIdx] = useState(0);
  const [l3CurrentIdx, setL3CurrentIdx] = useState(0);
  const [l4CurrentIdx, setL4CurrentIdx] = useState(0);

  // Answer tracking
  const [l1Answers, setL1Answers] = useState<Record<string, number>>({});
  const [l2Answers, setL2Answers] = useState<Record<string, number>>({});
  const [l3Answers, setL3Answers] = useState<Record<string, number>>({});

  // Level 4 coding tracking: { [problemId]: { code: string, results: TestCaseResult[], passed: number, total: number } }
  const [l4CodeState, setL4CodeState] = useState<
    Record<
      string,
      {
        code: string;
        results: TestCaseResult[];
        passed: number;
        total: number;
        isRunning: boolean;
      }
    >
  >({});

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [scorecard, setScorecard] = useState<any>(null);

  // Load Test Questions from API
  const loadTest = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/student/mock-tests/${testId}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Failed to load mock test (HTTP ${res.status})`);
      }
      const data = (await res.json()) as any;
      setMockTestData(data);
      setAttemptId(data.attempt.id);
      setTimeLeft(data.timeLeftSeconds || 7200);

      // Initialize Level 4 coding state
      const initialL4: any = {};
      const problems = data.levels?.level4?.problems || [];
      problems.forEach((p: any) => {
        initialL4[p.id] = {
          code: p.starterCode?.python || "# Write your solution here\n",
          results: [],
          passed: 0,
          total: p.testCases?.length || 0,
          isRunning: false,
        };
      });
      setL4CodeState(initialL4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load test questions.");
    } finally {
      setIsLoading(false);
    }
  }, [testId, router]);

  useEffect(() => {
    loadTest();
  }, [loadTest]);

  // Final Submit
  const handleFinalSubmit = useCallback(async () => {
    if (isSubmitting || scorecard) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      // Package Level 4 summary
      const l4Summary: Record<string, { passedTests: number; totalTests: number }> = {};
      Object.entries(l4CodeState).forEach(([pId, st]) => {
        l4Summary[pId] = {
          passedTests: st.passed,
          totalTests: st.total,
        };
      });

      const payload = {
        attemptId,
        answers: {
          level1: l1Answers,
          level2: l2Answers,
          level3: l3Answers,
          level4: l4Summary,
        },
      };

      const res = await fetch(`/api/student/mock-tests/${testId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as any;
        throw new Error(errJson.error || "Failed to submit mock test.");
      }

      const result = (await res.json()) as any;
      setScorecard(result);
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, scorecard, l4CodeState, attemptId, l1Answers, l2Answers, l3Answers, testId]);

  // Global Countdown Timer
  useEffect(() => {
    if (isLoading || scorecard || isSubmitting) return;

    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isLoading, scorecard, isSubmitting, handleFinalSubmit]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Run Code in Level 4
  const handleRunCode = async (problemId: string, testCases: any[]) => {
    const current = l4CodeState[problemId];
    if (!current) return;

    setL4CodeState((prev) => ({
      ...prev,
      [problemId]: { ...prev[problemId], isRunning: true },
    }));

    try {
      const execResult = await pythonRunner.runCode({ code: current.code, testCases });
      const passedCount = execResult.results.filter((r: any) => r.passed).length;

      setL4CodeState((prev) => ({
        ...prev,
        [problemId]: {
          ...prev[problemId],
          results: execResult.results,
          passed: passedCount,
          total: testCases.length,
          isRunning: false,
        },
      }));
    } catch (err: any) {
      setL4CodeState((prev) => ({
        ...prev,
        [problemId]: {
          ...prev[problemId],
          isRunning: false,
        },
      }));
      alert(`Execution failed: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error || !mockTestData) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8">
        <ErrorState
          title="Unable to load mock test"
          message={error || "Could not retrieve test questions."}
          onRetry={loadTest}
        />
      </div>
    );
  }

  const levels = mockTestData.levels;
  const l1Questions = levels.level1?.questions || [];
  const l2Questions = levels.level2?.questions || [];
  const l3Questions = levels.level3?.questions || [];
  const l4Problems = levels.level4?.problems || [];

  const l1Count = Object.keys(l1Answers).length;
  const l2Count = Object.keys(l2Answers).length;
  const l3Count = Object.keys(l3Answers).length;
  const l4PassedTotal = Object.values(l4CodeState).filter((s) => s.passed > 0).length;

  // -------------------------------------------------------------
  // RENDER SCORECARD MODAL AFTER SUBMISSION
  // -------------------------------------------------------------
  if (scorecard) {
    const scores = scorecard.levelScores || {};
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <Card className="border-2 border-emerald-200 shadow-xl overflow-hidden">
          <div className="bg-emerald-600 p-8 text-white text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Mock Test Successfully Completed!</h1>
            <p className="text-emerald-100 text-sm mt-1">
              Your 4-level attempt has been evaluated and permanently recorded in PostgreSQL.
            </p>
            <div className="mt-6 inline-block bg-white text-emerald-800 font-extrabold text-4xl px-8 py-3 rounded-2xl shadow-sm">
              {scorecard.overallPercentage}%
            </div>
          </div>

          <CardContent className="p-8 space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Level-by-Level Performance Breakdown:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-xs text-purple-700">Level 1: Aptitude & Reasoning</span>
                  <span className="font-bold text-slate-900">{scores.level1?.percentage}%</span>
                </div>
                <p className="text-xs text-slate-500">Score: {scores.level1?.score} / {scores.level1?.maxScore}</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-xs text-blue-700">Level 2: English Verbal Ability</span>
                  <span className="font-bold text-slate-900">{scores.level2?.percentage}%</span>
                </div>
                <p className="text-xs text-slate-500">Score: {scores.level2?.score} / {scores.level2?.maxScore}</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-xs text-emerald-700">Level 3: Core Course Theory</span>
                  <span className="font-bold text-slate-900">{scores.level3?.percentage}%</span>
                </div>
                <p className="text-xs text-slate-500">Score: {scores.level3?.score} / {scores.level3?.maxScore}</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-xs text-amber-700">Level 4: Live Coding (5 Problems)</span>
                  <span className="font-bold text-slate-900">{scores.level4?.percentage}%</span>
                </div>
                <p className="text-xs text-slate-500">Score: {scores.level4?.score} / {scores.level4?.maxScore}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600 shrink-0" />
              <span>
                Attempt is immutable. Performance history, readiness metric, and skill radar have been updated.
              </span>
            </div>
          </CardContent>

          <CardFooter className="p-8 pt-0 flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/student/mock-tests")}
              className="flex-1"
            >
              Back to Mock Tests
            </Button>
            <Button
              onClick={() => router.push("/student/performance")}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              View in Performance Analytics
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 -m-4 lg:-m-6">
      {/* Top Fixed Test Header */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-[10px]">
              {mockTestData.mockTest.company || "Mock Drive"}
            </Badge>
            <h1 className="font-bold text-base truncate max-w-md">
              {mockTestData.mockTest.name}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            4-Level Integrated Campus Placement Assessment
          </p>
        </div>

        {/* Level Switcher in Top Bar */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveLevel(1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeLevel === 1
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white"
            }`}
          >
            L1: Aptitude ({l1Count}/10)
          </button>
          <button
            onClick={() => setActiveLevel(2)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeLevel === 2
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white"
            }`}
          >
            L2: Verbal ({l2Count}/10)
          </button>
          <button
            onClick={() => setActiveLevel(3)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeLevel === 3
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white"
            }`}
          >
            L3: Theory ({l3Count}/10)
          </button>
          <button
            onClick={() => setActiveLevel(4)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeLevel === 4
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white"
            }`}
          >
            L4: Live Coding ({l4PassedTotal}/5)
          </button>
        </div>

        {/* Timer & Submit */}
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${
              timeLeft < 300
                ? "bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse"
                : "bg-slate-800 text-slate-200 border-slate-700"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <Button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-4 shadow-sm"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
            Submit Test
          </Button>
        </div>
      </header>

      {/* Main Assessment Body */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* ========================================================= */}
        {/* LEVEL 1: APTITUDE & REASONING                             */}
        {/* ========================================================= */}
        {activeLevel === 1 && l1Questions.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                  Level 1 — Aptitude & Logical Reasoning
                </span>
                <h2 className="text-sm font-semibold text-slate-700 mt-0.5">
                  Question {l1CurrentIdx + 1} of {l1Questions.length} (Marks: {l1Questions[l1CurrentIdx].marks || 2})
                </h2>
              </div>
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                {l1Count} / {l1Questions.length} Answered
              </Badge>
            </div>

            {/* Question Card */}
            <Card>
              <CardContent className="pt-6 space-y-6">
                <p className="text-base font-medium text-slate-900 leading-relaxed">
                  {l1Questions[l1CurrentIdx].question}
                </p>

                <div className="space-y-3">
                  {l1Questions[l1CurrentIdx].options.map((opt: string, optIdx: number) => {
                    const isSelected = l1Answers[l1Questions[l1CurrentIdx].id] === optIdx;
                    return (
                      <div
                        key={optIdx}
                        onClick={() =>
                          setL1Answers({
                            ...l1Answers,
                            [l1Questions[l1CurrentIdx].id]: optIdx,
                          })
                        }
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? "border-purple-600 bg-purple-50/60 shadow-sm text-purple-950 font-medium"
                            : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold ${
                            isSelected
                              ? "border-purple-600 bg-purple-600 text-white"
                              : "border-slate-300 text-slate-500"
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className="text-sm">{opt}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
                <Button
                  variant="outline"
                  disabled={l1CurrentIdx === 0}
                  onClick={() => setL1CurrentIdx((prev) => Math.max(0, prev - 1))}
                  className="flex items-center gap-1 text-xs"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                {l1CurrentIdx < l1Questions.length - 1 ? (
                  <Button
                    onClick={() => setL1CurrentIdx((prev) => prev + 1)}
                    className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1 text-xs"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setActiveLevel(2)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 text-xs"
                  >
                    Proceed to Level 2 (Verbal) <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Question Navigator Grid */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-slate-500 mr-2">Jump to:</span>
              {l1Questions.map((q: any, idx: number) => {
                const isAnswered = l1Answers[q.id] !== undefined;
                const isCurrent = idx === l1CurrentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setL1CurrentIdx(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      isCurrent
                        ? "ring-2 ring-purple-600 ring-offset-2 bg-purple-600 text-white"
                        : isAnswered
                        ? "bg-purple-100 text-purple-800"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* LEVEL 2: VERBAL ABILITY                                   */}
        {/* ========================================================= */}
        {activeLevel === 2 && l2Questions.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Level 2 — English Verbal Ability
                </span>
                <h2 className="text-sm font-semibold text-slate-700 mt-0.5">
                  Question {l2CurrentIdx + 1} of {l2Questions.length} (Marks: {l2Questions[l2CurrentIdx].marks || 2})
                </h2>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {l2Count} / {l2Questions.length} Answered
              </Badge>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-6">
                <p className="text-base font-medium text-slate-900 leading-relaxed">
                  {l2Questions[l2CurrentIdx].question}
                </p>

                <div className="space-y-3">
                  {l2Questions[l2CurrentIdx].options.map((opt: string, optIdx: number) => {
                    const isSelected = l2Answers[l2Questions[l2CurrentIdx].id] === optIdx;
                    return (
                      <div
                        key={optIdx}
                        onClick={() =>
                          setL2Answers({
                            ...l2Answers,
                            [l2Questions[l2CurrentIdx].id]: optIdx,
                          })
                        }
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/60 shadow-sm text-blue-950 font-medium"
                            : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold ${
                            isSelected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 text-slate-500"
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className="text-sm">{opt}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
                <Button
                  variant="outline"
                  disabled={l2CurrentIdx === 0}
                  onClick={() => setL2CurrentIdx((prev) => Math.max(0, prev - 1))}
                  className="flex items-center gap-1 text-xs"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                {l2CurrentIdx < l2Questions.length - 1 ? (
                  <Button
                    onClick={() => setL2CurrentIdx((prev) => prev + 1)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 text-xs"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setActiveLevel(3)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 text-xs"
                  >
                    Proceed to Level 3 (Course Theory) <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-slate-500 mr-2">Jump to:</span>
              {l2Questions.map((q: any, idx: number) => {
                const isAnswered = l2Answers[q.id] !== undefined;
                const isCurrent = idx === l2CurrentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setL2CurrentIdx(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      isCurrent
                        ? "ring-2 ring-blue-600 ring-offset-2 bg-blue-600 text-white"
                        : isAnswered
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* LEVEL 3: COURSE THEORY EXAM                               */}
        {/* ========================================================= */}
        {activeLevel === 3 && l3Questions.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Level 3 — Core Course Theory Examination
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="text-sm font-semibold text-slate-700">
                    Question {l3CurrentIdx + 1} of {l3Questions.length}
                  </h2>
                  <Badge variant="outline" className="text-[10px]">
                    {l3Questions[l3CurrentIdx].subject}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] text-slate-500">
                    {l3Questions[l3CurrentIdx].topic}
                  </Badge>
                </div>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                {l3Count} / {l3Questions.length} Answered
              </Badge>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-6">
                <p className="text-base font-medium text-slate-900 leading-relaxed">
                  {l3Questions[l3CurrentIdx].question}
                </p>

                <div className="space-y-3">
                  {l3Questions[l3CurrentIdx].options.map((opt: string, optIdx: number) => {
                    const isSelected = l3Answers[l3Questions[l3CurrentIdx].id] === optIdx;
                    return (
                      <div
                        key={optIdx}
                        onClick={() =>
                          setL3Answers({
                            ...l3Answers,
                            [l3Questions[l3CurrentIdx].id]: optIdx,
                          })
                        }
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/60 shadow-sm text-emerald-950 font-medium"
                            : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-slate-300 text-slate-500"
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className="text-sm">{opt}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
                <Button
                  variant="outline"
                  disabled={l3CurrentIdx === 0}
                  onClick={() => setL3CurrentIdx((prev) => Math.max(0, prev - 1))}
                  className="flex items-center gap-1 text-xs"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                {l3CurrentIdx < l3Questions.length - 1 ? (
                  <Button
                    onClick={() => setL3CurrentIdx((prev) => prev + 1)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 text-xs"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setActiveLevel(4)}
                    className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 text-xs"
                  >
                    Proceed to Level 4 (Live Coding) <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-slate-500 mr-2">Jump to:</span>
              {l3Questions.map((q: any, idx: number) => {
                const isAnswered = l3Answers[q.id] !== undefined;
                const isCurrent = idx === l3CurrentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setL3CurrentIdx(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      isCurrent
                        ? "ring-2 ring-emerald-600 ring-offset-2 bg-emerald-600 text-white"
                        : isAnswered
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* LEVEL 4: LIVE CODING (5 PROGRESSIVE PROBLEMS)             */}
        {/* ========================================================= */}
        {activeLevel === 4 && l4Problems.length > 0 && (
          <div className="space-y-6">
            {/* 5 Problem Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {l4Problems.map((prob: any, pIdx: number) => {
                  const pState = l4CodeState[prob.id];
                  const hasPassed = pState && pState.passed > 0;
                  const isCurrent = pIdx === l4CurrentIdx;

                  return (
                    <button
                      key={prob.id}
                      onClick={() => setL4CurrentIdx(pIdx)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isCurrent
                          ? "bg-amber-600 text-white shadow-sm"
                          : hasPassed
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span>Problem {pIdx + 1}: {prob.tier}</span>
                      {hasPassed && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>

              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300">
                {l4PassedTotal} of 5 Solved
              </Badge>
            </div>

            {/* Split Screen Problem Layout */}
            {(() => {
              const curProb = l4Problems[l4CurrentIdx];
              const curState = l4CodeState[curProb.id];

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  {/* Left Column: Problem Statement */}
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="secondary"
                          className={
                            curProb.difficulty === "hard"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : curProb.difficulty === "medium"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }
                        >
                          Tier {curProb.order}: {curProb.tier}
                        </Badge>
                        <span className="text-xs text-slate-400 font-mono">
                          Max: 20 Marks
                        </span>
                      </div>
                      <CardTitle className="text-xl mt-2">{curProb.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-slate-700">
                      <p className="leading-relaxed">{curProb.description}</p>

                      {curProb.examples && curProb.examples.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Examples:
                          </span>
                          {curProb.examples.map((ex: any, exIdx: number) => (
                            <div
                              key={exIdx}
                              className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs space-y-1"
                            >
                              <p><strong className="text-slate-600">Input:</strong> {ex.input}</p>
                              <p><strong className="text-slate-600">Output:</strong> {ex.output}</p>
                              {ex.explanation && (
                                <p className="text-slate-500 font-sans"><strong className="text-slate-600">Explanation:</strong> {ex.explanation}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {curProb.constraints && curProb.constraints.length > 0 && (
                        <div className="pt-2">
                          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-1">
                            Constraints:
                          </span>
                          <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                            {curProb.constraints.map((c: string, cIdx: number) => (
                              <li key={cIdx}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Right Column: Code Editor & Execution Panel */}
                  <div className="space-y-4">
                    <Card className="overflow-hidden border-slate-800 bg-slate-950 text-white">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4 text-blue-400" />
                          <span className="font-semibold text-slate-200">Python 3 (Pyodide Isolated Sandbox)</span>
                        </div>
                        <Button
                          size="sm"
                          disabled={curState?.isRunning}
                          onClick={() => handleRunCode(curProb.id, curProb.testCases)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-7 px-3 flex items-center gap-1.5"
                        >
                          {curState?.isRunning ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                          Run Code & Test Cases
                        </Button>
                      </div>

                      <div className="p-3">
                        <textarea
                          value={curState?.code || ""}
                          onChange={(e) =>
                            setL4CodeState((prev) => ({
                              ...prev,
                              [curProb.id]: {
                                ...prev[curProb.id],
                                code: e.target.value,
                              },
                            }))
                          }
                          rows={14}
                          className="w-full font-mono text-xs bg-slate-950 text-slate-200 p-2 focus:outline-none resize-none leading-relaxed"
                          spellCheck={false}
                        />
                      </div>
                    </Card>

                    {/* Test Case Execution Output */}
                    <Card>
                      <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Test Case Results
                          </span>
                          {curState?.results && curState.results.length > 0 && (
                            <Badge
                              variant="secondary"
                              className={
                                curState.passed === curState.total
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-rose-50 text-rose-800 border-rose-200"
                              }
                            >
                              {curState.passed} / {curState.total} Passed
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-2.5">
                        {curState?.results && curState.results.length > 0 ? (
                          curState.results.map((tc, tcIdx) => (
                            <div
                              key={tcIdx}
                              className={`p-3 rounded-lg border text-xs font-mono space-y-1 ${
                                tc.passed
                                  ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                                  : "bg-rose-50/50 border-rose-200 text-rose-950"
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span>Test Case #{tcIdx + 1} {tc.hidden && "(Hidden)"}</span>
                                <span>{tc.passed ? "✅ Passed" : "❌ Failed"} ({tc.executionTimeMs}ms)</span>
                              </div>
                              {!tc.hidden && (
                                <>
                                  <p className="text-slate-600">Input: {tc.input}</p>
                                  <p className="text-slate-600">Expected: {tc.expectedOutput}</p>
                                  <p className="text-slate-600">Output: {tc.actualOutput}</p>
                                </>
                              )}
                              {tc.error && (
                                <p className="text-rose-700 font-sans mt-1">Error: {tc.error}</p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic">
                            Click &quot;Run Code & Test Cases&quot; to execute your solution in the browser WASM sandbox.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-amber-100 text-amber-700">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Confirm Mock Test Submission
              </h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to submit your test? Once submitted, your scores across all 4 levels will be permanently evaluated and recorded.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span>Level 1 (Aptitude):</span>
                <span className="font-bold">{l1Count}/10 Answered</span>
              </div>
              <div className="flex justify-between">
                <span>Level 2 (Verbal):</span>
                <span className="font-bold">{l2Count}/10 Answered</span>
              </div>
              <div className="flex justify-between">
                <span>Level 3 (Course Theory):</span>
                <span className="font-bold">{l3Count}/10 Answered</span>
              </div>
              <div className="flex justify-between">
                <span>Level 4 (Live Coding):</span>
                <span className="font-bold">{l4PassedTotal}/5 Passed</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1"
              >
                Continue Test
              </Button>
              <Button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Yes, Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
