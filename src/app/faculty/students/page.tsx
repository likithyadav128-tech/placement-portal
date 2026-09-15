"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Search, ArrowUpRight, ArrowDownRight, Minus, ChevronRight, ArrowUpDown, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/feedback/states";

interface FacultyStudent {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  rollNumber: string;
  department: string;
  year: string;
  overallScore: number;
  codingScore: number;
  aptitudeScore: number;
  reasoningScore: number;
  communicationScore: number;
  placementReadiness: number;
  trend: string;
  status: string;
  lastActivity: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<FacultyStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [tierFilter, setTierFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [sortConfig, setSortConfig] = useState<{ key: keyof FacultyStudent; direction: "asc" | "desc" } | null>(null);

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/faculty/students");
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed to load assigned students");
      }
      const data = (await res.json()) as { students?: FacultyStudent[] };
      setStudents(data.students || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load students");
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

  const handleSort = (key: keyof FacultyStudent) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredStudents = useMemo(() => {
    let result = students;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(lowerSearch) ||
          s.rollNumber.toLowerCase().includes(lowerSearch)
      );
    }

    if (deptFilter !== "All") result = result.filter((s) => s.department === deptFilter);
    if (yearFilter !== "All") result = result.filter((s) => s.year === yearFilter);
    if (statusFilter !== "All") result = result.filter((s) => s.status.toLowerCase() === statusFilter.toLowerCase());

    if (tierFilter !== "All") {
      if (tierFilter === "Above 75%") result = result.filter((s) => s.overallScore > 75);
      else if (tierFilter === "50-75%") result = result.filter((s) => s.overallScore >= 50 && s.overallScore <= 75);
      else if (tierFilter === "Below 50%") result = result.filter((s) => s.overallScore < 50);
    }

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [students, searchTerm, deptFilter, yearFilter, tierFilter, statusFilter, sortConfig]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading student cohort...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load students"
        message={error}
        onRetry={loadStudents}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Directory"
        description="View and monitor your assigned student cohort."
      />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or roll number..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
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
                <option value="All">All Performance</option>
                <option value="Above 75%">Above 75%</option>
                <option value="50-75%">50-75%</option>
                <option value="Below 50%">Below 50%</option>
              </select>
              <select
                className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                <tr>
                  <th
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Student <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort("department")}
                  >
                    <div className="flex items-center gap-1">
                      Department <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100 text-center"
                    onClick={() => handleSort("overallScore")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Overall <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center">Coding</th>
                  <th className="px-4 py-3 text-center">Aptitude</th>
                  <th className="px-4 py-3 text-center">Trend</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <p className="font-medium text-slate-700">No students found</p>
                        <p className="text-xs text-slate-400">
                          {students.length === 0
                            ? "No students have been assigned to your cohort in PostgreSQL yet."
                            : "No students match the selected filter criteria."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                              {student.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-slate-900">
                              {student.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {student.rollNumber} • {student.year}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {student.department}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        <span
                          className={
                            student.overallScore >= 75
                              ? "text-emerald-600"
                              : student.overallScore >= 50
                              ? "text-blue-600"
                              : "text-rose-600"
                          }
                        >
                          {student.overallScore}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {student.codingScore}%
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {student.aptitudeScore}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          {student.trend === "declining" ? (
                            <ArrowDownRight className="w-4 h-4 text-rose-500" />
                          ) : student.trend === "improving" ? (
                            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Minus className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant="secondary"
                          className={
                            student.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }
                        >
                          {student.status.charAt(0).toUpperCase() +
                            student.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Link href={`/faculty/students/${student.id}`}>
                            View
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-500 pt-4">
            <p>
              Showing {filteredStudents.length} of {students.length} assigned students
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
