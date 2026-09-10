import type { Permission, FacultyPermission } from "@/types";

export const mockPermissions: Permission[] = [
  { id: "P001", name: "manage_assessments", description: "Create, edit, and delete assessments and mock tests", category: "Assessments" },
  { id: "P002", name: "grade_assessments", description: "Grade subjective answers and modify scores", category: "Assessments" },
  { id: "P003", name: "view_reports", description: "Access comprehensive performance reports and analytics", category: "Reports" },
  { id: "P004", name: "export_data", description: "Export student data, grades, and reports to CSV/PDF", category: "Reports" },
  { id: "P005", name: "manage_students", description: "Add, edit, or deactivate student accounts", category: "Users" },
  { id: "P006", name: "manage_faculty", description: "Add, edit, or deactivate faculty accounts", category: "Users" },
  { id: "P007", name: "manage_roadmaps", description: "Create and update learning roadmaps", category: "Content" },
  { id: "P008", name: "manage_resources", description: "Upload and manage learning materials", category: "Content" },
  { id: "P009", name: "system_settings", description: "Access and modify global system settings", category: "System" },
  { id: "P010", name: "view_audit_logs", description: "View system audit logs for security monitoring", category: "System" }
];

export const mockFacultyPermissions: FacultyPermission[] = [
  {
    facultyId: "FAC001",
    facultyName: "Dr. Rajesh Kumar",
    department: "Computer Science",
    permissions: {
      "manage_assessments": true,
      "grade_assessments": true,
      "view_reports": true,
      "export_data": true,
      "manage_students": true,
      "manage_faculty": false,
      "manage_roadmaps": true,
      "manage_resources": true,
      "system_settings": false,
      "view_audit_logs": false
    }
  },
  {
    facultyId: "FAC004",
    facultyName: "Dr. Sunita Desai",
    department: "AI & Data Science",
    permissions: {
      "manage_assessments": true,
      "grade_assessments": true,
      "view_reports": true,
      "export_data": true,
      "manage_students": true,
      "manage_faculty": true,
      "manage_roadmaps": true,
      "manage_resources": true,
      "system_settings": true,
      "view_audit_logs": true
    }
  },
  {
    facultyId: "FAC005",
    facultyName: "Prof. Vikram Das",
    department: "Computer Science",
    permissions: {
      "manage_assessments": false,
      "grade_assessments": false,
      "view_reports": true,
      "export_data": false,
      "manage_students": false,
      "manage_faculty": false,
      "manage_roadmaps": false,
      "manage_resources": false,
      "system_settings": false,
      "view_audit_logs": false
    }
  }
];
