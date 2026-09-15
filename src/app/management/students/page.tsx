"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Download, Users } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/feedback/states";

interface ManagementStudent {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  rollNumber: string;
  department: string;
  year: string;
  overallScore: number;
  placementReadiness: number;
  status: string;
  lastActivity: string;
}

export default function StudentsManagementPage() {
  const [students, setStudents] = useState<ManagementStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [tierFilter, setTierFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/management/students");
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed to load students directory");
      }
      const data = (await res.json()) as { students?: ManagementStudent[] };
      setStudents(data.students || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading students");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const departments = useMemo(() => {
    return ["All", ...Array.from(new Set(students.map((s) => s.department)))];
  }, [students]);

  const years = useMemo(() => {
    return ["All", ...Array.from(new Set(students.map((s) => s.year)))];
  }, [students]);

  const filteredStudents = useMemo(() => {
    let result = students;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          s.rollNumber.toLowerCase().includes(lower)
      );
    }

    if (deptFilter !== "All") result = result.filter((s) => s.department === deptFilter);
    if (yearFilter !== "All") result = result.filter((s) => s.year === yearFilter);
    if (statusFilter !== "All") result = result.filter((s) => s.status.toLowerCase() === statusFilter.toLowerCase());

    if (tierFilter !== "All") {
      if (tierFilter === "Above 75%") result = result.filter((s) => s.placementReadiness > 75);
      else if (tierFilter === "50-75%") result = result.filter((s) => s.placementReadiness >= 50 && s.placementReadiness <= 75);
      else if (tierFilter === "Below 50%") result = result.filter((s) => s.placementReadiness < 50);
    }

    return result;
  }, [students, searchTerm, deptFilter, yearFilter, tierFilter, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading institutional student directory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load directory"
        message={error}
        onRetry={loadStudents}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Enterprise Student Directory"
        description="Comprehensive view and oversight of all enrolled students in the portal"
      >
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export All
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or roll number..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <select
                className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d === "All" ? "All Departments" : d}
                  </option>
                ))}
              </select>
              <select
                className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y === "All" ? "All Years" : y}
                  </option>
                ))}
              </select>
              <select
                className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
              >
                <option value="All">All Tiers</option>
                <option value="Above 75%">Above 75%</option>
                <option value="50-75%">50-75%</option>
                <option value="Below 50%">Below 50%</option>
              </select>
            </div>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="p-3">Student</th>
                  <th className="p-3">Roll Number</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Year</th>
                  <th className="p-3 text-center">Score</th>
                  <th className="p-3 text-center">Readiness</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <p className="font-medium text-slate-700">No students found</p>
                        <p className="text-xs text-slate-400">
                          {students.length === 0
                            ? "No student records found in PostgreSQL."
                            : "No students match the current filters."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                              {student.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900">{student.name}</p>
                            <p className="text-xs text-slate-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">{student.rollNumber}</td>
                      <td className="p-3 text-slate-600">{student.department}</td>
                      <td className="p-3 text-slate-600">{student.year}</td>
                      <td className="p-3 text-center font-medium text-slate-900">
                        {student.overallScore}%
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={student.placementReadiness >= 75 ? "success" : "secondary"}
                        >
                          {student.placementReadiness}%
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="secondary" className="capitalize">
                          {student.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
            <span>Showing {filteredStudents.length} of {students.length} students</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
