"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, PlayCircle, Clock } from 'lucide-react';
import { mockRoadmapItems } from '@/data/mock/roadmap';
import { cn } from '@/lib/utils';

export default function PlacementRoadmap() {
  const router = useRouter();
  const completedItems = mockRoadmapItems.filter(i => i.status === 'completed').length;
  const progress = Math.round((completedItems / mockRoadmapItems.length) * 100);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader 
        title="Placement Roadmap" 
        description="Your guided path to placement readiness."
      />

      <Card className="bg-gradient-to-r from-blue-900 to-slate-900 text-white border-none">
        <CardContent className="pt-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-lg font-medium text-blue-100 mb-1">Overall Progress</h2>
              <p className="text-3xl font-bold">{progress}%</p>
            </div>
            <div className="text-right text-sm text-blue-200">
              {completedItems} of {mockRoadmapItems.length} phases completed
            </div>
          </div>
          <Progress value={progress} className="h-3 bg-blue-950/50 [&>div]:bg-blue-400" />
        </CardContent>
      </Card>

      <div className="relative border-l-2 border-slate-200 ml-4 md:ml-6 space-y-8 pb-8">
        {mockRoadmapItems.map((item, idx) => (
          <div key={item.id} className="relative pl-8 md:pl-10">
            {/* Timeline dot */}
            <div className="absolute -left-[17px] top-1 bg-white p-1 rounded-full">
              {item.status === 'completed' ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500 bg-white" />
              ) : item.status === 'in_progress' ? (
                <div className="h-6 w-6 rounded-full border-2 border-blue-600 flex items-center justify-center bg-white">
                  <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                </div>
              ) : (
                <Circle className="h-6 w-6 text-slate-300 bg-white" />
              )}
            </div>

            <Card className={cn(
              "transition-all duration-200",
              item.status === 'in_progress' ? "ring-2 ring-blue-600 shadow-md border-transparent" : "border-slate-200"
            )}>
              <CardContent className="p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-semibold tracking-wider text-slate-500 uppercase">Phase {item.phase}</span>
                      <Badge variant={item.status === 'completed' ? 'default' : item.status === 'in_progress' ? 'default' : 'secondary'} 
                        className={cn(
                          item.status === 'completed' && "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
                          item.status === 'in_progress' && "bg-blue-100 text-blue-800 hover:bg-blue-100"
                        )}
                      >
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                  </div>
                  <div className="flex items-center text-slate-500 text-sm font-medium bg-slate-50 px-3 py-1 rounded-full w-fit">
                    <Clock className="h-4 w-4 mr-1.5" />
                    {item.estimatedHours} hrs
                  </div>
                </div>
                
                <p className="text-slate-600 mb-6">{item.description}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wider">Skills Covered</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.skills.map(skill => (
                        <Badge key={skill} variant="outline" className="bg-white">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-end items-start sm:items-end mt-4 sm:mt-0">
                    {item.status === 'completed' ? (
                      <Button variant="outline" onClick={() => router.push('/student/recommendations')}>Review Materials</Button>
                    ) : item.status === 'in_progress' ? (
                      <Button className="w-full sm:w-auto" onClick={() => router.push('/student/assessments/coding')}>
                        <PlayCircle className="h-4 w-4 mr-2" /> Continue Learning
                      </Button>
                    ) : (
                      <Button variant="secondary" className="w-full sm:w-auto" disabled>
                        Locked
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
