"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ComparisonBarChart, TrendLineChart, StatCard, DonutChart } from "@/components/charts";
import { Users, TrendingUp, Target, Award } from "lucide-react";
import { mockPerformanceHistory } from "@/data/mock/performance";

export default function PerformancePage() {
  // Aggregate mock data
  const deptComparison = [
    { name: "Computer Science", score: 82 },
    { name: "Information Tech", score: 78 },
    { name: "AI & DS", score: 80 },
    { name: "Electronics", score: 68 }
  ];

  const skillDistribution = [
    { name: "Coding", value: 76, color: "#4f46e5" },
    { name: "Aptitude", value: 72, color: "#10b981" },
    { name: "Reasoning", value: 70, color: "#f59e0b" },
    { name: "Communication", value: 75, color: "#8b5cf6" }
  ];

  const trendData = mockPerformanceHistory["STU001"].map((r, i) => {
    const variance = (i % 3) * 1.5;
    return {
      month: r.month,
      cs: Math.round(r.overall - variance),
      it: Math.round(r.overall - 4 - variance),
      aids: Math.round(r.overall - 2 - variance),
      ece: Math.round(r.overall - 8 - variance),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Student Performance"
        description="Analyze performance metrics across departments and skill areas."
      />

      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <select className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>All Departments</option>
          <option>Computer Science</option>
          <option>Information Tech</option>
          <option>AI & DS</option>
          <option>Electronics</option>
        </select>
        <select className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>All Years</option>
          <option>4th Year</option>
          <option>3rd Year</option>
        </select>
        <select className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>Last 6 Months</option>
          <option>Last 3 Months</option>
          <option>This Semester</option>
          <option>All Time</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Overall Average" value="73.5%" change="+1.2%" changeType="positive" icon={<Target className="w-5 h-5"/>} />
        <StatCard title="Total Assessments" value="128" description="Completed this year" icon={<Award className="w-5 h-5"/>} />
        <StatCard title="Active Students" value="450" change="98% participation" changeType="positive" icon={<Users className="w-5 h-5"/>} />
        <StatCard title="Readiness Rate" value="65%" change="+5%" changeType="positive" description="Students scoring >70%" icon={<TrendingUp className="w-5 h-5"/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Department Performance Trends</CardTitle>
            <CardDescription>Average scores over the last academic year</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendLineChart 
              data={trendData} 
              lines={[
                { key: "cs", color: "#3b82f6", name: "CS" },
                { key: "it", color: "#10b981", name: "IT" },
                { key: "aids", color: "#8b5cf6", name: "AI&DS" },
                { key: "ece", color: "#f59e0b", name: "ECE" }
              ]} 
              height={350}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skill Distribution</CardTitle>
            <CardDescription>Average performance by skill area</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <DonutChart data={skillDistribution} height={300} />
            <div className="mt-4 grid grid-cols-2 gap-4 w-full">
              {skillDistribution.map(s => (
                <div key={s.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-600">{s.name}</span>
                  <span className="font-medium ml-auto">{s.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Comparison Overview</CardTitle>
          <CardDescription>Detailed breakdown of current semester performance</CardDescription>
        </CardHeader>
        <CardContent>
          <ComparisonBarChart 
            data={deptComparison}
            bars={[{ key: "score", color: "#3b82f6", name: "Average Score" }]}
            height={300}
            layout="horizontal"
          />
        </CardContent>
      </Card>
    </div>
  );
}
