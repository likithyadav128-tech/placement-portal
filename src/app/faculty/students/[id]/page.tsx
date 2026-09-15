"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  BookOpen,
  GraduationCap,
  Code,
  Lightbulb,
  MessageSquare,
  Brain,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TrendLineChart } from "@/components/charts";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState, EmptyState } from "@/components/feedback/states";

interface StudentProfileResponse {
  student: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    rollNumber: string;
    department: string;
    year: string;
    skills: string[];
    placementReadiness: number;
    overallScore: number;
    codingScore: number;
    aptitudeScore: number;
    reasoningScore: number;
    communicationScore: number;
    trend: string;
    status: string;
    lastActivity: string;
  };
  performanceHistory: Array<{
    id: string;
    title: string;
    skillArea: string;
    score: number;
    maxScore: number;
    percentage: number;
    month: string;
    completedAt: string;
  }>;
  assessmentHistory: Array<{
    id: string;
    title: string;
    type: string;
    duration: number;
    score: number | null;
    submittedAt: string | null;
    status: string;
  }>;
  notes: Array<{
    id: string;
    note: string;
    createdAt: string;
  }>;
}

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [data, setData] = useState<StudentProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const loadStudent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsForbidden(false);
    try {
      const res = await fetch(`/api/faculty/students/${studentId}`);
      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.status === 403) {
          setIsForbidden(true);
          throw new Error(errJson.error || "Access denied. You are not assigned to this student.");
        }
        if (res.status === 404) {
          throw new Error("The requested student could not be located in the database.");
        }
        throw new Error(errJson.error || "Failed to load student profile");
      }
      const json = (await res.json()) as StudentProfileResponse;
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading student");
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  const handleSaveNote = () => {
    setSavingNote(true);
    setTimeout(() => {
      setSavingNote(false);
      setNote("");
    }, 800);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (isForbidden) {
    return (
      <ErrorState
        title="Unauthorized Student Access"
        message={error || "You do not have permission to view this student because they are not assigned to your cohort."}
        onRetry={() => router.push("/faculty/students")}
      />
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Student Not Found"
        message={error || "The requested student could not be located."}
        onRetry={() => router.push("/faculty/students")}
      />
    );
  }

  const { student, performanceHistory, assessmentHistory } = data;

  const weakAreas = [
    { name: "Coding", score: student.codingScore },
    { name: "Aptitude", score: student.aptitudeScore },
    { name: "Reasoning", score: student.reasoningScore },
    { name: "Communication", score: student.communicationScore },
  ].filter((s) => s.score < 60);

  const chartData = performanceHistory.map((p) => ({
    month: p.month || new Date(p.completedAt).toLocaleDateString("en-US", { month: "short" }),
    overall: p.percentage,
  }));

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
                <Badge
                  variant={student.status === "active" ? "default" : "secondary"}
                  className={
                    student.status === "active"
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : ""
                  }
                >
                  {student.status.toUpperCase()}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" /> {student.rollNumber}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-slate-400" /> {student.department}
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-slate-400" /> {student.year}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-400" /> {student.email}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {student.skills.map((skill, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="bg-slate-50 text-slate-700"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 bg-blue-50 p-4 rounded-xl border border-blue-100">
              <span className="text-sm font-medium text-blue-800">Placement Readiness</span>
              <span className="text-3xl font-bold text-blue-900">
                {student.placementReadiness}%
              </span>
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
          { label: "Communication", score: student.communicationScore, color: "bg-purple-500", icon: <MessageSquare /> },
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
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <TrendLineChart
                  data={chartData}
                  lines={[{ key: "overall", color: "#3b82f6", name: "Score" }]}
                  height={300}
                />
              ) : (
                <EmptyState
                  title="No performance records"
                  description="Completed evaluation milestones will appear here."
                  className="h-[250px]"
                />
              )}
            </CardContent>
          </Card>

          {/* Assessment History Table */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {assessmentHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                      <tr>
                        <th className="px-4 py-2">Assessment</th>
                        <th className="px-4 py-2">Type</th>
                        <th className="px-4 py-2">Duration</th>
                        <th className="px-4 py-2 text-right">Score</th>
                        <th className="px-4 py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {assessmentHistory.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{a.title}</td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="capitalize">{a.type}</Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{a.duration} mins</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {a.score !== null ? `${a.score}%` : "Legacy Submission"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Badge variant="success">Completed</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No completed assessments"
                  description="This student has not submitted any assessments yet."
                  className="h-[180px]"
                />
              )}
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
                  <p className="text-sm mt-1">Student is performing at or above benchmark levels.</p>
                </div>
              )}
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
              <Button
                className="w-full"
                onClick={handleSaveNote}
                disabled={!note || savingNote}
              >
                {savingNote ? "Saving..." : "Save Note"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
