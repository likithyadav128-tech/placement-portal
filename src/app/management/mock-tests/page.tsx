"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MoreVertical, Plus, Clock, Briefcase } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/feedback/states";

interface MockTestItem {
  id: string;
  name: string;
  company: string;
  category: string;
  sections: string[];
  duration: number;
  difficulty: string;
  status: string;
  createdAt: string;
}

export default function MockTestsManagementPage() {
  const [tests, setTests] = useState<MockTestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchTests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/management/mock-tests");
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed to load mock tests");
      }
      const data = (await res.json()) as { tests?: MockTestItem[] };
      setTests(data.tests || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading mock tests");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mock Tests Management"
        description="Configure company-specific mock tests"
      >
        <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Create Mock Test
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Loading mock tests...</p>
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load mock tests"
          message={error}
          onRetry={fetchTests}
        />
      ) : tests.length === 0 ? (
        <EmptyState
          title="No mock tests available"
          description="Create your first company-specific benchmark or mock test."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <Card key={test.id} className="flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Badge variant="secondary" className="mb-2 bg-slate-50">
                      {test.category || "Company Specific"}
                    </Badge>
                    <h3 className="font-semibold text-lg">{test.name}</h3>
                  </div>
                  <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3 mt-auto pt-4 border-t border-slate-100">
                  <div className="flex items-center text-sm text-slate-600 gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>{test.company || "General"}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600 gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{test.duration} minutes</span>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <Badge
                      variant={test.status.toLowerCase() === "published" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {test.status}
                    </Badge>
                    <Button variant="link" size="sm">
                      View Results
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Mock Test</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Name</label>
              <Input placeholder="e.g. TCS Ninja Mock Test 1" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Company</label>
              <Input placeholder="e.g. TCS" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sections</label>
                <Input type="number" placeholder="3" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (min)</label>
                <Input type="number" placeholder="120" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsCreateOpen(false)}>Create Test</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
