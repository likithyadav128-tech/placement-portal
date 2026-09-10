import type { SettingSection } from "@/types";

export const mockSettings: SettingSection[] = [
  {
    id: "institution",
    title: "Institution Details",
    description: "Manage your institution's profile and basic information.",
    settings: [
      { id: "inst_name", label: "Institution Name", type: "text", value: "National Institute of Engineering" },
      { id: "inst_code", label: "Institution Code", type: "text", value: "NIE-001" },
      { id: "contact_email", label: "Contact Email", type: "text", value: "placement@nie.edu.in" },
      { id: "academic_year", label: "Current Academic Year", type: "select", value: "2025-2026", options: ["2024-2025", "2025-2026", "2026-2027"] }
    ]
  },
  {
    id: "assessments",
    title: "Assessment Defaults",
    description: "Configure default behaviors for mock tests and coding assessments.",
    settings: [
      { id: "strict_mode", label: "Enable Strict Proctoring by Default", description: "Automatically turns on tab-switch tracking and full-screen mode.", type: "toggle", value: true },
      { id: "show_results", label: "Show Results Immediately", description: "Students see their score right after submission.", type: "toggle", value: false },
      { id: "default_passing", label: "Default Passing Percentage", type: "number", value: 60 },
      { id: "plagiarism_check", label: "Auto Plagiarism Check (Coding)", type: "toggle", value: true }
    ]
  },
  {
    id: "notifications",
    title: "Notification Preferences",
    description: "Manage how and when automated emails are sent.",
    settings: [
      { id: "notif_new_assessment", label: "Email on New Assessment", type: "toggle", value: true },
      { id: "notif_deadline", label: "Deadline Reminders", description: "Send reminder 24h before deadline.", type: "toggle", value: true },
      { id: "notif_weekly_report", label: "Weekly Progress Reports to Students", type: "toggle", value: false },
      { id: "notif_faculty_summary", label: "Weekly Faculty Summary", type: "toggle", value: true }
    ]
  },
  {
    id: "security",
    title: "Security & Access",
    description: "Configure authentication and access control policies.",
    settings: [
      { id: "sso_enabled", label: "Enable Google Workspace SSO", type: "toggle", value: true },
      { id: "restrict_domain", label: "Restrict to Institution Domain", description: "Only allow emails ending in @nie.edu.in", type: "toggle", value: true },
      { id: "session_timeout", label: "Session Timeout (Minutes)", type: "number", value: 120 }
    ]
  }
];
