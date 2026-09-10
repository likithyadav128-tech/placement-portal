"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { SimpleSelect } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MoreVertical, Plus } from 'lucide-react';
import { mockAssessments } from '@/data/mock/assessments';

export default function AssessmentsManagementPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="all" className="w-full">
            <div className="p-4 border-b">
              <TabsList>
                <TabsTrigger value="all">All Assessments</TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="p-0 m-0">
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
                    {mockAssessments?.map((assessment: any) => (
                      <tr key={assessment.id} className="border-b hover:bg-slate-50">
                        <td className="p-4 font-medium">{assessment.title}</td>
                        <td className="p-4"><Badge variant="secondary">{assessment.type}</Badge></td>
                        <td className="p-4">{assessment.questionsCount || 0}</td>
                        <td className="p-4">{assessment.duration} min</td>
                        <td className="p-4">{assessment.participants || 0}</td>
                        <td className="p-4">{assessment.avgScore ? `${assessment.avgScore}%` : '-'}</td>
                        <td className="p-4">
                          <Badge variant={assessment.status === 'published' ? 'default' : 'secondary'}>
                            {assessment.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-slate-500">{new Date(assessment.createdAt || "2026-09-01").toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
                <SimpleSelect placeholder="Select type" options={[{label: 'Technical', value: 'tech'}, {label: 'Aptitude', value: 'apt'}]} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <SimpleSelect placeholder="Select difficulty" options={[{label: 'Beginner', value: 'beg'}, {label: 'Intermediate', value: 'int'}]} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input type="number" placeholder="60" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsCreateOpen(false)}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
