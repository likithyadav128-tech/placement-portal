"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Play,
  Check,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  Trophy,
  AlertCircle,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorState } from "@/components/feedback/states";
import {
  pythonRunner,
  TestCaseResult,
} from "@/lib/assessment/python-runner";

interface TestCase {
  input: string;
  expectedOutput?: string;
  hidden?: boolean;
}

interface CodingProblemItem {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string[];
  starterCode?: Record<string, string>;
  testCases: TestCase[];
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

interface SubmitResult {
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number;
}

function CodingAssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentIdFromQuery =
    searchParams.get("assessmentId") || searchParams.get("id");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<AttemptDetails | null>(null);
  const [problems, setProblems] = useState<CodingProblemItem[]>([]);
  const [selectedProblemIdx, setSelectedProblemIdx] = useState(0);

  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [language, setLanguage] = useState("python");
  const [selectedCase, setSelectedCase] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState("testcases");

  // Code state per problem
  const [problemCodes, setProblemCodes] = useState<Record<string, string>>({});
  const [autosaveState, setAutosaveState] = useState<"saved" | "saving" | "error">("saved");
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Test execution state per problem
  const [testResults, setTestResults] = useState<Record<string, TestCaseResult[]>>({});
  const [executionError, setExecutionError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  // Preload Pyodide Web Worker in background
  useEffect(() => {
    pythonRunner.preload().catch((err) => {
      console.warn("Pyodide background preload:", err);
    });
    return () => {
      // Don't terminate on unmount if hot reload, but clean up timers
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  // Initialize assessment
  const initializeTest = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let assessmentId = assessmentIdFromQuery;
      if (!assessmentId) {
        const assessRes = await fetch("/api/student/assessments");
        if (!assessRes.ok) throw new Error("Failed to load assessments list");
        const assessData = (await assessRes.json()) as {
          assessments: Array<{ id: string; type: string }>;
        };
        const codingAssess = assessData.assessments.find(
          (a) => a.type === "coding"
        );
        if (!codingAssess) {
          throw new Error("No published coding assessments found.");
        }
        assessmentId = codingAssess.id;
      }

      // Start or resume attempt
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
        throw new Error(errJson.error || "Failed to start assessment.");
      }
      const startData = (await startRes.json()) as { attempt: AttemptDetails };
      const currentAttempt = startData.attempt;
      if (currentAttempt.type?.toLowerCase() === "aptitude") {
        router.replace(
          `/student/assessments/aptitude?assessmentId=${currentAttempt.assessmentId}`
        );
        return;
      }
      setAttempt(currentAttempt);

      // Load problems & saved code
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
        throw new Error(errJson.error || "Failed to load coding problems.");
      }

      const qData = (await qRes.json()) as {
        problems: CodingProblemItem[];
        savedCode: Record<string, string>;
      };

      const loadedProblems = qData.problems || [];
      setProblems(loadedProblems);

      // Populate codes dictionary
      const initialCodes: Record<string, string> = {};
      for (const prob of loadedProblems) {
        initialCodes[prob.id] =
          qData.savedCode?.[prob.id] || prob.starterCode?.python || "";
      }
      setProblemCodes(initialCodes);

      // Calculate remaining time
      const startTime = new Date(currentAttempt.startedAt).getTime();
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const totalSeconds = currentAttempt.duration * 60;
      const remaining = Math.max(0, totalSeconds - elapsedSeconds);
      setTimeLeft(remaining);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to initialize coding test"
      );
    } finally {
      setIsLoading(false);
    }
  }, [assessmentIdFromQuery, router]);

  const currentProblem = problems[selectedProblemIdx];
  const currentCode = currentProblem ? problemCodes[currentProblem.id] ?? "" : "";

  // Autosave code to backend
  const triggerAutosave = useCallback(
    (problemId: string, codeToSave: string) => {
      if (!attempt || isSubmitting || submitResult || timeLeft <= 0) return;

      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      setAutosaveState("saving");
      autosaveTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/student/attempts/${attempt.id}/answer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              codingProblemId: problemId,
              codeSubmission: codeToSave,
            }),
          });
          if (res.ok) {
            setAutosaveState("saved");
          } else {
            setAutosaveState("error");
          }
        } catch {
          setAutosaveState("error");
        }
      }, 800);
    },
    [attempt, isSubmitting, submitResult, timeLeft]
  );

  const handleCodeChange = (newCode: string) => {
    if (!currentProblem) return;
    setProblemCodes((prev) => ({ ...prev, [currentProblem.id]: newCode }));
    triggerAutosave(currentProblem.id, newCode);
  };

  // Submit assessment
  const executeSubmission = useCallback(async () => {
    if (!attempt || isSubmitting || submitResult) return;

    try {
      setIsSubmitting(true);

      // Run all test cases for all problems using Pyodide Web Worker
      const allTestResults: Record<
        string,
        Array<{ input: string; actualOutput: string }>
      > = {};

      for (const prob of problems) {
        const codeToRun = problemCodes[prob.id] || prob.starterCode?.python || "";
        const isLinkedList = prob.title.toLowerCase().includes("linked list");

        try {
          const runRes = await pythonRunner.runCode({
            code: codeToRun,
            testCases: prob.testCases,
            problemTitle: prob.title,
            isLinkedList,
            timeoutMs: 5000,
          });

          allTestResults[prob.id] = runRes.results.map((r) => ({
            input: r.input,
            actualOutput: r.actualOutput,
          }));
        } catch (runErr) {
          console.warn(`Problem ${prob.id} execution during submission failed:`, runErr);
          // Still report empty actual outputs for this problem
          allTestResults[prob.id] = prob.testCases.map((tc) => ({
            input: tc.input,
            actualOutput: "",
          }));
        }
      }

      // Submit results to server for authoritative scoring
      const res = await fetch(`/api/student/attempts/${attempt.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testResults: allTestResults }),
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errJson.error || "Failed to submit assessment.");
      }

      const resData = (await res.json()) as {
        attempt: {
          score: number;
          maxScore: number;
          percentage: number;
          timeSpent: number;
        };
      };

      setSubmitResult({
        score: resData.attempt.score ?? 0,
        maxScore: resData.attempt.maxScore ?? 100,
        percentage: resData.attempt.percentage ?? 0,
        timeSpent: resData.attempt.timeSpent ?? 0,
      });
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : "Failed to submit assessment."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [attempt, isSubmitting, submitResult, problems, problemCodes]);

  const handleSubmitClick = () => {
    if (confirm("Are you sure you want to submit your coding assessment? All solution code will be evaluated against test suites.")) {
      executeSubmission();
    }
  };

  useEffect(() => {
    initializeTest();
  }, [initializeTest]);

  // Assessment countdown timer
  useEffect(() => {
    if (isLoading || isSubmitting || submitResult) return;
    if (timeLeft <= 0) {
      executeSubmission();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          executeSubmission();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoading, isSubmitting, submitResult, timeLeft, executeSubmission]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Run code for current problem
  const handleRun = async () => {
    if (!currentProblem || isRunning) return;
    setIsRunning(true);
    setExecutionError(null);

    const visibleTestCases = currentProblem.testCases.filter((tc) => !tc.hidden);
    const isLinkedList = currentProblem.title.toLowerCase().includes("linked list");

    try {
      const runRes = await pythonRunner.runCode({
        code: currentCode,
        testCases: visibleTestCases,
        problemTitle: currentProblem.title,
        isLinkedList,
        timeoutMs: 5000,
      });

      setTestResults((prev) => ({
        ...prev,
        [currentProblem.id]: runRes.results,
      }));
      setActiveConsoleTab("output");
    } catch (err: unknown) {
      setExecutionError(
        err instanceof Error ? err.message : "Python execution error"
      );
      setActiveConsoleTab("output");
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    if (!currentProblem) return;
    const starter = currentProblem.starterCode?.[language] || "";
    setProblemCodes((prev) => ({ ...prev, [currentProblem.id]: starter }));
    triggerAutosave(currentProblem.id, starter);
  };

  const handleProblemChange = (idx: number) => {
    setSelectedProblemIdx(idx);
    setSelectedCase(0);
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4 bg-[#1e1e1e] text-slate-300 -m-4 lg:-m-6">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium text-slate-400">
          Loading secure coding environment...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <ErrorState
          title="Unable to load coding assessment"
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

  // Submission Celebration Screen
  if (submitResult) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-lg w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Trophy className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Assessment Completed!
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Your coding assessment has been verified and scored against test cases.
            </p>
          </div>

          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-3 text-sm text-slate-700">
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Assessment:</span>
              <span className="font-semibold text-slate-900">{attempt?.assessmentTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Problems:</span>
              <span>{problems.length} Problems</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Time Spent:</span>
              <span>{Math.floor(submitResult.timeSpent / 60)} min {submitResult.timeSpent % 60} sec</span>
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
              <span className="font-bold text-slate-800">Final Score:</span>
              <span className="text-xl font-extrabold text-blue-600">
                {submitResult.percentage}% ({submitResult.score}/{submitResult.maxScore})
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/student/performance")}
            >
              View Performance
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => router.push("/student/dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProblem) {
    return (
      <div className="p-6 text-center text-slate-500">
        No coding problems found in this assessment.
      </div>
    );
  }

  const currentResults = testResults[currentProblem.id] || [];
  const visibleCases = currentProblem.testCases.filter((tc) => !tc.hidden);

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col -m-4 lg:-m-6 bg-[#1e1e1e] text-slate-300">
      {/* Top bar */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-[#252526] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {problems.length > 1 && (
            <div className="flex gap-1 mr-2">
              {problems.map((p, i) => {
                const res = testResults[p.id];
                const hasPassedAll =
                  res && res.length > 0 && res.every((r) => r.passed);
                return (
                  <button
                    key={p.id}
                    onClick={() => handleProblemChange(i)}
                    className={`px-2.5 py-1 text-xs rounded font-medium transition-colors flex items-center gap-1 ${
                      selectedProblemIdx === i
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    <span>Q{i + 1}</span>
                    {hasPassedAll && (
                      <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <div className="font-semibold text-slate-100 truncate">
            {currentProblem.title}
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono">
            {autosaveState === "saving" ? (
              <span className="text-amber-400 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving...
              </span>
            ) : autosaveState === "saved" ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Autosaved
              </span>
            ) : (
              <span className="text-rose-400">Save failed</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="font-mono text-sm">{formatTime(timeLeft)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 text-xs"
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                  Run Code
                </>
              )}
            </Button>

            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
              onClick={handleSubmitClick}
              disabled={isSubmitting || isRunning}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" /> Submit Assessment
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left pane - Problem Description */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-slate-800 flex flex-col bg-[#1e1e1e] overflow-y-auto p-4 md:p-6">
          <div className="max-w-none">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                  currentProblem.difficulty === "easy"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : currentProblem.difficulty === "medium"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-rose-500/20 text-rose-400"
                }`}
              >
                {currentProblem.difficulty}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-100 mb-3">
              {currentProblem.title}
            </h1>
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">
              {currentProblem.description}
            </p>

            <div className="mt-6 space-y-5">
              {currentProblem.examples?.map((ex, i) => (
                <div key={i}>
                  <h3 className="text-slate-200 font-semibold text-sm mb-2">
                    Example {i + 1}:
                  </h3>
                  <div className="bg-[#2d2d2d] rounded-md p-3 font-mono text-xs space-y-1.5">
                    <div>
                      <span className="text-slate-500">Input:</span>{" "}
                      <span className="text-slate-200">{ex.input}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Output:</span>{" "}
                      <span className="text-emerald-400">{ex.output}</span>
                    </div>
                    {ex.explanation && (
                      <div className="text-slate-400 pt-1 text-[11px] border-t border-slate-700/50">
                        Explanation: {ex.explanation}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {currentProblem.constraints?.length > 0 && (
                <div>
                  <h3 className="text-slate-200 font-semibold text-sm mb-2">
                    Constraints:
                  </h3>
                  <ul className="list-disc list-inside space-y-1 font-mono text-xs text-slate-400">
                    {currentProblem.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right pane - Editor & Console */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col bg-[#1e1e1e]">
          {/* Editor Header */}
          <div className="h-10 bg-[#252526] flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[#333333] border border-slate-700 text-slate-300 text-xs rounded px-2.5 py-1 outline-none cursor-pointer"
              >
                <option value="python">Python 3 (Pyodide Wasm)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors"
                title="Reset code template"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset Code</span>
              </button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex bg-[#1e1e1e] font-mono text-sm overflow-hidden relative">
            <div className="w-10 bg-[#1e1e1e] border-r border-slate-800 text-slate-600 text-right pr-2.5 py-3 select-none text-xs">
              {currentCode
                .split("\n")
                .map((_: string, i: number) => (
                  <div key={i}>{i + 1}</div>
                ))}
            </div>
            <textarea
              value={currentCode}
              disabled={timeLeft <= 0 || isSubmitting || submitResult !== null}
              onChange={(e) => handleCodeChange(e.target.value)}
              className={cn(
                "flex-1 bg-transparent text-slate-200 p-3 outline-none resize-none whitespace-pre font-mono text-sm leading-relaxed",
                (timeLeft <= 0 || isSubmitting || submitResult !== null) &&
                  "opacity-60 cursor-not-allowed"
              )}
              spellCheck={false}
            />
          </div>

          {/* Bottom Console Panel */}
          <div className="h-56 border-t border-slate-800 flex flex-col bg-[#252526] shrink-0">
            <Tabs
              value={activeConsoleTab}
              onValueChange={setActiveConsoleTab}
              className="w-full flex-1 flex flex-col"
            >
              <TabsList className="bg-[#252526] border-b border-slate-800 w-full justify-start rounded-none h-9 p-0">
                <TabsTrigger
                  value="testcases"
                  className="rounded-none text-xs data-[state=active]:bg-[#1e1e1e] data-[state=active]:border-t-2 data-[state=active]:border-t-blue-500"
                >
                  Test Cases
                </TabsTrigger>
                <TabsTrigger
                  value="output"
                  className="rounded-none text-xs data-[state=active]:bg-[#1e1e1e] data-[state=active]:border-t-2 data-[state=active]:border-t-blue-500 flex items-center gap-1.5"
                >
                  <span>Test Result</span>
                  {currentResults.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        currentResults.every((r) => r.passed)
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {currentResults.filter((r) => r.passed).length}/
                      {currentResults.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="testcases"
                className="flex-1 p-3 m-0 bg-[#1e1e1e] overflow-auto"
              >
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {visibleCases.map((_, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCase(i)}
                        className={`text-xs py-1 h-7 border-slate-700 ${
                          selectedCase === i
                            ? "bg-slate-700 text-white"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        Case {i + 1}
                      </Button>
                    ))}
                  </div>
                  <div className="space-y-2 font-mono text-xs">
                    <div>
                      <div className="text-slate-500 text-[11px] mb-1">
                        Input:
                      </div>
                      <div className="bg-[#2d2d2d] p-2 rounded text-slate-200 whitespace-pre">
                        {visibleCases[selectedCase]?.input}
                      </div>
                    </div>
                    {visibleCases[selectedCase]?.expectedOutput && (
                      <div>
                        <div className="text-slate-500 text-[11px] mb-1">
                          Expected Output:
                        </div>
                        <div className="bg-[#2d2d2d] p-2 rounded text-emerald-400 whitespace-pre">
                          {visibleCases[selectedCase]?.expectedOutput}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="output"
                className="flex-1 p-3 m-0 bg-[#1e1e1e] overflow-auto font-mono text-xs"
              >
                {executionError ? (
                  <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded text-rose-300 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-rose-400">
                      <AlertCircle className="h-4 w-4" /> Execution Error
                    </div>
                    <pre className="text-xs whitespace-pre-wrap font-mono mt-1">
                      {executionError}
                    </pre>
                  </div>
                ) : currentResults.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        {currentResults.every((r) => r.passed) ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            All {currentResults.length} Visible Test Cases Passed
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-rose-400 font-bold text-sm">
                            <XCircle className="h-4 w-4" />
                            {currentResults.filter((r) => !r.passed).length} of{" "}
                            {currentResults.length} Test Cases Failed
                          </div>
                        )}
                      </div>
                      <span className="text-slate-400 text-xs">
                        Total Time:{" "}
                        {Math.round(
                          currentResults.reduce(
                            (acc, r) => acc + r.executionTimeMs,
                            0
                          )
                        )}
                        ms
                      </span>
                    </div>

                    <div className="space-y-3">
                      {currentResults.map((r, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded border text-xs ${
                            r.passed
                              ? "bg-[#252e27] border-emerald-800/40"
                              : "bg-[#2e2324] border-rose-800/40"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-slate-200">
                              Case {i + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400">
                                {r.executionTimeMs}ms
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                                  r.passed
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-rose-500/20 text-rose-400"
                                }`}
                              >
                                {r.passed ? "Passed" : "Failed"}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                            <div>
                              <span className="text-slate-400 text-[10px] block">
                                Input
                              </span>
                              <div className="bg-[#1a1a1a] p-1.5 rounded text-slate-300 font-mono text-[11px] whitespace-pre">
                                {r.input}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] block">
                                Expected Output
                              </span>
                              <div className="bg-[#1a1a1a] p-1.5 rounded text-emerald-400 font-mono text-[11px] whitespace-pre">
                                {r.expectedOutput || "(Hidden)"}
                              </div>
                            </div>
                          </div>

                          <div className="mt-2">
                            <span className="text-slate-400 text-[10px] block">
                              Actual Output
                            </span>
                            <div
                              className={`p-1.5 rounded font-mono text-[11px] whitespace-pre ${
                                r.passed
                                  ? "bg-[#1a1a1a] text-emerald-300"
                                  : "bg-[#1a1a1a] text-rose-300"
                              }`}
                            >
                              {r.actualOutput || (r.error ? r.error : "(None)")}
                            </div>
                          </div>

                          {r.stdout && (
                            <div className="mt-2 pt-2 border-t border-slate-700/50">
                              <span className="text-slate-400 text-[10px] flex items-center gap-1">
                                <Terminal className="h-3 w-3" /> Standard Output
                              </span>
                              <div className="bg-[#141414] p-1.5 rounded text-slate-400 font-mono text-[11px] mt-1 whitespace-pre">
                                {r.stdout}
                              </div>
                            </div>
                          )}

                          {r.traceback && (
                            <div className="mt-2 pt-2 border-t border-rose-800/40">
                              <span className="text-rose-400 text-[10px]">
                                Traceback
                              </span>
                              <pre className="bg-[#1f1617] p-1.5 rounded text-rose-300 font-mono text-[10px] mt-1 whitespace-pre-wrap">
                                {r.traceback}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs flex items-center justify-center h-full">
                    Click &ldquo;Run Code&rdquo; to execute solution against test cases.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CodingAssessmentPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[80vh] flex items-center justify-center bg-[#1e1e1e] text-slate-300">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <CodingAssessmentContent />
    </Suspense>
  );
}
