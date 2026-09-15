"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SimpleSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Download } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/feedback/states";

interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  status: string;
  details: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (roleFilter && roleFilter !== "All") params.set("role", roleFilter);
      if (statusFilter && statusFilter !== "All") params.set("status", statusFilter);

      const res = await fetch(`/api/management/audit-logs?${params.toString()}`);
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed to load audit logs");
      }
      const data = (await res.json()) as { logs?: AuditLogItem[] };
      setLogs(data.logs || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading audit logs");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="System Audit Logs"
        description="Track all administrative actions and system security events"
      >
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export Logs
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by actor, action, or target..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <SimpleSelect
                placeholder="Role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={[
                  { label: "All Roles", value: "All" },
                  { label: "Management", value: "MANAGEMENT" },
                  { label: "Faculty", value: "FACULTY" },
                  { label: "Student", value: "STUDENT" },
                ]}
              />
              <SimpleSelect
                placeholder="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { label: "All Statuses", value: "All" },
                  { label: "Success", value: "SUCCESS" },
                  { label: "Failed", value: "FAILED" },
                ]}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500 font-medium">Loading audit trail...</p>
              </div>
            </div>
          ) : error ? (
            <ErrorState
              title="Unable to load audit logs"
              message={error}
              onRetry={fetchLogs}
            />
          ) : logs.length === 0 ? (
            <EmptyState
              title="No audit logs found"
              description="No administrative or security events match the current filter criteria."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Actor</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Target</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-slate-50">
                      <td className="p-4 text-slate-600 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 font-medium">{log.actor}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {log.role}
                        </Badge>
                      </td>
                      <td className="p-4 font-medium text-slate-700">{log.action}</td>
                      <td className="p-4 text-slate-500 truncate max-w-xs">{log.target}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            log.status.toLowerCase() === "success"
                              ? "default"
                              : log.status.toLowerCase() === "failed"
                              ? "danger"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {log.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
            <span>Showing {logs.length} logged events</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={logs.length < 100}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
