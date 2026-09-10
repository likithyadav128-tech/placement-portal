"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { SimpleSelect } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MoreVertical, Plus, Map } from 'lucide-react';
import { mockRoadmaps } from '@/data/mock/roadmap';

export default function RoadmapsManagementPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="p-4">Roadmap Name</th>
                  <th className="p-4">Target Group</th>
                  <th className="p-4 w-48">Completion %</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Updated</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockRoadmaps?.map((roadmap: any) => (
                  <tr key={roadmap.id} className="border-b hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                          <Map className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{roadmap.title || roadmap.name}</span>
                      </div>
                    </td>
                    <td className="p-4">{roadmap.targetGroup || 'All Students'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Progress value={roadmap.completionPercentage || 0} className="h-2" />
                        <span className="text-xs w-8">{roadmap.completionPercentage || 0}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={roadmap.status === 'published' ? 'default' : 'secondary'}>
                        {roadmap.status || 'Active'}
                      </Badge>
                    </td>
                    <td className="p-4 text-slate-500">{new Date(roadmap.lastUpdated || "2026-09-01").toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
              <SimpleSelect placeholder="Select department" options={[{label: 'Computer Science', value: 'CS'}, {label: 'Information Tech', value: 'IT'}]} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input placeholder="Brief description of this path" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsCreateOpen(false)}>Create Path</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
