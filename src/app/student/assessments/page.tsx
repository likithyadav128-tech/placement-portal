"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Clock, FileText, CheckCircle } from 'lucide-react';
import { mockAssessments } from '@/data/mock/assessments';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function StudentAssessments() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const router = useRouter();

  const filteredAssessments = mockAssessments.filter(a => {
    if (filter === 'completed' && a.status !== 'completed') return false;
    if (filter === 'upcoming' && a.status !== 'upcoming') return false;
    if (filter === 'coding' && a.type !== 'coding') return false;
    if (filter === 'aptitude' && a.type !== 'aptitude') return false;
    
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAction = (assessment: any) => {
    if (assessment.type === 'coding') {
      router.push('/student/assessments/coding');
    } else if (assessment.type === 'aptitude') {
      router.push('/student/assessments/aptitude');
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-emerald-100 text-emerald-800';
      case 'medium': return 'bg-amber-100 text-amber-800';
      case 'hard': return 'bg-rose-100 text-rose-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Assessments" 
        description="Practice and evaluate your skills with targeted assessments."
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 sm:flex">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="coding">Coding</TabsTrigger>
            <TabsTrigger value="aptitude">Aptitude</TabsTrigger>
            <TabsTrigger value="completed" className="hidden sm:inline-flex">Completed</TabsTrigger>
            <TabsTrigger value="upcoming" className="hidden sm:inline-flex">Upcoming</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search assessments..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssessments.map(assessment => (
          <Card key={assessment.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="capitalize">{assessment.type}</Badge>
                <Badge variant="secondary" className={cn("capitalize", getDifficultyColor(assessment.difficulty))}>
                  {assessment.difficulty}
                </Badge>
              </div>
              <CardTitle className="text-lg line-clamp-1" title={assessment.title}>
                {assessment.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-4 text-sm text-slate-500">
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{assessment.duration} min</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  <span>{assessment.totalQuestions} questions</span>
                </div>
              </div>
              
              {assessment.status === 'completed' && assessment.bestScore !== undefined && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-md border border-slate-100">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium text-slate-900">Score: {assessment.bestScore}%</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-3 border-t border-slate-100">
              {assessment.status === 'completed' ? (
                <Button variant="outline" className="w-full" onClick={() => router.push('/student/performance')}>View Results</Button>
              ) : assessment.status === 'in_progress' ? (
                <Button className="w-full" onClick={() => handleAction(assessment)}>Continue</Button>
              ) : (
                <Button className="w-full" onClick={() => handleAction(assessment)}>Start Assessment</Button>
              )}
            </CardFooter>
          </Card>
        ))}
        {filteredAssessments.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            No assessments found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
