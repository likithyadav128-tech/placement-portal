"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MoreVertical, Plus } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/feedback/states";

interface AssessmentItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  difficulty: string;
  duration: number;
  questions: number;
  participants: number;
  avgScore: number | null;
  status: string;
  createdAt: string;
}

export default function AssessmentsManagementPage() {
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchAssessments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/management/assessments");
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed to load assessments");
      }
      const data = (await res.json()) as { assessments?: AssessmentItem[] };
      setAssessments(data.assessments || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading assessments");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const filteredAssessments = assessments.filter((a) => {
    if (activeTab === "all") return true;
    return a.status.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assessment Management"
        description="Create and manage placement assessments"
      >
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Create Assessment
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Loading assessments...</p>
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load assessments"
          message={error}
          onRetry={fetchAssessments}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="p-4 border-b">
                <TabsList>
                  <TabsTrigger value="all">All Assessments ({assessments.length})</TabsTrigger>
                  <TabsTrigger value="published">
                    Published ({assessments.filter((a) => a.status.toLowerCase() === "published").length})
                  </TabsTrigger>
                  <TabsTrigger value="draft">
                    Drafts ({assessments.filter((a) => a.status.toLowerCase() === "draft").length})
                  </TabsTrigger>
                  <TabsTrigger value="archived">
                    Archived ({assessments.filter((a) => a.status.toLowerCase() === "archived").length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="p-0 m-0">
                {filteredAssessments.length === 0 ? (
                  <div className="p-8">
                    <EmptyState
                      title="No assessments found"
                      description={`There are no assessments in the "${activeTab}" category.`}
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                        <tr>
                          <th className="p-4">Assessment</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Questions</th>
                          <th className="p-4">Duration</th>
                          <th className="p-4">Participants</th>
                          <th className="p-4">Avg Score</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Created</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssessments.map((assessment) => (
                          <tr key={assessment.id} className="border-b hover:bg-slate-50">
                            <td className="p-4 font-medium">{assessment.title}</td>
                            <td className="p-4">
                              <Badge variant="secondary" className="capitalize">
                                {assessment.type}
                              </Badge>
                            </td>
                            <td className="p-4">{assessment.questions}</td>
                            <td className="p-4">{assessment.duration} min</td>
                            <td className="p-4">{assessment.participants}</td>
                            <td className="p-4">
                              {assessment.avgScore !== null ? `${assessment.avgScore}%` : "—"}
                            </td>
                            <td className="p-4">
                              <Badge
                                variant={
                                  assessment.status.toLowerCase() === "published"
                                    ? "default"
                                    : "secondary"
                                }
                                className="capitalize"
                              >
                                {assessment.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-slate-500">
                              {new Date(assessment.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-right">
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Assessment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assessment Title</label>
              <Input placeholder="e.g. Core Java Basics" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <SimpleSelect
                  placeholder="Select type"
                  options={[
                    { label: "Technical / Coding", value: "coding" },
                    { label: "Aptitude", value: "aptitude" },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <SimpleSelect
                  placeholder="Select difficulty"
                  options={[
                    { label: "Beginner", value: "beginner" },
                    { label: "Intermediate", value: "intermediate" },
                    { label: "Advanced", value: "advanced" },
                  ]}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input type="number" placeholder="60" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsCreateOpen(false)}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
