"use client";

import React, { useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard, AreaTrendChart, ComparisonBarChart, DonutChart } from '@/components/charts';
import { Users, UserCheck, Activity, BookOpen, AlertCircle, FileText, Target } from 'lucide-react';
import { mockStudents } from '@/data/mock/students';
import { mockFaculty } from '@/data/mock/faculty';
import { mockAssessments } from '@/data/mock/assessments';
import { mockTests } from '@/data/mock/mock-tests';
import { mockRoadmaps } from '@/data/mock/roadmap';
import { mockAuditLogs } from '@/data/mock/audit-logs';

export default function ManagementDashboardPage() {
  const totalStudents = mockStudents?.length || 0;
  const totalFaculty = mockFaculty?.length || 0;
  
  const avgReadiness = useMemo(() => {
    if (!mockStudents || mockStudents.length === 0) return 0;
    const total = mockStudents.reduce((acc: any, s: any) => acc + (s.placementReadiness || 0), 0);
    return Math.round(total / mockStudents.length);
  }, []);

  const studentsNeedingAttention = useMemo(() => {
    if (!mockStudents) return 0;
    return mockStudents.filter((s: any) => s.placementReadiness < 50 || s.status === 'at-risk').length;
  }, []);

  const activeAssessments = mockAssessments?.filter((a: any) => a.status === 'published')?.length || 0;
  const availableTests = mockTests?.filter((t: any) => t.status === 'published')?.length || 0;
  
  const avgRoadmapCompletion = useMemo(() => {
    if (!mockRoadmaps || mockRoadmaps.length === 0) return 0;
    const total = mockRoadmaps.reduce((acc: any, r: any) => acc + (r.completionPercentage || 0), 0);
    return Math.round(total / mockRoadmaps.length);
  }, []);

  const recentLogs = mockAuditLogs?.slice(0, 5) || [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Executive Dashboard" 
        description="Overview of placement training and student performance"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={totalStudents.toString()} icon={<Users className="w-5 h-5" />} change="+2.5%" changeType="positive" />
        <StatCard title="Total Faculty" value={totalFaculty.toString()} icon={<UserCheck className="w-5 h-5" />} />
        <StatCard title="Avg Readiness" value={`${avgReadiness}%`} icon={<Target className="w-5 h-5" />} change="+5%" changeType="positive" />
        <StatCard title="Participation Rate" value="85%" icon={<Activity className="w-5 h-5" />} change="+2%" changeType="positive" />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-rose-50 border-rose-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-900">{studentsNeedingAttention}</div>
            <p className="text-xs text-rose-600 mt-1">Students at risk</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Active Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{activeAssessments}</div>
            <p className="text-xs text-blue-600 mt-1">Currently ongoing</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Mock Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{availableTests}</div>
            <p className="text-xs text-emerald-600 mt-1">Available for students</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Roadmap Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{avgRoadmapCompletion}%</div>
            <p className="text-xs text-purple-600 mt-1">Average completion</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Institution Performance Trend</CardTitle>
            <CardDescription>Average performance scores over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <AreaTrendChart 
              data={[
                { date: 'Jan', score: 65 }, { date: 'Feb', score: 68 }, { date: 'Mar', score: 72 },
                { date: 'Apr', score: 75 }, { date: 'May', score: 78 }, { date: 'Jun', score: 82 }
              ]} 
              xKey="date" 
              areas={[{ key: 'score', color: '#2563eb', name: 'Performance' }]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Comparison</CardTitle>
            <CardDescription>Average readiness by department</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ComparisonBarChart 
              data={[
                { department: 'CS', readiness: 85 }, { department: 'IT', readiness: 82 },
                { department: 'ECE', readiness: 75 }, { department: 'AI&DS', readiness: 88 }
              ]}
              xKey="department"
              bars={[{ key: 'readiness', color: '#3b82f6', name: 'Readiness' }]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Assessment Participation</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <DonutChart 
              data={[
                { name: 'Completed', value: 65, color: '#10b981' },
                { name: 'In Progress', value: 20, color: '#f59e0b' },
                { name: 'Not Started', value: 15, color: '#ef4444' }
              ]}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLogs.map((log: any, i: number) => (
                <div key={i} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-slate-500">{log.actor} • {log.target}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline">{log.status}</Badge>
                    <span className="text-xs text-slate-500">{new Date(log.date || "2026-09-09").toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
