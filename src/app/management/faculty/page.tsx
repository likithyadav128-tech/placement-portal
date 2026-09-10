"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SimpleSelect } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, MoreVertical, Shield } from 'lucide-react';
import { mockFaculty } from '@/data/mock/faculty';
import Link from 'next/link';

export default function FacultyManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFaculty = mockFaculty?.filter((f: any) => 
    f.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.department?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Faculty Management" 
        description="Manage faculty members and their portal access"
      >
        <Button className="gap-2">Add Faculty</Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search faculty..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <SimpleSelect placeholder="Department" options={[{label: 'CS', value: 'CS'}, {label: 'IT', value: 'IT'}]} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="p-4">Faculty</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Students Assigned</th>
                  <th className="p-4">Permissions</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Active</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFaculty.map((faculty: any) => (
                  <tr key={faculty.id} className="border-b hover:bg-slate-50">
                    <td className="p-4 flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{faculty.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{faculty.name}</span>
                    </td>
                    <td className="p-4">{faculty.department}</td>
                    <td className="p-4">{faculty.studentsAssigned || 0}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Shield className="w-3 h-3" />
                        <span>{faculty.permissionsCount || 0} rules</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={faculty.status === 'active' ? 'default' : 'secondary'}>{faculty.status || 'Active'}</Badge>
                    </td>
                    <td className="p-4 text-slate-500">{faculty.lastActive || '2 hours ago'}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Link href={`/management/permissions`}>
                          <Button variant="ghost" size="sm" className="text-blue-600">Manage Permissions</Button>
                        </Link>
                        <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
