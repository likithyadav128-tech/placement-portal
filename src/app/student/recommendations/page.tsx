"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  Target,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Code,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  DashboardSkeleton,
  ErrorState,
  EmptyState,
} from "@/components/feedback/states";

interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  reason: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  expectedBenefit: string;
  category: string;
  actionLabel: string;
  actionUrl: string;
  createdAt: string;
}

export default function Recommendations() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = useCallback(async () => {
    try {
      const res = await fetch("/api/student/recommendations");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Failed to load recommendations (HTTP ${res.status})`);
      }
      const data = (await res.json()) as {
        recommendations: RecommendationItem[];
      };
      setRecommendations(data.recommendations || []);
      setError(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load personalized recommendations"
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    loadRecommendations();
  }, [loadRecommendations]);

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("coding")) {
      return <Code className="h-5 w-5 text-blue-500" />;
    }
    if (cat.includes("aptitude")) {
      return <TrendingUp className="h-5 w-5 text-purple-500" />;
    }
    if (cat.includes("assessment")) {
      return <Target className="h-5 w-5 text-emerald-500" />;
    }
    if (cat.includes("communication")) {
      return <Sparkles className="h-5 w-5 text-amber-500" />;
    }
    if (cat.includes("placement")) {
      return <Trophy className="h-5 w-5 text-indigo-500" />;
    }
    return <Lightbulb className="h-5 w-5 text-slate-500" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Personalized Recommendations"
          description="Tailored preparation guidance synthesized from your assessment results and benchmarks."
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Personalized Recommendations"
          description="Tailored preparation guidance synthesized from your assessment results and benchmarks."
        />
        <ErrorState
          title="Unable to load recommendations"
          message={error}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  const highPriority = recommendations.filter((r) => r.priority === "HIGH");
  const otherPriority = recommendations.filter(
    (r) => r.priority === "MEDIUM" || r.priority === "LOW"
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Personalized Recommendations"
        description="Actionable, targeted recommendations derived from your live assessment results."
      />

      {recommendations.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-6 w-6 text-blue-500" />}
          title="You're on track"
          description="Complete more assessments to unlock more personalized recommendations."
          action={
            <Button onClick={() => router.push("/student/assessments")}>
              Explore Assessments
            </Button>
          }
        />
      ) : (
        <>
          {highPriority.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                <h2 className="text-xl font-bold text-slate-900">
                  High Priority Actions
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {highPriority.map((rec) => (
                  <Card
                    key={rec.id}
                    className="border-rose-100 shadow-sm relative overflow-hidden flex flex-col"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-rose-50 rounded-lg">
                          {getCategoryIcon(rec.category)}
                        </div>
                        <Badge variant="danger">High Priority</Badge>
                      </div>
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                      <p className="text-sm text-slate-600">
                        {rec.description}
                      </p>
                      <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Why this?
                        </p>
                        <p className="text-sm text-slate-700">{rec.reason}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Expected Benefit
                        </p>
                        <p className="text-sm font-medium text-emerald-600">
                          {rec.expectedBenefit}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-3 border-t border-slate-100">
                      <Button
                        className="w-full"
                        onClick={() => router.push(rec.actionUrl)}
                      >
                        {rec.actionLabel}{" "}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {otherPriority.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Recommended for You
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherPriority.map((rec) => (
                  <Card key={rec.id} className="flex flex-col shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                          {getCategoryIcon(rec.category)}
                        </div>
                        <Badge variant="secondary" className="capitalize">
                          {rec.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      <p className="text-sm text-slate-600">
                        {rec.description}
                      </p>
                      <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Why this?
                        </p>
                        <p className="text-sm text-slate-700">{rec.reason}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Expected Benefit
                        </p>
                        <p className="text-sm font-medium text-emerald-600">
                          {rec.expectedBenefit}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-3 border-t border-slate-100">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(rec.actionUrl)}
                      >
                        {rec.actionLabel}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
