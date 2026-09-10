"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { StatCard, ComparisonBarChart, TrendLineChart } from "@/components/charts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AnalyticsPage() {
  const scoreDistribution = [
    { range: "0-30", count: 12 },
    { range: "30-50", count: 34 },
    { range: "50-70", count: 68 },
    { range: "70-85", count: 110 },
    { range: "85-100", count: 45 },
  ];

  const monthlyTrends = [
    { month: "Jan", coding: 65, aptitude: 70, reasoning: 68 },
    { month: "Feb", coding: 68, aptitude: 72, reasoning: 70 },
    { month: "Mar", coding: 70, aptitude: 73, reasoning: 71 },
    { month: "Apr", coding: 74, aptitude: 75, reasoning: 74 },
    { month: "May", coding: 78, aptitude: 76, reasoning: 75 },
    { month: "Jun", coding: 80, aptitude: 78, reasoning: 76 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Analytics"
        description="Deep dive into comprehensive performance analytics and trends."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Average Performance" value="74.2%" change="+2.1%" changeType="positive" />
        <StatCard title="Median Score" value="76.0%" />
        <StatCard title="Students Improving" value="185" change="68% of cohort" changeType="positive" />
        <StatCard title="Students Declining" value="24" change="-5 this month" changeType="positive" />
        <StatCard title="Completion %" value="92%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>Number of students in each performance tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}} 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skill Progression Over Time</CardTitle>
            <CardDescription>Average cohort scores across different domains</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendLineChart 
              data={monthlyTrends}
              lines={[
                { key: "coding", color: "#3b82f6", name: "Coding" },
                { key: "aptitude", color: "#10b981", name: "Aptitude" },
                { key: "reasoning", color: "#f59e0b", name: "Reasoning" }
              ]}
              height={300}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
