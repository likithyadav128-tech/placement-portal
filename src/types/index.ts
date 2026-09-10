import type { Role } from "@/lib/constants";

/* ─── User & Auth ─── */
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  department?: string;
}

/* ─── Student ─── */
export interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  department: string;
  year: string;
  avatar?: string;
  phone?: string;
  skills: string[];
  placementReadiness: number;
  overallScore: number;
  codingScore: number;
  aptitudeScore: number;
  reasoningScore: number;
  communicationScore: number;
  trend: "improving" | "stable" | "declining";
  status: "active" | "inactive" | "graduated";
  lastActivity: string;
  joinedAt: string;
}

export interface PerformanceRecord {
  month: string;
  date: string;
  overall: number;
  coding: number;
  aptitude: number;
  reasoning: number;
  communication: number;
}

export interface PerformanceMilestone {
  id: string;
  title: string;
  achieved: boolean;
  achievedDate?: string;
}

export interface FocusArea {
  skill: string;
  status: "strong" | "improving" | "needs_improvement";
  currentScore: number;
  targetScore: number;
  suggestion: string;
}

/* ─── Faculty ─── */
export interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  avatar?: string;
  studentsAssigned: number;
  permissions: string[];
  status: "active" | "inactive";
  lastActive: string;
  joinedAt: string;
}

/* ─── Assessment ─── */
export interface Assessment {
  id: string;
  title: string;
  type: "coding" | "aptitude" | "mixed";
  difficulty: "easy" | "medium" | "hard";
  duration: number; // minutes
  totalQuestions: number;
  status: "upcoming" | "in_progress" | "completed" | "expired" | "draft" | "published" | "archived";
  deadline?: string;
  bestScore?: number;
  lastAttemptScore?: number;
  participants?: number;
  averageScore?: number;
  createdAt: string;
  createdBy?: string;
  description?: string;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  starterCode: Record<string, string>;
  testCases: { input: string; expectedOutput: string; hidden?: boolean }[];
}

export interface AptitudeQuestion {
  id: string;
  questionNumber: number;
  question: string;
  options: string[];
  correctAnswer?: number;
  category: string;
  markedForReview?: boolean;
  selectedAnswer?: number;
}

/* ─── Mock Test ─── */
export interface MockTest {
  id: string;
  name: string;
  company: string;
  category: string;
  sections: string[];
  duration: number;
  difficulty: "easy" | "medium" | "hard";
  totalQuestions: number;
  previousScore?: number;
  bestScore?: number;
  status: "not_started" | "in_progress" | "completed" | "published" | "draft" | "archived";
  description?: string;
  createdAt?: string;
}

/* ─── Roadmap ─── */
export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  phase: "foundation" | "current" | "upcoming";
  status: "completed" | "in_progress" | "not_started";
  estimatedHours: number;
  skills: string[];
  resources: string[];
  order: number;
}

export interface Roadmap {
  id: string;
  title: string;
  targetGroup: string;
  completion: number;
  status: "active" | "draft" | "archived";
  items: RoadmapItem[];
  lastUpdated: string;
}

/* ─── Recommendation ─── */
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  reason: string;
  priority: "high" | "medium" | "low";
  expectedBenefit: string;
  category: string;
  actionLabel: string;
  actionUrl: string;
}

/* ─── Audit Log ─── */
export interface AuditLog {
  id: string;
  date: string;
  actor: string;
  role: Role;
  action: string;
  target: string;
  status: "success" | "failed";
  details?: string;
}

/* ─── Report ─── */
export interface Report {
  id: string;
  title: string;
  category: string;
  description: string;
  lastGenerated?: string;
  filters: string[];
}

/* ─── Notification ─── */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  createdAt: string;
}

/* ─── Attention Student ─── */
export interface AttentionStudent {
  id: string;
  studentId: string;
  name: string;
  rollNumber: string;
  department: string;
  overallScore: number;
  category: "critical" | "needs_attention" | "monitoring" | "improving";
  reason: string;
  trend: "improving" | "stable" | "declining";
  lastActivity: string;
  suggestedAction: string;
}

/* ─── Permission ─── */
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface FacultyPermission {
  facultyId: string;
  facultyName: string;
  department: string;
  permissions: Record<string, boolean>;
}

/* ─── Settings ─── */
export interface SettingSection {
  id: string;
  title: string;
  description: string;
  settings: Setting[];
}

export interface Setting {
  id: string;
  label: string;
  description?: string;
  type: "text" | "number" | "toggle" | "select";
  value: string | number | boolean;
  options?: string[];
}

/* ─── Nav ─── */
export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string | number;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}
