"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCheck, Shield } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/feedback/states";

interface FacultyItem {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  employeeId: string;
  department: string;
  designation: string;
  studentsAssigned: number;
  status: string;
  lastActive: string;
}

export default function FacultyManagementPage() {
  const [faculty, setFaculty] = useState<FacultyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState("All");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/management/faculty");
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed to load faculty directory");
      }
      const data = (await res.json()) as { faculty?: FacultyItem[] };
      setFaculty(data.faculty || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading faculty");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const departments = ["All", ...Array.from(new Set(faculty.map((f) => f.department)))];

  const filteredFaculty = faculty.filter((f) =>
    deptFilter === "All" ? true : f.department === deptFilter
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading faculty directory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load faculty"
        message={error}
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Faculty Management"
        description="Monitor staff assignments, departmental distribution, and platform permissions"
      >
        <Button variant="outline" asChild className="gap-2">
          <Link href="/management/permissions">
            <Shield className="w-4 h-4" /> Manage Permissions
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
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
            <span className="text-sm text-slate-500">
              Total Appointed: {faculty.length}
            </span>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="p-3">Faculty Member</th>
                  <th className="p-3">Employee ID</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3 text-center">Assigned Students</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFaculty.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <UserCheck className="w-8 h-8 text-slate-300" />
                        <p className="font-medium text-slate-700">No faculty records found</p>
                        <p className="text-xs text-slate-400">
                          {faculty.length === 0
                            ? "No faculty members are currently provisioned in PostgreSQL."
                            : "No faculty match the selected department."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredFaculty.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-semibold">
                              {f.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900">{f.name}</p>
                            <p className="text-xs text-slate-500">{f.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 font-mono text-xs">{f.employeeId}</td>
                      <td className="p-3 text-slate-600">{f.department}</td>
                      <td className="p-3 text-slate-600">{f.designation}</td>
                      <td className="p-3 text-center font-medium text-slate-900">
                        {f.studentsAssigned}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="secondary" className="capitalize">
                          {f.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
