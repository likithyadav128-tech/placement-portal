import type { Faculty } from "@/types";

export const mockFaculty: Faculty[] = [
  {
    id: "FAC001",
    name: "Dr. Rajesh Kumar",
    email: "rajesh.kumar@example.com",
    department: "Computer Science",
    studentsAssigned: 120,
    permissions: ["manage_assessments", "view_reports", "manage_students"],
    status: "active",
    lastActive: "2026-09-09T10:00:00Z",
    joinedAt: "2020-05-10T00:00:00Z"
  },
  {
    id: "FAC002",
    name: "Prof. Meera Reddy",
    email: "meera.reddy@example.com",
    department: "Information Technology",
    studentsAssigned: 95,
    permissions: ["manage_assessments", "view_reports", "manage_students"],
    status: "active",
    lastActive: "2026-09-09T14:30:00Z",
    joinedAt: "2021-08-15T00:00:00Z"
  },
  {
    id: "FAC003",
    name: "Dr. Anil Sharma",
    email: "anil.sharma@example.com",
    department: "Electronics & Communication",
    studentsAssigned: 110,
    permissions: ["view_reports", "manage_students"],
    status: "active",
    lastActive: "2026-09-08T16:45:00Z",
    joinedAt: "2019-11-20T00:00:00Z"
  },
  {
    id: "FAC004",
    name: "Dr. Sunita Desai",
    email: "sunita.desai@example.com",
    department: "AI & Data Science",
    studentsAssigned: 85,
    permissions: ["manage_assessments", "view_reports", "manage_students", "system_settings"],
    status: "active",
    lastActive: "2026-09-09T09:15:00Z",
    joinedAt: "2022-01-10T00:00:00Z"
  },
  {
    id: "FAC005",
    name: "Prof. Vikram Das",
    email: "vikram.das@example.com",
    department: "Computer Science",
    studentsAssigned: 105,
    permissions: ["view_reports"],
    status: "inactive",
    lastActive: "2026-08-15T11:20:00Z",
    joinedAt: "2021-06-05T00:00:00Z"
  },
  {
    id: "FAC006",
    name: "Dr. Kavita Singh",
    email: "kavita.singh@example.com",
    department: "Information Technology",
    studentsAssigned: 90,
    permissions: ["manage_assessments", "view_reports"],
    status: "active",
    lastActive: "2026-09-09T13:10:00Z",
    joinedAt: "2020-09-12T00:00:00Z"
  },
  {
    id: "FAC007",
    name: "Prof. Sanjay Joshi",
    email: "sanjay.joshi@example.com",
    department: "Electronics & Communication",
    studentsAssigned: 115,
    permissions: ["view_reports", "manage_students"],
    status: "active",
    lastActive: "2026-09-07T15:00:00Z",
    joinedAt: "2018-07-25T00:00:00Z"
  },
  {
    id: "FAC008",
    name: "Dr. Ritu Verma",
    email: "ritu.verma@example.com",
    department: "Aptitude Training",
    studentsAssigned: 400, // Cross-department
    permissions: ["manage_assessments", "view_reports"],
    status: "active",
    lastActive: "2026-09-09T11:45:00Z",
    joinedAt: "2019-03-18T00:00:00Z"
  }
];
