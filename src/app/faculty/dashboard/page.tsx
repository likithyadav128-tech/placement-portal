"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, AlertTriangle, BookOpen, TrendingUp, ChevronRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard, TrendLineChart, ComparisonBarChart } from "@/components/charts";
import { mockStudents } from "@/data/mock/students";
import { mockAssessments } from "@/data/mock/assessments";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function FacultyDashboard() {
  const [time] = useState<string>(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 18) return "Afternoon";
    return "Evening";
  });

  const studentsNeedingAttention = mockStudents
    .filter(s => s.overallScore < 60 || s.trend === "declining")
    .slice(0, 5);

  const activeAssessments = mockAssessments.filter(a => a.status === "in_progress" || a.status === "upcoming").length;

  const performanceTrendData = [
    { month: "Jan", average: 65 },
    { month: "Feb", average: 68 },
    { month: "Mar", average: 70 },
    { month: "Apr", average: 71 },
    { month: "May", average: 72.4 }
  ];

  const deptComparisonData = [
    { name: "CS", score: 78 },
    { name: "IT", score: 75 },
    { name: "ECE", score: 68 },
    { name: "AI&DS", score: 72 }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Good ${time}, Dr. Rajesh Kumar`}
        description="Here is what's happening with your students today."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value="156"
          icon={<Users className="w-5 h-5" />}
          change="+12 this semester"
          changeType="positive"
        />
        <StatCard
          title="Average Performance"
          value="72.4%"
          icon={<TrendingUp className="w-5 h-5" />}
          change="+2.4% from last month"
          changeType="positive"
        />
        <StatCard
          title="Needing Attention"
          value="12"
          icon={<AlertTriangle className="w-5 h-5" />}
          change="-3 from last week"
          changeType="positive"
        />
        <StatCard
          title="Active Assessments"
          value={activeAssessments.toString()}
          icon={<BookOpen className="w-5 h-5" />}
          description="2 deadlines approaching"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Class Performance Trend</CardTitle>
            <CardDescription>Average scores over the last 5 months</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendLineChart 
              data={performanceTrendData} 
              lines={[{ key: "average", color: "#2563eb", name: "Class Average" }]} 
              height={300}
            />
          </CardContent>
        </Card>

        {/* Department Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Department Comparison</CardTitle>
            <CardDescription>Average performance across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <ComparisonBarChart 
              data={deptComparisonData} 
              bars={[{ key: "score", color: "#3b82f6", name: "Avg Score" }]} 
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      {/* Attention Panel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Students Needing Attention</CardTitle>
            <CardDescription>Students with declining trends or low overall scores</CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href="/faculty/attention">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Issue</th>
                  <th className="px-4 py-3 font-medium">Trend</th>
                  <th className="px-4 py-3 font-medium">Last Activity</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {studentsNeedingAttention.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                            {student.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-slate-900">{student.name}</div>
                          <div className="text-xs text-slate-500">{student.rollNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={student.overallScore < 50 ? "text-rose-600 font-medium" : "text-amber-600 font-medium"}>
                        {student.overallScore}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={student.trend === 'declining' ? "border-rose-200 text-rose-700 bg-rose-50" : "border-amber-200 text-amber-700 bg-amber-50"}>
                        {student.trend === 'declining' ? 'Declining Performance' : 'Low Overall Score'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {student.trend === "declining" ? (
                        <ArrowDownRight className="w-4 h-4 text-rose-500" />
                      ) : student.trend === "improving" ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <span className="text-slate-400 text-xl leading-none">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(student.lastActivity).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                        <Link href={`/faculty/students/${student.id}`}>
                          View Student
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
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
