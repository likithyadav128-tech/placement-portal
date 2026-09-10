export const APP_NAME = "PlacePrep Portal";
export const APP_DESCRIPTION = "Your journey to placement readiness starts here.";

export const ROLES = {
  STUDENT: "STUDENT",
  FACULTY: "FACULTY",
  MANAGEMENT: "MANAGEMENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "AI & Data Science",
  "Mechanical Engineering",
] as const;

export const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"] as const;

export const SKILL_AREAS = [
  "Coding",
  "Aptitude",
  "Reasoning",
  "Communication",
] as const;

export const DATE_RANGES = [
  { label: "1 Month", value: "1m" },
  { label: "3 Months", value: "3m" },
  { label: "6 Months", value: "6m" },
  { label: "12 Months", value: "12m" },
  { label: "All Time", value: "all" },
] as const;

export const CHART_COLORS = {
  primary: "#2563eb",
  secondary: "#7c3aed",
  success: "#059669",
  warning: "#d97706",
  danger: "#dc2626",
  info: "#0284c7",
  muted: "#94a3b8",
  coding: "#2563eb",
  aptitude: "#7c3aed",
  reasoning: "#0891b2",
  communication: "#059669",
} as const;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1440,
} as const;
