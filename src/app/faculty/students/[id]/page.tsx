"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, Calendar, BookOpen, GraduationCap, Code, Lightbulb, MessageSquare, Brain } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { mockStudents } from "@/data/mock/students";
import { mockPerformanceHistory } from "@/data/mock/performance";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TrendLineChart } from "@/components/charts";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/feedback/states";

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const student = mockStudents.find(
    s => s.id === studentId || s.rollNumber.toLowerCase() === studentId?.toLowerCase()
  );
  
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  if (!student) {
    return <ErrorState title="Student Not Found" message="The requested student could not be located." onRetry={() => router.push('/faculty/students')} />;
  }

  const performanceData = mockPerformanceHistory[studentId] || mockPerformanceHistory["STU001"]; // Fallback if no specific data
  const weakAreas = [
    { name: "Coding", score: student.codingScore },
    { name: "Aptitude", score: student.aptitudeScore },
    { name: "Reasoning", score: student.reasoningScore },
    { name: "Communication", score: student.communicationScore }
  ].filter(s => s.score < 60);

  const handleSaveNote = () => {
    setSavingNote(true);
    setTimeout(() => {
      setSavingNote(false);
      setNote("");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <PageHeader title="Student Profile" />
      </div>

      {/* Header Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="h-24 w-24 border-4 border-slate-50">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-3xl">
                {student.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">{student.name}</h2>
                <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className={student.status === 'active' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : ''}>
                  {student.status.toUpperCase()}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" /> {student.rollNumber}</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-slate-400" /> {student.department}</span>
                <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-slate-400" /> {student.year}</span>
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" /> {student.email}</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {student.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="bg-slate-50 text-slate-700">{skill}</Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 bg-blue-50 p-4 rounded-xl border border-blue-100">
              <span className="text-sm font-medium text-blue-800">Placement Readiness</span>
              <span className="text-3xl font-bold text-blue-900">{student.placementReadiness}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Scores */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Overall", score: student.overallScore, color: "bg-blue-600", icon: <User /> },
          { label: "Coding", score: student.codingScore, color: "bg-indigo-600", icon: <Code /> },
          { label: "Aptitude", score: student.aptitudeScore, color: "bg-emerald-600", icon: <Lightbulb /> },
          { label: "Reasoning", score: student.reasoningScore, color: "bg-amber-500", icon: <Brain /> },
          { label: "Communication", score: student.communicationScore, color: "bg-purple-500", icon: <MessageSquare /> }
        ].map((skill, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                <span className="w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">{skill.icon}</span>
                {skill.label}
              </span>
              <span className="text-2xl font-bold">{skill.score}%</span>
              <Progress value={skill.score} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance History</CardTitle>
              <CardDescription>Overall progression over time</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendLineChart 
                data={performanceData as unknown as Record<string, unknown>[]} 
                lines={[{ key: "overall", color: "#3b82f6", name: "Overall Score" }]} 
                height={300}
              />
            </CardContent>
          </Card>

          {/* Assessment History Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Assessment</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[1, 2, 3].map((_, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500">Aug 15, 2026</td>
                        <td className="px-4 py-3 font-medium text-slate-900">Mock Test {i + 1}</td>
                        <td className="px-4 py-3"><Badge variant="secondary">Mixed</Badge></td>
                        <td className="px-4 py-3 text-right font-medium">{student.overallScore - i * 2}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Weak Areas */}
          <Card>
            <CardHeader>
              <CardTitle>Areas Needing Attention</CardTitle>
            </CardHeader>
            <CardContent>
              {weakAreas.length > 0 ? (
                <div className="space-y-4">
                  {weakAreas.map((area, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-slate-700">{area.name}</span>
                        <span className="text-rose-600">{area.score}%</span>
                      </div>
                      <Progress value={area.score} className="h-2 bg-rose-100" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-emerald-600 bg-emerald-50 rounded-lg">
                  <p className="font-medium">No critical weak areas.</p>
                  <p className="text-sm mt-1">Student is performing well across all skills.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Roadmap Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Roadmap Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Foundation</span>
                  <span className="text-emerald-600 font-medium">Completed</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Advanced Algorithms</span>
                  <span className="text-blue-600 font-medium">In Progress</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Mock Interviews</span>
                  <span className="text-slate-400 font-medium">Upcoming</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Faculty Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Faculty Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Add a note about the student's progress..." 
                className="resize-none h-24"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button className="w-full" onClick={handleSaveNote} disabled={!note || savingNote}>
                {savingNote ? "Saving..." : "Save Note"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
