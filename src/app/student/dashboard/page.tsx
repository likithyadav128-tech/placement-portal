"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Target,
  Code2,
  BrainCircuit,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  BookOpen,
  Clock,
  CheckCircle2,
  Zap,
  Star,
  ChevronRight,
} from "lucide-react";
import { GradientAreaChart } from "@/components/charts";
import { DashboardSkeleton, ErrorState } from "@/components/feedback/states";
import { useRole } from "@/context/RoleContext";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
interface DashboardData {
  student: {
    id: string;
    name: string;
    email: string;
    rollNumber: string;
    department: string;
    year: string;
    placementReadiness: number;
    overallScore: number;
    codingScore: number;
    aptitudeScore: number;
    reasoningScore: number;
    communicationScore: number;
    trend: string;
    profileCompleteness: number;
  };
  kpiDeltas: {
    placementReadiness: { change: string; changeType: "positive" | "negative" | "neutral" };
    coding: { change: string; changeType: "positive" | "negative" | "neutral" };
    aptitude: { change: string; changeType: "positive" | "negative" | "neutral" };
    communication: { change: string; changeType: "positive" | "negative" | "neutral" };
  };
  performanceHistory: Array<{
    id: string;
    month: string;
    date: string;
    overall: number;
    score: number;
    maxScore: number;
    title: string;
  }>;
  focusAreas: Array<{
    id: string;
    skill: string;
    status: string;
    currentScore: number;
    targetScore: number;
    suggestion: string;
  }>;
  reminders: Array<{
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    actionUrl: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
  }>;
  recommendedNextStep: {
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    actionUrl: string;
  };
  upcomingAssessments: Array<{
    id: string;
    title: string;
    type: string;
    duration: number;
    totalQuestions: number;
    difficulty: string;
  }>;
  roadmap: {
    totalItems: number;
    completedItems: number;
    progressPercentage: number;
  };
}

/* ─── Hero Banner Illustration (inline SVG) ─── */
function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 240 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      {/* Decorative background circles */}
      <circle cx="180" cy="40" r="50" fill="white" fillOpacity="0.07" />
      <circle cx="210" cy="100" r="30" fill="white" fillOpacity="0.06" />
      <circle cx="50" cy="160" r="35" fill="white" fillOpacity="0.05" />

      {/* Desk */}
      <rect x="40" y="145" width="160" height="10" rx="4" fill="white" fillOpacity="0.25" />

      {/* Laptop base */}
      <rect x="80" y="120" width="90" height="55" rx="6" fill="#1E40AF" fillOpacity="0.85" />
      {/* Laptop screen */}
      <rect x="85" y="95" width="80" height="52" rx="4" fill="#DBEAFE" fillOpacity="0.95" />
      {/* Screen content lines */}
      <rect x="92" y="104" width="40" height="4" rx="2" fill="#3B82F6" fillOpacity="0.5" />
      <rect x="92" y="112" width="55" height="3" rx="1.5" fill="#93C5FD" fillOpacity="0.4" />
      <rect x="92" y="119" width="48" height="3" rx="1.5" fill="#93C5FD" fillOpacity="0.4" />
      <rect x="92" y="126" width="36" height="3" rx="1.5" fill="#93C5FD" fillOpacity="0.3" />
      {/* Screen chart */}
      <polyline
        points="130,135 140,128 150,132 160,122"
        stroke="#34D399"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Person body (hoodie) */}
      <ellipse cx="125" cy="90" rx="30" ry="35" fill="#1D4ED8" />
      {/* Hoodie details */}
      <rect x="110" y="75" width="30" height="20" rx="4" fill="#1E40AF" />
      <rect x="118" y="75" width="14" height="25" rx="3" fill="#172554" fillOpacity="0.4" />

      {/* Left arm */}
      <path d="M97 85 Q88 95 90 108" stroke="#1D4ED8" strokeWidth="14" strokeLinecap="round" fill="none" />
      {/* Left hand on keyboard */}
      <ellipse cx="91" cy="111" rx="8" ry="5" fill="#FCD34D" />

      {/* Right arm */}
      <path d="M153 85 Q162 95 160 108" stroke="#1D4ED8" strokeWidth="14" strokeLinecap="round" fill="none" />
      {/* Right hand */}
      <ellipse cx="160" cy="111" rx="8" ry="5" fill="#FCD34D" />

      {/* Head */}
      <circle cx="125" cy="62" r="22" fill="#FCD34D" />
      {/* Hair */}
      <path d="M103 60 Q105 38 125 40 Q145 38 147 60" fill="#1E3A5F" />
      {/* Eyes */}
      <circle cx="118" cy="62" r="2.5" fill="#1E3A5F" />
      <circle cx="132" cy="62" r="2.5" fill="#1E3A5F" />
      {/* Smile */}
      <path d="M119 70 Q125 75 131 70" stroke="#1E3A5F" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Floating stars / sparkles */}
      <circle cx="68" cy="55" r="4" fill="white" fillOpacity="0.5" />
      <circle cx="185" cy="70" r="3" fill="white" fillOpacity="0.4" />
      <circle cx="175" cy="45" r="2" fill="#FCD34D" fillOpacity="0.7" />
      <circle cx="62" cy="90" r="2.5" fill="white" fillOpacity="0.35" />

      {/* Small trophy icon top-right */}
      <rect x="190" y="30" width="24" height="24" rx="6" fill="white" fillOpacity="0.15" />
      <text x="196" y="47" fontSize="14" fill="#FCD34D">🏆</text>
    </svg>
  );
}

/* ─── Metric Card ─── */
interface MetricCardProps {
  title: string;
  value: number | null;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  emptyLabel?: string;
}

function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  iconBg,
  iconColor,
  icon,
  emptyLabel = "Not attempted",
}: MetricCardProps) {
  const hasValue = value !== null && value > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      {/* Icon block */}
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        <span className={iconColor}>{icon}</span>
      </div>
      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 leading-tight mb-1">{title}</p>
        {hasValue ? (
          <>
            <p className="text-3xl font-bold text-[#172554] leading-none">{value}%</p>
            {change && (
              <p
                className={cn(
                  "text-xs font-medium mt-1.5",
                  changeType === "positive" && "text-green-600",
                  changeType === "negative" && "text-red-500",
                  changeType === "neutral" && "text-slate-400"
                )}
              >
                {change}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-slate-300 leading-none">—</p>
            <p className="text-xs text-slate-400 mt-1.5">{emptyLabel}</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Goal Item ─── */
interface GoalItemProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  href: string;
  onClick?: () => void;
}

function GoalItem({ icon, iconBg, iconColor, title, priority, href, onClick }: GoalItemProps) {
  const priorityConfig = {
    HIGH: { label: "HIGH", cls: "bg-red-500 text-white" },
    MEDIUM: { label: "MEDIUM", cls: "bg-amber-400 text-white" },
    LOW: { label: "LOW", cls: "bg-blue-400 text-white" },
  };
  const cfg = priorityConfig[priority];

  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50/60 transition-colors group"
    >
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
        <span className={iconColor}>{icon}</span>
      </div>
      <span className="flex-1 text-sm font-medium text-[#172554] leading-tight truncate">{title}</span>
      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", cfg.cls)}>
        {cfg.label}
      </span>
    </Link>
  );
}

/* ─── Assessment score badge colour ─── */
function scoreBadgeCls(pct: number): string {
  if (pct >= 70) return "bg-green-100 text-green-700 border border-green-200";
  if (pct >= 40) return "bg-amber-100 text-amber-700 border border-amber-200";
  return "bg-red-100 text-red-600 border border-red-200";
}

function assessmentTypeIcon(type?: string) {
  const t = (type || "").toLowerCase();
  if (t === "coding") return <Code2 className="h-4 w-4" />;
  if (t.includes("aptitude") || t.includes("quantitative") || t.includes("logical"))
    return <BrainCircuit className="h-4 w-4" />;
  return <BookOpen className="h-4 w-4" />;
}

/* ─── Trophy SVG ─── */
function TrophyIllustration() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20" aria-hidden="true">
      <circle cx="40" cy="40" r="38" fill="white" fillOpacity="0.2" />
      {/* Cup */}
      <path d="M24 20h32v18c0 10-6 16-16 16s-16-6-16-16V20z" fill="#FCD34D" />
      <path d="M24 20h32v4H24z" fill="#F59E0B" />
      {/* Handles */}
      <path d="M24 24 Q16 28 16 36 Q16 44 24 44" stroke="#FCD34D" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M56 24 Q64 28 64 36 Q64 44 56 44" stroke="#FCD34D" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Stem */}
      <rect x="36" y="54" width="8" height="10" rx="2" fill="#FCD34D" />
      {/* Base */}
      <rect x="28" y="62" width="24" height="6" rx="3" fill="#F59E0B" />
      {/* Star on cup */}
      <text x="31" y="43" fontSize="16" fill="white" fillOpacity="0.85">★</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════ */
/*                  MAIN DASHBOARD PAGE                   */
/* ═══════════════════════════════════════════════════════ */

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useRole();
  const [timeRange, setTimeRange] = useState("6m");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      const session = (await supabase.auth.getSession()).data?.session;
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch(`/api/student/dashboard?timeRange=${timeRange}`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) { router.push("/login"); return; }
        throw new Error(`Failed to load dashboard (HTTP ${res.status})`);
      }
      const json = (await res.json()) as DashboardData;
      setDashboardData(json);
      setFetchError(null);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [router, timeRange]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  /* ─── Derived values ─── */
  const student = dashboardData?.student ?? user?.student;
  const kpiDeltas = dashboardData?.kpiDeltas;
  const chartData = dashboardData?.performanceHistory ?? [];
  const reminders = dashboardData?.reminders ?? [];
  const performanceHistory = dashboardData?.performanceHistory ?? [];

  const displayName = user?.name
    ? user.name.split(" ")[0]
    : dashboardData?.student?.name
    ? dashboardData.student.name.split(" ")[0]
    : "Student";

  /* ─── Recent assessments from performance history ─── */
  const recentAssessments = [...performanceHistory]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  /* ─── Today's goals from reminders ─── */
  // Default goal set when reminders are empty (static suggestions only, no fake data)
  const defaultGoals: GoalItemProps[] = [
    {
      icon: <CheckCircle2 className="h-4 w-4" />,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      title: "Complete your profile",
      priority: "HIGH",
      href: "/student/profile",
    },
    {
      icon: <BookOpen className="h-4 w-4" />,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      title: "Take a Mock Test",
      priority: "MEDIUM",
      href: "/student/mock-tests",
    },
    {
      icon: <Code2 className="h-4 w-4" />,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      title: "Practice Coding",
      priority: "MEDIUM",
      href: "/student/assignments",
    },
    {
      icon: <BrainCircuit className="h-4 w-4" />,
      iconBg: "bg-teal-50",
      iconColor: "text-teal-500",
      title: "Improve Aptitude",
      priority: "LOW",
      href: "/student/assignments",
    },
  ];

  // Map reminders → goal items (keep the same shape)
  const goalItems: GoalItemProps[] =
    reminders.length > 0
      ? reminders.slice(0, 4).map((r) => ({
          icon: <Zap className="h-4 w-4" />,
          iconBg:
            r.priority === "HIGH"
              ? "bg-red-50"
              : r.priority === "MEDIUM"
              ? "bg-amber-50"
              : "bg-blue-50",
          iconColor:
            r.priority === "HIGH"
              ? "text-red-500"
              : r.priority === "MEDIUM"
              ? "text-amber-500"
              : "text-blue-500",
          title: r.title,
          priority: r.priority,
          href: r.actionUrl,
        }))
      : defaultGoals;

  /* ─── Period selector tabs ─── */
  const periods = [
    { label: "30D", value: "30d" },
    { label: "3M", value: "3m" },
    { label: "6M", value: "6m" },
    { label: "1Y", value: "1y" },
    { label: "All", value: "all" },
  ];

  /* ─── Loading / Error states ─── */
  if (isLoading && !dashboardData) {
    return <div className="p-6"><DashboardSkeleton /></div>;
  }

  if (fetchError && !dashboardData) {
    return (
      <div className="p-6">
        <ErrorState
          title="Unable to load dashboard"
          message={fetchError}
          onRetry={loadDashboardData}
        />
      </div>
    );
  }

  /* ════════════════════════════ RENDER ════════════════════════════ */
  return (
    <div className="space-y-6 pb-16 max-w-[1400px] mx-auto">

      {/* ── HERO BANNER ── */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: "linear-gradient(135deg, #0878F9 0%, #0756C9 40%, #06B6D4 100%)",
          minHeight: "240px",
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-[-40px] right-[-40px] w-64 h-64 rounded-full bg-white opacity-[0.05]" />
        <div className="absolute bottom-[-30px] right-[180px] w-40 h-40 rounded-full bg-cyan-300 opacity-[0.08]" />
        <div className="absolute top-[20px] right-[100px] w-20 h-20 rounded-full bg-white opacity-[0.06]" />
        <div className="absolute bottom-[10px] left-[30%] w-12 h-12 rounded-full bg-white opacity-[0.05]" />

        <div className="relative flex items-center justify-between h-full px-8 py-8">
          {/* Left: Text */}
          <div className="flex-1 min-w-0 pr-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Level up your placement journey,{" "}
              <span className="text-cyan-200">{displayName}!</span>{" "}
              🚀
            </h1>
            <p className="mt-3 text-base text-blue-100 font-medium">
              Practice. Improve. Get Placed.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/student/assignments"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
              >
                Start Practice
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/student/mock-tests"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 border border-white/30 text-white text-sm font-semibold rounded-xl hover:bg-white/25 transition-colors"
              >
                Mock Tests
              </Link>
            </div>
          </div>

          {/* Right: Illustration */}
          <div className="hidden sm:block shrink-0 w-[200px] h-[200px] lg:w-[240px] lg:h-[240px]">
            <HeroIllustration />
          </div>
        </div>
      </div>

      {/* ── FOUR METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Placement Readiness"
          value={student?.placementReadiness ?? null}
          change={kpiDeltas?.placementReadiness.change}
          changeType={kpiDeltas?.placementReadiness.changeType}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          icon={<Target className="h-5 w-5" />}
          emptyLabel="No assessments yet"
        />
        <MetricCard
          title="Coding Proficiency"
          value={student?.codingScore ?? null}
          change={kpiDeltas?.coding.change}
          changeType={kpiDeltas?.coding.changeType}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
          icon={<Code2 className="h-5 w-5" />}
        />
        <MetricCard
          title="Aptitude & Reasoning"
          value={student?.aptitudeScore ?? null}
          change={kpiDeltas?.aptitude.change}
          changeType={kpiDeltas?.aptitude.changeType}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
          icon={<BrainCircuit className="h-5 w-5" />}
        />
        <MetricCard
          title="Communication / Verbal"
          value={student?.communicationScore ?? null}
          change={kpiDeltas?.communication.change}
          changeType={kpiDeltas?.communication.changeType}
          iconBg="bg-pink-50"
          iconColor="text-pink-500"
          icon={<MessageSquare className="h-5 w-5" />}
        />
      </div>

      {/* ── YOUR PROGRESS + TODAY'S GOALS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Your Progress (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          {/* Card header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-[#172554]">Your Progress</h2>
              <p className="text-xs text-slate-400 mt-0.5">Overall score across all completed assessments</p>
            </div>
            {/* Period tabs */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 self-start sm:self-auto">
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setTimeRange(p.value)}
                  className={cn(
                    "px-3 py-1 text-[11px] font-semibold rounded-md transition-colors",
                    timeRange === p.value
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart or empty state */}
          {chartData.length === 0 ? (
            <div className="h-[280px] flex flex-col items-center justify-center text-center bg-blue-50/30 rounded-xl border border-dashed border-blue-200">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mb-3">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No performance records yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Complete assignments and mock tests to track your score growth over time.
              </p>
              <button
                onClick={() => router.push("/student/assignments")}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start an Assignment
              </button>
            </div>
          ) : (
            <GradientAreaChart
              data={chartData as unknown as Record<string, unknown>[]}
              dataKey="overall"
              xKey="month"
              height={280}
              color="#0D6EFD"
            />
          )}
        </div>

        {/* Today's Goals (1/3) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#172554]">Today&apos;s Goals</h2>
            <Link
              href="/student/recommendations"
              className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-0.5"
            >
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            {goalItems.map((g, i) => (
              <GoalItem key={i} {...g} />
            ))}
          </div>
          {reminders.length === 0 && (
            <p className="text-[11px] text-slate-400 text-center mt-3">
              Suggested goals — complete assessments for personalized reminders.
            </p>
          )}
        </div>
      </div>

      {/* ── RECENT ASSESSMENTS + MOTIVATIONAL CARD ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Assessments (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#172554]">Recent Assessments</h2>
            <Link
              href="/student/performance"
              className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-0.5"
            >
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentAssessments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-blue-50/30 rounded-xl border border-dashed border-blue-200">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mb-3">
                <Star className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No completed assessments yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Take coding, aptitude, or mock tests to see your results here.
              </p>
              <button
                onClick={() => router.push("/student/mock-tests")}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Explore Mock Tests
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentAssessments.map((a) => {
                const pct = a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : a.overall ?? 0;
                const dateStr = a.date
                  ? new Date(a.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : a.month ?? "—";
                return (
                  <div key={a.id} className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors">
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      {assessmentTypeIcon(a.title)}
                    </div>
                    {/* Title + date */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#172554] truncate">{a.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="text-[11px] text-slate-400">{dateStr}</span>
                      </div>
                    </div>
                    {/* Score badge */}
                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full shrink-0", scoreBadgeCls(pct))}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Motivational Card (1/3) */}
        <div
          className="rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[200px]"
          style={{
            background: "linear-gradient(135deg, #EFF6FF 0%, #ECFEFF 60%, #F0FDFA 100%)",
            border: "1px solid #BAE6FD",
          }}
        >
          {/* Decorative circles */}
          <div className="absolute top-[-20px] right-[-20px] w-36 h-36 rounded-full bg-blue-200 opacity-20" />
          <div className="absolute bottom-[-15px] left-[-15px] w-28 h-28 rounded-full bg-cyan-200 opacity-20" />

          <div className="relative z-10 flex flex-col items-center">
            <TrophyIllustration />
            <h3 className="text-xl font-extrabold text-[#172554] mt-3">Keep going!</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-[200px]">
              Consistent practice today leads to big results tomorrow.
            </p>
            <Link
              href="/student/recommendations"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              See Recommendations
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
