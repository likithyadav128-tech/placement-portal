"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockStudents } from "@/data/mock/students";
import { AlertTriangle, Send, Eye, TrendingDown, ArrowUpRight, Clock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function AttentionPage() {
  const [activeTab, setActiveTab] = useState("critical");
  const [sentList, setSentList] = useState<Record<string, boolean>>({});

  const handleSend = (studentId: string) => {
    setSentList(prev => ({ ...prev, [studentId]: true }));
  };

  // Categorize students
  const critical = mockStudents.filter(s => s.overallScore < 50);
  const needsAttention = mockStudents.filter(s => s.overallScore >= 50 && s.overallScore < 60);
  const monitoring = mockStudents.filter(s => s.overallScore >= 60 && s.overallScore < 70 && s.trend === "declining");
  const improving = mockStudents.filter(s => s.overallScore < 65 && s.trend === "improving");

  const getStudentCards = (students: typeof mockStudents, badgeColor: string, defaultAction: string) => {
    if (students.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 font-medium">No students in this category.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {students.map(student => (
          <Card key={student.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className={`h-1 w-full ${badgeColor}`} />
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-slate-100 text-slate-700">
                      {student.name.substring(0,2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-slate-900">{student.name}</h3>
                    <p className="text-xs text-slate-500">{student.rollNumber} • {student.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold">{student.overallScore}%</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>{student.trend === 'declining' ? 'Declining performance trend' : 'Consistently low scores'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span>Last active: {new Date(student.lastActivity).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/faculty/students/${student.id}`}>
                    <Eye className="w-4 h-4 mr-2" /> View Profile
                  </Link>
                </Button>
                <Button 
                  size="sm" 
                  variant={sentList[student.id] ? "secondary" : "default"}
                  className="flex-1"
                  onClick={() => handleSend(student.id)}
                  disabled={sentList[student.id]}
                >
                  {sentList[student.id] ? (
                    <span className="text-emerald-700 font-medium">Sent ✓</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> {defaultAction}
                    </>
                  )}
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
        description="Monitor and intervene for students who are struggling or declining in performance."
      />

      <Tabs defaultValue="critical" onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="critical" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-sm px-4">
            Critical ({critical.length})
          </TabsTrigger>
          <TabsTrigger value="attention" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm px-4">
            Needs Attention ({needsAttention.length})
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm px-4">
            Monitoring ({monitoring.length})
          </TabsTrigger>
          <TabsTrigger value="improving" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm px-4">
            Improving ({improving.length})
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="critical" className="m-0 focus-visible:outline-none">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Critical Priority</h2>
              <p className="text-sm text-slate-500">Students scoring below 50%. Immediate intervention recommended.</p>
            </div>
            {getStudentCards(critical, "bg-rose-500", "Schedule Meeting")}
          </TabsContent>
          
          <TabsContent value="attention" className="m-0 focus-visible:outline-none">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Needs Attention</h2>
              <p className="text-sm text-slate-500">Students scoring between 50-60%. Targeted practice recommended.</p>
            </div>
            {getStudentCards(needsAttention, "bg-amber-500", "Send Reminder")}
          </TabsContent>
          
          <TabsContent value="monitoring" className="m-0 focus-visible:outline-none">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Monitoring</h2>
              <p className="text-sm text-slate-500">Students with declining trends but scores still above 60%.</p>
            </div>
            {getStudentCards(monitoring, "bg-blue-500", "Check-in Message")}
          </TabsContent>

          <TabsContent value="improving" className="m-0 focus-visible:outline-none">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Improving</h2>
              <p className="text-sm text-slate-500">Previously struggling students who are showing upward trends.</p>
            </div>
            {getStudentCards(improving, "bg-emerald-500", "Send Encouragement")}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
