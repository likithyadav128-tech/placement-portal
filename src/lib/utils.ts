import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

export function formatChange(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value}%`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
    case "completed":
    case "success":
    case "strong":
    case "improving":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "warning":
    case "needs_attention":
    case "needs attention":
    case "in_progress":
    case "in progress":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "critical":
    case "error":
    case "failed":
    case "declining":
    case "expired":
      return "text-rose-700 bg-rose-50 border-rose-200";
    case "upcoming":
    case "info":
    case "monitoring":
    case "draft":
      return "text-blue-700 bg-blue-50 border-blue-200";
    case "inactive":
    case "archived":
      return "text-slate-500 bg-slate-50 border-slate-200";
    default:
      return "text-slate-700 bg-slate-50 border-slate-200";
  }
}
