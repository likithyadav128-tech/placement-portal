"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SimpleSelect } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, Download } from 'lucide-react';
import { mockAuditLogs } from '@/data/mock/audit-logs';

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = mockAuditLogs?.filter((log) => 
    log.actor?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="System Audit Logs" 
        description="Track all administrative actions and system events"
      >
        <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Export Logs</Button>
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
              <Input type="date" className="w-full md:w-auto" />
              <SimpleSelect placeholder="Role" options={[{label: 'Admin', value: 'admin'}, {label: 'Faculty', value: 'faculty'}]} />
              <SimpleSelect placeholder="Status" options={[{label: 'Success', value: 'success'}, {label: 'Failed', value: 'failed'}]} />
            </div>
          </div>

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
                {filteredLogs.map((log, idx) => (
                  <tr key={log.id || idx} className="border-b hover:bg-slate-50">
                    <td className="p-4 text-slate-600 whitespace-nowrap">
                      {new Date(log.date || "2026-09-09").toLocaleString()}
                    </td>
                    <td className="p-4 font-medium">{log.actor}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-[10px] uppercase">{log.role || 'MANAGEMENT'}</Badge>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{log.action}</td>
                    <td className="p-4 text-slate-500 truncate max-w-xs">{log.target}</td>
                    <td className="px-4 py-3">
                      <Badge variant={log.status === 'success' ? 'default' : log.status === 'failed' ? 'danger' : 'secondary'}>
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
            <span>Showing {filteredLogs.length} of {mockAuditLogs?.length || 0} entries</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
