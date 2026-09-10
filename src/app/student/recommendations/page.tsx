"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Target, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { mockRecommendations } from '@/data/mock/recommendations';

export default function Recommendations() {
  const router = useRouter();
  const highPriority = mockRecommendations.filter(r => r.priority === 'high');
  const mediumPriority = mockRecommendations.filter(r => r.priority === 'medium');

  const getIcon = (type: string) => {
    switch(type) {
      case 'course': return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'assessment': return <Target className="h-5 w-5 text-emerald-500" />;
      case 'practice': return <Lightbulb className="h-5 w-5 text-amber-500" />;
      default: return <Lightbulb className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="AI Recommendations" 
        description="Personalized suggestions based on your performance data and target companies."
      />

      {highPriority.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            <h2 className="text-xl font-bold text-slate-900">High Priority Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highPriority.map(rec => (
              <Card key={rec.id} className="border-rose-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-rose-50 rounded-lg">
                      {getIcon(rec.category)}
                    </div>
                    <Badge variant="destructive" className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-none">Priority</Badge>
                  </div>
                  <CardTitle className="text-lg">{rec.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600">{rec.description}</p>
                  <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Why this?</p>
                    <p className="text-sm text-slate-700">{rec.reason}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => router.push('/student/assessments/coding')}>
                    {rec.actionLabel} <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Recommended for You</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mediumPriority.map(rec => (
            <Card key={rec.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    {getIcon(rec.category)}
                  </div>
                  <Badge variant="secondary" className="capitalize">{rec.category}</Badge>
                </div>
                <CardTitle className="text-lg">{rec.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <p className="text-sm text-slate-600">{rec.description}</p>
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expected Benefit</p>
                  <p className="text-sm font-medium text-emerald-600">{rec.expectedBenefit}</p>
                </div>
              </CardContent>
              <CardFooter className="pt-3 border-t border-slate-100">
                <Button variant="outline" className="w-full" onClick={() => router.push('/student/assessments')}>
                  {rec.actionLabel}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
