"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockAssessments } from "@/data/mock/assessments";
import { StatCard } from "@/components/charts";
import { Clock, Users, Target, FileText, Plus, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AssessmentsPage() {
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeCount = mockAssessments.filter(a => a.status === "in_progress" || a.status === "upcoming").length;
  const avgScore = mockAssessments.reduce((acc, curr) => acc + (curr.averageScore || 0), 0) / mockAssessments.filter(a => a.averageScore).length;

  const filteredAssessments = mockAssessments.filter(a => {
    if (typeFilter !== "All" && a.type !== typeFilter.toLowerCase()) return false;
    if (statusFilter !== "All" && a.status !== statusFilter.toLowerCase()) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'upcoming': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'expired': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case 'easy': return 'text-emerald-600 bg-emerald-50';
      case 'medium': return 'text-blue-600 bg-blue-50';
      case 'hard': return 'text-rose-600 bg-rose-50';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Assessment Monitoring"
          description="Manage and track all technical and aptitude assessments."
        />
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Create Assessment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Assessments" value={mockAssessments.length.toString()} icon={<FileText className="w-5 h-5"/>} />
        <StatCard title="Active / Upcoming" value={activeCount.toString()} icon={<Clock className="w-5 h-5"/>} />
        <StatCard title="Avg Score" value={`${Math.round(avgScore)}%`} icon={<Target className="w-5 h-5"/>} />
        <StatCard title="Total Participants" value="2,450" icon={<Users className="w-5 h-5"/>} />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 mb-6">
            <select className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="All">All Types</option>
              <option value="Coding">Coding</option>
              <option value="Aptitude">Aptitude</option>
              <option value="Mixed">Mixed</option>
            </select>
            <select className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In_progress">In Progress</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Expired">Expired</option>
            </select>
            <Input placeholder="Search assessments..." className="max-w-xs ml-auto" />
          </div>

          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Participants</th>
                  <th className="px-4 py-3">Avg Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAssessments.map((assessment) => (
                  <React.Fragment key={assessment.id}>
                    <tr 
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${expandedId === assessment.id ? 'bg-blue-50/50' : ''}`}
                      onClick={() => setExpandedId(expandedId === assessment.id ? null : assessment.id)}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">{assessment.title}</td>
                      <td className="px-4 py-3 capitalize">{assessment.type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getDifficultyColor(assessment.difficulty)}`}>
                          {assessment.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{assessment.duration}m</td>
                      <td className="px-4 py-3 text-slate-600">{assessment.participants || 0}</td>
                      <td className="px-4 py-3 font-medium">
                        {assessment.averageScore ? `${assessment.averageScore}%` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`capitalize ${getStatusColor(assessment.status)}`}>
                          {assessment.status.replace('-', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedId === assessment.id ? 'rotate-180' : ''}`} />
                      </td>
                    </tr>
                    {expandedId === assessment.id && (
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-3 gap-6 text-sm">
                            <div>
                              <p className="text-slate-500 mb-1">Description</p>
                              <p className="text-slate-700">{assessment.description || "No description provided."}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 mb-1">Questions Breakdown</p>
                              <p className="text-slate-700">Total: {assessment.totalQuestions} questions</p>
                            </div>
                            <div className="flex flex-col gap-2 justify-center">
                              <Button size="sm" variant="outline">View Leaderboard</Button>
                              <Button size="sm">Manage Assessment</Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
