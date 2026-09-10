"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleSelect } from '@/components/ui/select';
import { ComparisonBarChart } from '@/components/charts';
import { Download, FileBarChart, PieChart, TrendingUp, Users } from 'lucide-react';
import { mockReports } from '@/data/mock/reports';

export default function ReportsManagementPage() {
  const reportCategories = [
    { title: 'Student Performance', desc: 'Detailed analysis of individual student metrics', icon: <Users className="w-5 h-5 text-blue-500" /> },
    { title: 'Department Performance', desc: 'Comparative metrics across different branches', icon: <PieChart className="w-5 h-5 text-emerald-500" /> },
    { title: 'Assessment Analytics', desc: 'Question-level analysis and pass rates', icon: <FileBarChart className="w-5 h-5 text-purple-500" /> },
    { title: 'Placement Readiness', desc: 'Overall probability of successful placement', icon: <TrendingUp className="w-5 h-5 text-amber-500" /> }
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Report Center" 
        description="Generate and analyze placement performance reports"
      />

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <Input type="date" className="w-full md:w-auto" />
          <span className="text-sm text-slate-500">to</span>
          <Input type="date" className="w-full md:w-auto" />
          <SimpleSelect placeholder="Department" options={[{label: 'All Departments', value: 'all'}, {label: 'CS', value: 'cs'}]} />
          <SimpleSelect placeholder="Year" options={[{label: 'All Years', value: 'all'}, {label: '4th Year', value: '4'}]} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCategories.map((cat, i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center mb-2">
                {cat.icon}
              </div>
              <CardTitle className="text-base">{cat.title}</CardTitle>
              <CardDescription className="text-xs">{cat.desc}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-4">
              <div className="text-xs text-slate-500 mb-3">Last generated: {new Date().toLocaleDateString()}</div>
              <Button className="w-full gap-2" variant="outline">
                Generate Report
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Department Comparison Preview</CardTitle>
            <CardDescription>Sample data based on current filters</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> CSV</Button>
            <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> PDF</Button>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          <ComparisonBarChart 
            data={[
              { department: 'CS', averageScore: 82, placementReadiness: 88 },
              { department: 'IT', averageScore: 78, placementReadiness: 85 },
              { department: 'ECE', averageScore: 71, placementReadiness: 76 },
              { department: 'AI&DS', averageScore: 85, placementReadiness: 90 }
            ]}
            xKey="department"
            bars={[
              { key: 'averageScore', color: '#3b82f6', name: 'Average Score' },
              { key: 'placementReadiness', color: '#10b981', name: 'Placement Readiness' }
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
