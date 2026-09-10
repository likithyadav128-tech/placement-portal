import React from "react";
import { cn } from "@/lib/utils";
import { FileX, Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface LoadingStateProps {
  className?: string;
  rows?: number;
}

export function LoadingState({ className, rows = 3 }: LoadingStateProps) {
  return (
    <div className={cn("space-y-4 animate-pulse", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-4 bg-slate-200 rounded-md w-3/4" />
          <div className="h-4 bg-slate-200 rounded-md w-1/2" />
          <div className="h-4 bg-slate-200 rounded-md w-5/6" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 bg-white border border-slate-200 rounded-xl p-5"
          >
            <div className="h-3 bg-slate-200 rounded w-20 mb-3" />
            <div className="h-7 bg-slate-200 rounded w-16 mb-2" />
            <div className="h-3 bg-slate-200 rounded w-24" />
          </div>
        ))}
      </div>
      {/* Chart */}
      <div className="h-72 bg-white border border-slate-200 rounded-xl p-5">
        <div className="h-4 bg-slate-200 rounded w-32 mb-4" />
        <div className="h-52 bg-slate-100 rounded-lg" />
      </div>
      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-48 bg-white border border-slate-200 rounded-xl p-5"
          >
            <div className="h-4 bg-slate-200 rounded w-36 mb-4" />
            <div className="space-y-3">
              <div className="h-3 bg-slate-200 rounded w-full" />
              <div className="h-3 bg-slate-200 rounded w-4/5" />
              <div className="h-3 bg-slate-200 rounded w-3/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl animate-pulse">
      <div className="p-4 border-b border-slate-100">
        <div className="h-4 bg-slate-200 rounded w-48" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="h-8 w-8 bg-slate-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-32" />
              <div className="h-3 bg-slate-200 rounded w-48" />
            </div>
            <div className="h-6 bg-slate-200 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this content. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 mb-4">
        <FileX className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
