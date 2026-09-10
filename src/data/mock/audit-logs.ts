import type { AuditLog } from "@/types";

export const mockAuditLogs: AuditLog[] = [
  { id: "LOG001", date: "2026-09-09T14:30:00Z", actor: "Dr. Rajesh Kumar", role: "MANAGEMENT", action: "Created Assessment", target: "Advanced Algorithms Assessment", status: "success", details: "ID: ASSESS004" },
  { id: "LOG002", date: "2026-09-09T13:15:00Z", actor: "Admin System", role: "MANAGEMENT", action: "Automated Backup", target: "Database", status: "success" },
  { id: "LOG003", date: "2026-09-09T11:00:00Z", actor: "Prof. Meera Reddy", role: "FACULTY", action: "Updated Grades", target: "CS 3rd Year Batch", status: "success", details: "Imported 120 grades from CSV" },
  { id: "LOG004", date: "2026-09-08T16:45:00Z", actor: "Dr. Anil Sharma", role: "FACULTY", action: "Failed Login Attempt", target: "System", status: "failed", details: "IP: 192.168.1.45" },
  { id: "LOG005", date: "2026-09-08T15:20:00Z", actor: "Dr. Sunita Desai", role: "MANAGEMENT", action: "Changed Permissions", target: "Prof. Vikram Das", status: "success", details: "Revoked 'manage_assessments'" },
  { id: "LOG006", date: "2026-09-08T10:00:00Z", actor: "Placement Cell", role: "MANAGEMENT", action: "Published Mock Test", target: "Wipro NLTH Mock", status: "success", details: "ID: MT003" },
  { id: "LOG007", date: "2026-09-07T14:10:00Z", actor: "Dr. Kavita Singh", role: "FACULTY", action: "Deleted Question", target: "Aptitude Bank", status: "success", details: "Question ID: APT105" },
  { id: "LOG008", date: "2026-09-07T09:30:00Z", actor: "Dr. Rajesh Kumar", role: "MANAGEMENT", action: "Added Student", target: "Ananya Singh", status: "success", details: "Roll: AD2025005" },
  { id: "LOG009", date: "2026-09-06T11:45:00Z", actor: "Admin System", role: "MANAGEMENT", action: "Sent Notifications", target: "All 4th Year Students", status: "success", details: "Subject: Upcoming TCS NQT Mock" },
  { id: "LOG010", date: "2026-09-05T16:00:00Z", actor: "Prof. Sanjay Joshi", role: "FACULTY", action: "Generated Report", target: "EC Department Performance", status: "success", details: "Format: PDF" },
  { id: "LOG011", date: "2026-09-05T10:20:00Z", actor: "Dr. Ritu Verma", role: "FACULTY", action: "Created Assessment", target: "General Aptitude Grand Test", status: "success", details: "ID: ASSESS012" },
  { id: "LOG012", date: "2026-09-04T13:40:00Z", actor: "Dr. Sunita Desai", role: "MANAGEMENT", action: "Updated Settings", target: "Notification Preferences", status: "success" },
  { id: "LOG013", date: "2026-09-03T15:15:00Z", actor: "Prof. Meera Reddy", role: "FACULTY", action: "Archived Assessment", target: "Data Structures Weekly Challenge", status: "success", details: "ID: ASSESS001" },
  { id: "LOG014", date: "2026-09-02T09:00:00Z", actor: "Placement Cell", role: "MANAGEMENT", action: "Created Roadmap", target: "Core Engineering Track", status: "success", details: "ID: RM_003" },
  { id: "LOG015", date: "2026-09-01T14:30:00Z", actor: "Admin System", role: "MANAGEMENT", action: "Monthly Data Sync", target: "ERP System", status: "success" },
  { id: "LOG016", date: "2026-08-30T11:20:00Z", actor: "Dr. Anil Sharma", role: "FACULTY", action: "Exported Data", target: "Student List", status: "success", details: "Format: Excel" },
  { id: "LOG017", date: "2026-08-28T10:45:00Z", actor: "Dr. Kavita Singh", role: "FACULTY", action: "Failed API Call", target: "External Coding Platform", status: "failed", details: "Timeout Error" },
  { id: "LOG018", date: "2026-08-25T16:10:00Z", actor: "Prof. Sanjay Joshi", role: "FACULTY", action: "Updated Roadmap", target: "SDE Track", status: "success" },
  { id: "LOG019", date: "2026-08-22T09:50:00Z", actor: "Dr. Rajesh Kumar", role: "MANAGEMENT", action: "Reset Password", target: "Student STU015", status: "success" },
  { id: "LOG020", date: "2026-08-20T14:00:00Z", actor: "Placement Cell", role: "MANAGEMENT", action: "Published Mock Test", target: "Cognizant GenC Elevate Mock", status: "success" }
];
