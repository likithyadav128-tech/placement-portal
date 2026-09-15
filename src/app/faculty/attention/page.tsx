"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertTriangle, Send, Eye, TrendingDown, ArrowUpRight, Clock, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState, ErrorState } from "@/components/feedback/states";

interface AttentionStudent {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  department: string;
  overallScore: number;
  trend: string;
  reason: string;
  lastActivity: string;
  skills: string[];
}

interface AttentionResponse {
  critical: AttentionStudent[];
  needsAttention: AttentionStudent[];
  monitoring: AttentionStudent[];
  improving: AttentionStudent[];
  totalNeedingAttention: number;
}

export default function AttentionPage() {
  const [data, setData] = useState<AttentionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("critical");
  const [sentList, setSentList] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/faculty/attention");
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed to load students needing attention");
      }
      const json = (await res.json()) as AttentionResponse;
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSend = (studentId: string) => {
    setSentList((prev) => ({ ...prev, [studentId]: true }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading attention categories...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Unable to load attention list"
        message={error || "An unexpected error occurred while fetching student data."}
        onRetry={loadData}
      />
    );
  }

  const getStudentCards = (
    students: AttentionStudent[],
    badgeColor: string,
    defaultAction: string
  ) => {
    if (students.length === 0) {
      return (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No students in this tier"
          description="None of your assigned students currently meet the criteria for this category."
          className="py-12"
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {students.map((student) => (
          <Card
            key={student.id}
            className="overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className={`h-1 w-full ${badgeColor}`} />
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-slate-100 text-slate-700">
                      {student.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-slate-900">{student.name}</h3>
                    <p className="text-xs text-slate-500">
                      {student.rollNumber} • {student.department}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold">{student.overallScore}%</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="font-normal text-slate-600">
                    {student.reason}
                  </Badge>
                  {student.trend === "declining" && (
                    <span className="flex items-center text-rose-600">
                      <TrendingDown className="w-3.5 h-3.5 mr-1" /> Declining
                    </span>
                  )}
                  {student.trend === "improving" && (
                    <span className="flex items-center text-emerald-600">
                      <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> Improving
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Last active: {new Date(student.lastActivity).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/faculty/students/${student.id}`}>
                    <Eye className="w-3.5 h-3.5 mr-1.5" /> View Profile
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSend(student.id)}
                  disabled={sentList[student.id]}
                  className="flex-1 text-slate-700"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {sentList[student.id] ? "Sent" : defaultAction}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students Needing Attention"
        description="Monitor students requiring academic intervention and follow-up based on benchmark scores."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="critical" className="gap-2">
            Critical ({data.critical.length})
          </TabsTrigger>
          <TabsTrigger value="needs_attention" className="gap-2">
            Developing ({data.needsAttention.length})
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="gap-2">
            Monitoring ({data.monitoring.length})
          </TabsTrigger>
          <TabsTrigger value="improving" className="gap-2">
            Improving ({data.improving.length})
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="critical">
            {getStudentCards(data.critical, "bg-rose-500", "Send Alert")}
          </TabsContent>
          <TabsContent value="needs_attention">
            {getStudentCards(data.needsAttention, "bg-amber-500", "Remind")}
          </TabsContent>
          <TabsContent value="monitoring">
            {getStudentCards(data.monitoring, "bg-blue-500", "Follow Up")}
          </TabsContent>
          <TabsContent value="improving">
            {getStudentCards(data.improving, "bg-emerald-500", "Encourage")}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
