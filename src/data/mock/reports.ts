import type { Report } from "@/types";

export const mockReports: Report[] = [
  {
    id: "REP_001",
    title: "Overall Department Performance",
    category: "Academic",
    description: "Comparative analysis of all departments across coding, aptitude, and communication metrics.",
    lastGenerated: "2026-09-01T08:00:00Z",
    filters: ["Department", "Year", "Date Range"]
  },
  {
    id: "REP_002",
    title: "Company Specific Mock Analysis (TCS)",
    category: "Placement Readiness",
    description: "Detailed breakdown of student performance in TCS NQT pattern mock tests, identifying weak areas.",
    lastGenerated: "2026-09-08T10:30:00Z",
    filters: ["Mock Test", "Batch", "Score Range"]
  },
  {
    id: "REP_003",
    title: "Students Needing Attention",
    category: "Monitoring",
    description: "List of students whose performance has declined by >10% over the last month or score <40% overall.",
    lastGenerated: "2026-09-09T09:00:00Z",
    filters: ["Department", "Risk Level"]
  },
  {
    id: "REP_004",
    title: "Coding Skill Matrix",
    category: "Technical",
    description: "Heatmap of student proficiency across different data structures and algorithms.",
    lastGenerated: "2026-08-15T14:00:00Z",
    filters: ["Department", "Year", "Skill Category"]
  },
  {
    id: "REP_005",
    title: "Aptitude Topic-wise Breakdown",
    category: "Aptitude",
    description: "Performance metrics on specific quantitative and logical reasoning topics.",
    lastGenerated: "2026-08-30T11:15:00Z",
    filters: ["Topic", "Department", "Difficulty"]
  },
  {
    id: "REP_006",
    title: "Faculty Utilization & Assessment Impact",
    category: "Administrative",
    description: "Metrics on assessments created, grading time, and resulting student improvement by faculty member.",
    filters: ["Faculty", "Department", "Semester"]
  }
];
