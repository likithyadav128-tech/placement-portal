"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MoreVertical, Plus, Clock, Briefcase } from 'lucide-react';
import { mockTests } from '@/data/mock/mock-tests';

export default function MockTestsManagementPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTests?.map((test: any) => (
          <Card key={test.id} className="flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Badge variant="outline" className="mb-2 bg-slate-50">{test.category || 'Company Specific'}</Badge>
                  <h3 className="font-semibold text-lg">{test.name || test.title}</h3>
                </div>
                <Button variant="ghost" size="icon" className="-mr-2 -mt-2"><MoreVertical className="w-4 h-4" /></Button>
              </div>
              
              <div className="space-y-3 mt-auto pt-4 border-t border-slate-100">
                <div className="flex items-center text-sm text-slate-600 gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span>{test.company || 'General'}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600 gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{test.duration} minutes</span>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <Badge variant={test.status === 'published' ? 'default' : 'secondary'}>{test.status}</Badge>
                  <Button variant="link" size="sm">View Results</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsCreateOpen(false)}>Create Test</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
