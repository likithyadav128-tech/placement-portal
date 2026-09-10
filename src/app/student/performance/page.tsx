"use client";

import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaTrendChart, TrendLineChart } from '@/components/charts';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, TrendingUp, Clock } from 'lucide-react';
import { mockPerformanceHistory, mockMilestones } from '@/data/mock/performance';
import { mockStudents } from '@/data/mock/students';
import { mockAssessments } from '@/data/mock/assessments';
import { cn } from '@/lib/utils';

export default function StudentPerformance() {
  const [timeRange, setTimeRange] = useState('6M');
  const student = mockStudents[0];
  const allHistory = useMemo(() => mockPerformanceHistory[student.id] || [], [student.id]);

  // Compute records based on selected time range
  const filteredHistory = useMemo(() => {
    switch (timeRange) {
      case '1M':
        return allHistory.slice(-2);
      case '3M':
        return allHistory.slice(-3);
      case '6M':
        return allHistory.slice(-6);
      case '12M':
        return allHistory.slice(-12);
      case 'All':
      default:
        return allHistory;
    }
  }, [allHistory, timeRange]);

  const chartData = filteredHistory as unknown as Record<string, unknown>[];

  const currentRecord = filteredHistory[filteredHistory.length - 1] || {
    overall: student.overallScore,
    coding: student.codingScore,
    aptitude: student.aptitudeScore,
    reasoning: student.reasoningScore,
    communication: student.communicationScore,
  };

  const startRecord = filteredHistory[0] || currentRecord;
  const previousRecord = filteredHistory.length > 1 ? filteredHistory[filteredHistory.length - 2] : startRecord;

  const currentScore = currentRecord.overall;
  const startingScore = startRecord.overall;
  const improvement = currentScore - startingScore;
  const bestScore = Math.max(...filteredHistory.map(r => r.overall), currentScore);

  const completedAssessments = mockAssessments.filter(a => a.status === 'completed');

  const skillTrends = [
    {
      name: 'Coding',
      current: currentRecord.coding,
      previous: previousRecord.coding,
      change: currentRecord.coding - previousRecord.coding,
      color: 'bg-blue-600',
    },
    {
      name: 'Aptitude',
      current: currentRecord.aptitude,
      previous: previousRecord.aptitude,
      change: currentRecord.aptitude - previousRecord.aptitude,
      color: 'bg-purple-600',
    },
    {
      name: 'Reasoning',
      current: currentRecord.reasoning,
      previous: previousRecord.reasoning,
      change: currentRecord.reasoning - previousRecord.reasoning,
      color: 'bg-emerald-600',
    },
    {
      name: 'Communication',
      current: currentRecord.communication,
      previous: previousRecord.communication,
      change: currentRecord.communication - previousRecord.communication,
      color: 'bg-amber-600',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Performance Analytics" 
        description="Track your placement readiness and skill improvements from your first assessment to today."
      >
        <Tabs value={timeRange} onValueChange={setTimeRange}>
          <TabsList>
            <TabsTrigger value="1M">1 Month</TabsTrigger>
            <TabsTrigger value="3M">3 Months</TabsTrigger>
            <TabsTrigger value="6M">6 Months</TabsTrigger>
            <TabsTrigger value="12M">12 Months</TabsTrigger>
            <TabsTrigger value="All">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{currentScore}%</div>
            <p className="text-xs text-slate-500 mt-1">Current Overall</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{startingScore}%</div>
            <p className="text-xs text-slate-500 mt-1">Starting Score ({timeRange})</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className={cn("text-2xl font-bold", improvement >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {improvement >= 0 ? `+${improvement}%` : `${improvement}%`}
            </div>
            <p className="text-xs text-slate-500 mt-1">Improvement</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{bestScore}%</div>
            <p className="text-xs text-slate-500 mt-1">Best Score</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-4 lg:col-span-1">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{completedAssessments.length}</div>
            <p className="text-xs text-slate-500 mt-1">Assessments Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Historical Chart */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2">
          <div>
            <CardTitle>Performance Progression ({timeRange})</CardTitle>
            <CardDescription>Track trajectory across all assessments over the selected timeframe</CardDescription>
          </div>
          <Badge variant="outline" className="mt-2 sm:mt-0 w-fit">
            <TrendingUp className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            Active Baseline
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <AreaTrendChart 
              data={chartData} 
              areas={[{ key: 'overall', color: '#2563eb', name: 'Overall Score' }]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Multi-skill comparative trends */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Trends Comparison</CardTitle>
          <CardDescription>Multi-domain score curves across Coding, Aptitude, Reasoning, and Communication</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <TrendLineChart 
              data={chartData}
              lines={[
                { key: 'coding', color: '#2563eb', name: 'Coding' },
                { key: 'aptitude', color: '#9333ea', name: 'Aptitude' },
                { key: 'reasoning', color: '#059669', name: 'Reasoning' },
                { key: 'communication', color: '#d97706', name: 'Communication' }
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Skill Breakdown & Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Skill Breakdown & Changes</CardTitle>
            <CardDescription>Current score compared with previous evaluation period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {skillTrends.map((skill) => (
              <div key={skill.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{skill.name}</span>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded font-medium",
                      skill.change >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    )}>
                      {skill.change >= 0 ? `+${skill.change}%` : `${skill.change}%`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Previous: <span className="font-medium text-slate-700">{skill.previous}%</span> | Current: <span className="font-bold text-slate-900">{skill.current}%</span>
                  </div>
                </div>
                <Progress value={skill.current} className="h-2 bg-slate-100" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Milestones</CardTitle>
            <CardDescription>Verified achievements along your preparation journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockMilestones.map((milestone, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {milestone.achieved ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={cn("text-sm font-medium", milestone.achieved ? "text-slate-900" : "text-slate-400")}>
                      {milestone.title}
                    </p>
                    {milestone.achieved && milestone.achievedDate && (
                      <p className="text-xs text-slate-500">
                        Achieved on {new Date(milestone.achievedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  {milestone.achieved && (
                    <Badge variant="success" className="text-[10px]">Unlocked</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessment History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
          <CardDescription>Record of completed tests and scored evaluations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Assessment</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Questions</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedAssessments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-medium text-slate-900">{a.title}</td>
                    <td className="p-3">
                      <Badge variant="secondary" className="capitalize">{a.type}</Badge>
                    </td>
                    <td className="p-3 text-slate-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {a.duration} mins
                    </td>
                    <td className="p-3 text-slate-600">{a.totalQuestions}</td>
                    <td className="p-3 font-semibold text-emerald-600">{a.bestScore}%</td>
                    <td className="p-3">
                      <Badge variant="success">Completed</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
