"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertCircle, Save } from 'lucide-react';
import { mockFaculty } from '@/data/mock/faculty';

export default function PermissionsManagementPage() {
  const [selectedFacultyId, setSelectedFacultyId] = useState(mockFaculty?.[0]?.id || '1');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const permissionCategories = [
    {
      category: 'Student Management',
      items: [
        { id: 'view_students', label: 'View Students', desc: 'Can view student profiles and directories' },
        { id: 'manage_students', label: 'Manage Students', desc: 'Can edit, add, or deactivate students', isSensitive: true },
        { id: 'view_performance', label: 'View Performance', desc: 'Can view student performance metrics' }
      ]
    },
    {
      category: 'Assessments & Tests',
      items: [
        { id: 'create_assessments', label: 'Create Assessments', desc: 'Can author new assessments and tests' },
        { id: 'edit_assessments', label: 'Edit Assessments', desc: 'Can modify existing assessments' },
        { id: 'publish_assessments', label: 'Publish Assessments', desc: 'Can publish assessments to students', isSensitive: true }
      ]
    },
    {
      category: 'Analytics & Reporting',
      items: [
        { id: 'view_reports', label: 'View Reports', desc: 'Can access and view all reports' },
        { id: 'export_data', label: 'Export Data', desc: 'Can export platform data to CSV/PDF', isSensitive: true }
      ]
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Role-Based Access Control" 
        description="Manage faculty permissions and platform access"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-base">Faculty Members</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {mockFaculty?.map((faculty: any) => (
                <div 
                  key={faculty.id} 
                  className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedFacultyId === faculty.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                  onClick={() => setSelectedFacultyId(faculty.id)}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{faculty.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{faculty.name}</p>
                    <p className="text-xs text-slate-500 truncate">{faculty.department}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>Configure access rights for the selected faculty member</CardDescription>
            </div>
            <Button className="gap-2" onClick={handleSave}>
              <Save className="w-4 h-4" /> 
              {isSaved ? "Saved ✓" : "Save Changes"}
            </Button>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <strong>Warning:</strong> Modifying sensitive permissions (marked with a red badge) can significantly alter the faculty member's control over the platform and student data.
              </div>
            </div>

            {permissionCategories.map((category, idx) => (
              <div key={idx} className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">{category.category}</h3>
                <div className="grid gap-4">
                  {category.items.map(item => (
                    <div key={item.id} className="flex items-start justify-between p-3 rounded-lg border bg-slate-50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <label className="font-medium text-sm">{item.label}</label>
                          {item.isSensitive && <Badge variant="destructive" className="text-[10px] px-1 h-4">Sensitive</Badge>}
                        </div>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <Switch defaultChecked={!item.isSensitive} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
