"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SimpleSelect } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, Filter, MoreVertical, Download, UserX } from 'lucide-react';
import { mockStudents } from '@/data/mock/students';

export default function StudentsManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(mockStudents.map((s: any) => s.id));
    else setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredStudents = mockStudents?.filter((s: any) => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Enterprise Student Directory" 
        description="Manage and monitor all student profiles"
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
            <div className="flex items-center gap-2 w-full md:w-auto">
              <SimpleSelect placeholder="Department" options={[{label: 'CS', value: 'CS'}, {label: 'IT', value: 'IT'}]} />
              <SimpleSelect placeholder="Year" options={[{label: '3rd Year', value: '3'}, {label: '4th Year', value: '4'}]} />
              <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg flex items-center justify-between mb-4 border border-blue-100">
              <span className="text-sm font-medium">{selectedIds.length} students selected</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="bg-white">Export Selected</Button>
                <Button size="sm" variant="destructive" onClick={() => setIsDeactivateDialogOpen(true)}>
                  <UserX className="w-4 h-4 mr-2" /> Deactivate
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="p-4"><Checkbox checked={selectedIds.length === mockStudents.length && mockStudents.length > 0} onCheckedChange={toggleSelectAll} /></th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Roll Number</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Year</th>
                  <th className="p-4">Overall Score</th>
                  <th className="p-4">Readiness</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student: any) => (
                  <tr key={student.id} className="border-b hover:bg-slate-50">
                    <td className="p-4">
                      <Checkbox checked={selectedIds.includes(student.id)} onCheckedChange={() => toggleSelect(student.id)} />
                    </td>
                    <td className="p-4 flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{student.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.name}</span>
                    </td>
                    <td className="p-4">{student.rollNumber}</td>
                    <td className="p-4">{student.department}</td>
                    <td className="p-4">{student.year}</td>
                    <td className="p-4 font-semibold">{student.overallScore}%</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600" style={{width: `${student.placementReadiness}%`}} />
                        </div>
                        <span className="text-xs">{student.placementReadiness}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>{student.status}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deactivation</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {selectedIds.length} selected students? They will lose access to the portal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeactivateDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => setIsDeactivateDialogOpen(false)}>Deactivate Students</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
