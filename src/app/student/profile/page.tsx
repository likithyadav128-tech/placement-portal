"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, MapPin, Building, GraduationCap, Briefcase, FileText, Edit2 } from 'lucide-react';
import { mockStudents } from '@/data/mock/students';

export default function StudentProfile() {
  const student = mockStudents[0];
  const initials = student.name.split(' ').map(n => n[0]).join('');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader 
        title="Student Profile" 
        description="Manage your personal information, academic details, and career preferences."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4 border-4 border-white shadow-sm">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} />
                <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">{initials}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
              <p className="text-slate-500 font-medium mb-1">{student.id}</p>
              <Badge variant="secondary" className="mt-2 bg-blue-50 text-blue-700 hover:bg-blue-50">{student.department}</Badge>
              
              <div className="w-full mt-6 space-y-3">
                <div className="flex items-center text-sm text-slate-600">
                  <Mail className="h-4 w-4 mr-3 text-slate-400" />
                  {student.email}
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <GraduationCap className="h-4 w-4 mr-3 text-slate-400" />
                  {student.year}
                </div>
                {student.phone && (
                  <div className="flex items-center text-sm text-slate-600">
                    <Phone className="h-4 w-4 mr-3 text-slate-400" />
                    {student.phone}
                  </div>
                )}
                <div className="flex items-center text-sm text-slate-600">
                  <MapPin className="h-4 w-4 mr-3 text-slate-400" />
                  Bangalore, India
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="w-full text-left">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Placement Readiness</h3>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-3xl font-bold text-emerald-600">{student.placementReadiness}%</span>
                  <span className="text-sm text-slate-500 mb-1">Score</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${student.placementReadiness}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                Academic Information
              </CardTitle>
              <Button variant="ghost" size="icon"><Edit2 className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 pt-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Degree</p>
                <p className="font-medium text-slate-900">B.Tech in Computer Science</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">CGPA</p>
                <p className="font-medium text-slate-900">8.75 / 10.0</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">12th Percentage</p>
                <p className="font-medium text-slate-900">92.4%</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">10th Percentage</p>
                <p className="font-medium text-slate-900">95.0%</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-slate-500 mb-1">Active Backlogs</p>
                <p className="font-medium text-slate-900">0</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                Skills & Competencies
              </CardTitle>
              <Button variant="ghost" size="icon"><Edit2 className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              <div>
                <p className="text-sm font-medium text-slate-900 mb-3">Programming Languages</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Python</Badge>
                  <Badge variant="secondary">Java</Badge>
                  <Badge variant="secondary">C++</Badge>
                  <Badge variant="secondary">JavaScript</Badge>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-slate-900 mb-3">Core Concepts</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Data Structures</Badge>
                  <Badge variant="outline">Algorithms</Badge>
                  <Badge variant="outline">DBMS</Badge>
                  <Badge variant="outline">Operating Systems</Badge>
                  <Badge variant="outline">Computer Networks</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                Career Preferences
              </CardTitle>
              <Button variant="ghost" size="icon"><Edit2 className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Target Roles</p>
                <p className="font-medium text-slate-900">Software Development Engineer (SDE), Full Stack Developer</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Target Companies</p>
                <p className="font-medium text-slate-900">Product Based (Tier 1)</p>
              </div>
              <div className="md:col-span-2 mt-4">
                <Button variant="outline" className="w-full sm:w-auto">
                  <FileText className="h-4 w-4 mr-2" /> Upload/Update Resume
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
