"use client";

import React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { SimpleSelect } from '@/components/ui/select';
import { mockSettings } from '@/data/mock/settings';

export default function SettingsManagementPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Portal Settings" 
        description="Configure institution preferences and platform behavior"
      />

      <Tabs defaultValue="institution" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="institution">Institution</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="institution">
          <Card>
            <CardHeader>
              <CardTitle>Institution Details</CardTitle>
              <CardDescription>Update basic information about your institution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Institution Name</label>
                  <Input defaultValue="National Institute of Engineering" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Domain</label>
                  <Input defaultValue="engg-college.edu" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Timezone</label>
                  <SimpleSelect placeholder="Select timezone" options={[{label: 'IST (UTC+5:30)', value: 'IST'}]} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Academic Year</label>
                  <Input defaultValue="2024-2025" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="assessment">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Configuration</CardTitle>
              <CardDescription>Global rules for assessments and mock tests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-1">
                  <label className="font-medium text-sm">Strict Proctoring</label>
                  <p className="text-xs text-slate-500">Enable webcam and tab-switch monitoring by default</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-1">
                  <label className="font-medium text-sm">Show Results Immediately</label>
                  <p className="text-xs text-slate-500">Students can view their scores right after submission</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium">Default Passing Criteria (%)</label>
                <Input type="number" defaultValue="60" className="w-32" />
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button>Save Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how alerts are sent across the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50">
                <div className="space-y-1">
                  <label className="font-medium text-sm">Email Alerts</label>
                  <p className="text-xs text-slate-500">Send system emails for critical events</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50">
                <div className="space-y-1">
                  <label className="font-medium text-sm">Student Performance Digest</label>
                  <p className="text-xs text-slate-500">Weekly email summary of student activity</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button>Update Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Platform security and access policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-w-sm">
                <label className="text-sm font-medium">Session Timeout (minutes)</label>
                <Input type="number" defaultValue="30" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50">
                <div className="space-y-1">
                  <label className="font-medium text-sm">Two-Factor Authentication</label>
                  <p className="text-xs text-slate-500">Require 2FA for all administrative accounts</p>
                </div>
                <Switch defaultChecked={false} />
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button>Save Security Rules</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
