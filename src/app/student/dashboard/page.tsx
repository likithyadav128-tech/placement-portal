"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Code, Trophy, Target, Clock } from 'lucide-react';
import { TrendLineChart, StatCard } from '@/components/charts';
import { mockPerformanceHistory, mockFocusAreas } from '@/data/mock/performance';
import { mockStudents } from '@/data/mock/students';
import { mockAssessments } from '@/data/mock/assessments';
import { mockRoadmapItems } from '@/data/mock/roadmap';
import { getGreeting } from '@/lib/utils';
import { PageHeader } from '@/components/layout/page-header';

export default function StudentDashboard() {
  const router = useRouter();
  const student = mockStudents[0];
  const greeting = getGreeting();
  const [timeRange, setTimeRange] = useState('6M');

  const upcomingAssessments = mockAssessments.filter(a => a.status === 'upcoming').slice(0, 3);

  const chartData = useMemo(() => {
    const history = mockPerformanceHistory[student.id] || [];
    switch (timeRange) {
      case '1M': return history.slice(-2);
      case '3M': return history.slice(-3);
      case '6M': return history.slice(-6);
      case 'All': return history;
      default: return history.slice(-6);
    }
  }, [student.id, timeRange]);

  const completedRoadmapCount = mockRoadmapItems.filter(i => i.status === 'completed').length;
  const roadmapProgress = Math.round((completedRoadmapCount / mockRoadmapItems.length) * 100);

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`${greeting}, ${student.name.split(' ')[0]}`} 
        description="Here's a summary of your placement readiness and recent progress."
      />

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Placement Readiness" 
          value={`${student.placementReadiness}%`} 
          change="+6.4% from last period" 
          changeType="positive"
          icon={<Target className="h-5 w-5 text-blue-600" />}
        />
        <StatCard 
          title="Coding Proficiency" 
          value={`${student.codingScore}%`} 
          change="+8% improvement" 
          changeType="positive"
          icon={<Code className="h-5 w-5 text-indigo-600" />}
        />
        <StatCard 
          title="Aptitude & Reasoning" 
          value={`${student.aptitudeScore}%`} 
          change="+4% improvement" 
          changeType="positive"
          icon={<Trophy className="h-5 w-5 text-amber-600" />}
        />
        <StatCard 
          title="Communication" 
          value={`${student.communicationScore}%`} 
          change="+12% improvement" 
          changeType="positive"
          icon={<BookOpen className="h-5 w-5 text-emerald-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>Your overall score progression ({timeRange})</CardDescription>
            </div>
            <Tabs value={timeRange} onValueChange={setTimeRange}>
              <TabsList>
                <TabsTrigger value="1M">1M</TabsTrigger>
                <TabsTrigger value="3M">3M</TabsTrigger>
                <TabsTrigger value="6M">6M</TabsTrigger>
                <TabsTrigger value="All">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <TrendLineChart 
                data={chartData as unknown as Record<string, unknown>[]} 
                lines={[{ key: 'overall', color: '#2563eb', name: 'Overall Score' }]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recommended Next Step */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Recommended Next Step</CardTitle>
            <CardDescription>Targeted practice based on your performance</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center text-center p-6 bg-slate-50 mx-6 rounded-lg border border-slate-100 mb-6">
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <Code className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Practice Arrays & Strings</h3>
            <p className="text-sm text-slate-500 mb-6">Your recent coding performance is below your target. Sharpen your fundamentals with 5 interview problems.</p>
            <Button className="w-full" onClick={() => router.push('/student/assessments/coding')}>
              Start Practice Session
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Focus Areas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Focus Areas</CardTitle>
            <CardDescription>Key competencies and prioritized feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockFocusAreas.map((area, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-white hover:border-slate-200 transition-colors">
                  <div className="flex flex-col pr-2">
                    <span className="font-medium text-sm text-slate-900">{area.skill}</span>
                    <span className="text-xs text-slate-500 mt-0.5 line-clamp-1" title={area.suggestion}>{area.suggestion}</span>
                  </div>
                  <Badge 
                    variant={area.status === 'needs_improvement' ? 'danger' : area.status === 'improving' ? 'warning' : 'success'} 
                    className="shrink-0 capitalize"
                  >
                    {area.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Assessments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Assessments</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/student/assessments')}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingAssessments.map(assessment => (
              <div 
                key={assessment.id} 
                onClick={() => router.push('/student/assessments')}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-slate-900 line-clamp-1">{assessment.title}</h4>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {assessment.duration} min • {assessment.totalQuestions} Qs
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="capitalize text-[10px] shrink-0">
                  {assessment.type}
                </Badge>
              </div>
            ))}

            {/* Quick Roadmap Tracker snippet */}
            <div className="pt-3 border-t border-slate-100 mt-4">
              <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
                <span>Placement Roadmap Progress</span>
                <span className="font-semibold text-slate-800">{roadmapProgress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${roadmapProgress}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
