"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MoreVertical, Plus, Map } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/feedback/states";

interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  targetDepartment: string;
  itemsCount: number;
  createdAt: string;
}

export default function RoadmapsManagementPage() {
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchRoadmaps = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/management/roadmaps");
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed to load roadmaps");
      }
      const data = (await res.json()) as { roadmaps?: RoadmapItem[] };
      setRoadmaps(data.roadmaps || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading roadmaps");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Learning Roadmaps"
        description="Design and manage structured learning paths for students"
      >
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Create Roadmap
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Loading roadmaps...</p>
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load roadmaps"
          message={error}
          onRetry={fetchRoadmaps}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            {roadmaps.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No learning roadmaps found"
                  description="Create a curriculum roadmap to structure student preparation."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                    <tr>
                      <th className="p-4">Roadmap Name</th>
                      <th className="p-4">Target Group</th>
                      <th className="p-4">Milestones</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Created</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roadmaps.map((roadmap) => (
                      <tr key={roadmap.id} className="border-b hover:bg-slate-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                              <Map className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-medium text-slate-900 block">{roadmap.title}</span>
                              {roadmap.description && (
                                <span className="text-xs text-slate-500 line-clamp-1">{roadmap.description}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{roadmap.targetDepartment || "All Students"}</td>
                        <td className="p-4">
                          <Badge variant="secondary">
                            {roadmap.itemsCount} modules
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant="default">
                            Active
                          </Badge>
                        </td>
                        <td className="p-4 text-slate-500">
                          {new Date(roadmap.createdAt).toLocaleDateString()}
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
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Roadmap</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Roadmap Title</label>
              <Input placeholder="e.g. Full Stack Developer Track" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Group</label>
              <SimpleSelect
                placeholder="Select department"
                options={[
                  { label: "Computer Science", value: "Computer Science" },
                  { label: "Information Technology", value: "Information Technology" },
                  { label: "Electronics & Communication", value: "Electronics & Communication" },
                  { label: "All Departments", value: "All" },
                ]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input placeholder="Brief description of this path" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsCreateOpen(false)}>Create Path</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
