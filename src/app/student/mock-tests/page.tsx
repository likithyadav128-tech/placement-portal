"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Building, BarChart2 } from 'lucide-react';
import { mockTests } from '@/data/mock/mock-tests';

export default function MockTests() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Mock Tests" 
        description="Full-length company-specific mock tests to prepare you for actual placement drives."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockTests.map((test) => (
          <Card key={test.id} className="flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="bg-slate-50">{test.category}</Badge>
                {test.difficulty === 'hard' && <Badge variant="destructive">Hard</Badge>}
                {test.difficulty === 'medium' && <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">Medium</Badge>}
                {test.difficulty === 'easy' && <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Easy</Badge>}
              </div>
              <CardTitle className="text-xl">{test.name}</CardTitle>
              {test.company && (
                <div className="flex items-center text-slate-500 text-sm mt-1">
                  <Building className="h-4 w-4 mr-1" />
                  {test.company}
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="flex justify-between items-center text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{test.duration} mins</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BarChart2 className="h-4 w-4" />
                  <span>{test.totalQuestions} Questions</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">Sections</p>
                <div className="flex flex-wrap gap-2">
                  {test.sections.map((section, idx) => (
                    <Badge key={idx} variant="secondary" className="font-normal">
                      {section}
                    </Badge>
                  ))}
                </div>
              </div>

              {test.status === 'completed' && test.bestScore && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-900">Best Score: <span className="text-emerald-600">{test.bestScore}%</span></p>
                  {test.previousScore !== undefined && <p className="text-xs text-slate-500">Previous Score: {test.previousScore}%</p>}
                </div>
              )}
            </CardContent>
            <CardFooter>
              {test.status === 'completed' ? (
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1" onClick={() => router.push('/student/performance')}>View Analytics</Button>
                  <Button className="flex-1" onClick={() => router.push('/student/assessments/coding')}>Retake Test</Button>
                </div>
              ) : (
                <Button className="w-full" onClick={() => router.push('/student/assessments/coding')}>Start Mock Test</Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
