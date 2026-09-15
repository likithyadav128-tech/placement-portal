"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertCircle, Save } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/feedback/states";

interface FacultyItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  department: string;
  designation: string | null;
  permissions: Record<string, boolean>;
}

export default function PermissionsManagementPage() {
  const [facultyList, setFacultyList] = useState<FacultyItem[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [activePermissions, setActivePermissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/management/permissions");
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed to load permissions");
      }
      const data = (await res.json()) as { faculty?: FacultyItem[] };
      const list: FacultyItem[] = data.faculty || [];
      setFacultyList(list);
      if (list.length > 0) {
        setSelectedFacultyId(list[0].id);
        setActivePermissions(list[0].permissions || {});
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading permissions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleSelectFaculty = (faculty: FacultyItem) => {
    setSelectedFacultyId(faculty.id);
    setActivePermissions(faculty.permissions || {});
  };

  const handleToggle = (permissionKey: string, checked: boolean) => {
    setActivePermissions((prev) => ({
      ...prev,
      [permissionKey]: checked,
    }));
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const permissionCategories = [
    {
      category: "Student Management",
      items: [
        { id: "students:read", label: "View Students", desc: "Can view student profiles and directories" },
        { id: "students:write", label: "Manage Students", desc: "Can edit, add, or deactivate students", isSensitive: true },
        { id: "performance:read", label: "View Performance", desc: "Can view student performance metrics" },
      ],
    },
    {
      category: "Assessments & Tests",
      items: [
        { id: "assessments:create", label: "Create Assessments", desc: "Can author new assessments and tests" },
        { id: "assessments:edit", label: "Edit Assessments", desc: "Can modify existing assessments" },
        { id: "assessments:publish", label: "Publish Assessments", desc: "Can publish assessments to students", isSensitive: true },
      ],
    },
    {
      category: "Analytics & Reporting",
      items: [
        { id: "reports:read", label: "View Reports", desc: "Can access and view all reports" },
        { id: "reports:export", label: "Export Data", desc: "Can export platform data to CSV/PDF", isSensitive: true },
      ],
    },
  ];

  const selectedFaculty = facultyList.find((f) => f.id === selectedFacultyId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Role-Based Access Control"
        description="Manage faculty permissions and platform access"
      />

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Loading permissions matrix...</p>
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load permissions"
          message={error}
          onRetry={fetchPermissions}
        />
      ) : facultyList.length === 0 ? (
        <EmptyState
          title="No faculty members appointed"
          description="Permissions matrix will become active once faculty members are added."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="md:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-base">Faculty Members</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {facultyList.map((faculty) => (
                  <div
                    key={faculty.id}
                    className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                      selectedFacultyId === faculty.id
                        ? "bg-blue-50 border-l-4 border-blue-600"
                        : "border-l-4 border-transparent"
                    }`}
                    onClick={() => handleSelectFaculty(faculty)}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {faculty.name?.substring(0, 2).toUpperCase() || "FA"}
                      </AvatarFallback>
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
                <CardTitle>
                  Permission Matrix {selectedFaculty ? `— ${selectedFaculty.name}` : ""}
                </CardTitle>
                <CardDescription>
                  Configure access rights for the selected faculty member
                </CardDescription>
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
                  <strong>Warning:</strong> Modifying sensitive permissions (marked with a red badge) can significantly alter the faculty member&apos;s control over the platform and student data.
                </div>
              </div>

              {permissionCategories.map((category, idx) => (
                <div key={idx} className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">{category.category}</h3>
                  <div className="grid gap-4">
                    {category.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between p-3 rounded-lg border bg-slate-50"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <label className="font-medium text-sm">{item.label}</label>
                            {item.isSensitive && (
                              <Badge variant="danger" className="text-[10px] px-1 h-4">
                                Sensitive
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{item.desc}</p>
                        </div>
                        <Switch
                          checked={activePermissions[item.id] ?? false}
                          onCheckedChange={(checked) => handleToggle(item.id, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
