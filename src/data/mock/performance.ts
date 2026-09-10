import type { PerformanceRecord, PerformanceMilestone, FocusArea } from "@/types";

export const mockPerformanceHistory: Record<string, PerformanceRecord[]> = {
  // Student 1: STU001 (High achiever, steady climb)
  "STU001": [
    { month: "Oct 2025", date: "2025-10-15", overall: 72, coding: 75, aptitude: 70, reasoning: 68, communication: 75 },
    { month: "Nov 2025", date: "2025-11-15", overall: 74, coding: 78, aptitude: 72, reasoning: 70, communication: 76 },
    { month: "Dec 2025", date: "2025-12-15", overall: 76, coding: 80, aptitude: 73, reasoning: 72, communication: 78 },
    { month: "Jan 2026", date: "2026-01-15", overall: 78, coding: 82, aptitude: 75, reasoning: 74, communication: 80 },
    { month: "Feb 2026", date: "2026-02-15", overall: 81, coding: 85, aptitude: 78, reasoning: 76, communication: 82 },
    { month: "Mar 2026", date: "2026-03-15", overall: 83, coding: 88, aptitude: 80, reasoning: 78, communication: 84 },
    { month: "Apr 2026", date: "2026-04-15", overall: 85, coding: 90, aptitude: 82, reasoning: 80, communication: 86 },
    { month: "May 2026", date: "2026-05-15", overall: 87, coding: 91, aptitude: 83, reasoning: 81, communication: 87 },
    { month: "Jun 2026", date: "2026-06-15", overall: 88, coding: 92, aptitude: 84, reasoning: 82, communication: 88 },
    { month: "Jul 2026", date: "2026-07-15", overall: 90, coding: 93, aptitude: 85, reasoning: 83, communication: 89 },
    { month: "Aug 2026", date: "2026-08-15", overall: 91, coding: 94, aptitude: 85, reasoning: 82, communication: 90 },
    { month: "Sep 2026", date: "2026-09-08", overall: 92, coding: 95, aptitude: 85, reasoning: 82, communication: 90 }
  ],
  // Student 2: STU002 (Average improving, realistic ups and downs)
  "STU002": [
    { month: "Oct 2025", date: "2025-10-15", overall: 48, coding: 50, aptitude: 45, reasoning: 48, communication: 55 },
    { month: "Nov 2025", date: "2025-11-15", overall: 52, coding: 55, aptitude: 48, reasoning: 50, communication: 58 },
    { month: "Dec 2025", date: "2025-12-15", overall: 50, coding: 52, aptitude: 46, reasoning: 52, communication: 56 },
    { month: "Jan 2026", date: "2026-01-15", overall: 55, coding: 58, aptitude: 50, reasoning: 55, communication: 60 },
    { month: "Feb 2026", date: "2026-02-15", overall: 60, coding: 65, aptitude: 55, reasoning: 58, communication: 65 },
    { month: "Mar 2026", date: "2026-03-15", overall: 58, coding: 62, aptitude: 54, reasoning: 56, communication: 64 },
    { month: "Apr 2026", date: "2026-04-15", overall: 64, coding: 70, aptitude: 58, reasoning: 62, communication: 70 },
    { month: "May 2026", date: "2026-05-15", overall: 68, coding: 75, aptitude: 62, reasoning: 65, communication: 75 },
    { month: "Jun 2026", date: "2026-06-15", overall: 72, coding: 80, aptitude: 65, reasoning: 68, communication: 80 },
    { month: "Jul 2026", date: "2026-07-15", overall: 75, coding: 82, aptitude: 68, reasoning: 72, communication: 82 },
    { month: "Aug 2026", date: "2026-08-15", overall: 74, coding: 80, aptitude: 68, reasoning: 70, communication: 82 },
    { month: "Sep 2026", date: "2026-09-09", overall: 78, coding: 85, aptitude: 72, reasoning: 75, communication: 85 }
  ],
  // Student 3: STU005 (Struggling, slow improvement)
  "STU005": [
    { month: "Oct 2025", date: "2025-10-15", overall: 35, coding: 38, aptitude: 32, reasoning: 35, communication: 40 },
    { month: "Nov 2025", date: "2025-11-15", overall: 36, coding: 40, aptitude: 33, reasoning: 35, communication: 40 },
    { month: "Dec 2025", date: "2025-12-15", overall: 38, coding: 42, aptitude: 35, reasoning: 38, communication: 42 },
    { month: "Jan 2026", date: "2026-01-15", overall: 40, coding: 45, aptitude: 36, reasoning: 40, communication: 42 },
    { month: "Feb 2026", date: "2026-02-15", overall: 42, coding: 48, aptitude: 38, reasoning: 42, communication: 45 },
    { month: "Mar 2026", date: "2026-03-15", overall: 41, coding: 46, aptitude: 38, reasoning: 40, communication: 44 },
    { month: "Apr 2026", date: "2026-04-15", overall: 44, coding: 50, aptitude: 40, reasoning: 42, communication: 46 },
    { month: "May 2026", date: "2026-05-15", overall: 46, coding: 52, aptitude: 42, reasoning: 44, communication: 48 },
    { month: "Jun 2026", date: "2026-06-15", overall: 48, coding: 54, aptitude: 44, reasoning: 45, communication: 50 },
    { month: "Jul 2026", date: "2026-07-15", overall: 50, coding: 56, aptitude: 45, reasoning: 46, communication: 52 },
    { month: "Aug 2026", date: "2026-08-15", overall: 51, coding: 58, aptitude: 45, reasoning: 48, communication: 52 },
    { month: "Sep 2026", date: "2026-09-01", overall: 52, coding: 58, aptitude: 46, reasoning: 48, communication: 54 }
  ],
  // Student 4: STU007 (Strong coder, weak aptitude)
  "STU007": [
    { month: "Oct 2025", date: "2025-10-15", overall: 58, coding: 80, aptitude: 45, reasoning: 50, communication: 58 },
    { month: "Nov 2025", date: "2025-11-15", overall: 59, coding: 82, aptitude: 45, reasoning: 50, communication: 58 },
    { month: "Dec 2025", date: "2025-12-15", overall: 60, coding: 83, aptitude: 46, reasoning: 52, communication: 59 },
    { month: "Jan 2026", date: "2026-01-15", overall: 62, coding: 85, aptitude: 48, reasoning: 52, communication: 60 },
    { month: "Feb 2026", date: "2026-02-15", overall: 63, coding: 86, aptitude: 48, reasoning: 54, communication: 60 },
    { month: "Mar 2026", date: "2026-03-15", overall: 64, coding: 87, aptitude: 50, reasoning: 54, communication: 62 },
    { month: "Apr 2026", date: "2026-04-15", overall: 65, coding: 88, aptitude: 50, reasoning: 55, communication: 62 },
    { month: "May 2026", date: "2026-05-15", overall: 66, coding: 88, aptitude: 52, reasoning: 56, communication: 64 },
    { month: "Jun 2026", date: "2026-06-15", overall: 68, coding: 89, aptitude: 52, reasoning: 58, communication: 64 },
    { month: "Jul 2026", date: "2026-07-15", overall: 69, coding: 90, aptitude: 54, reasoning: 58, communication: 65 },
    { month: "Aug 2026", date: "2026-08-15", overall: 70, coding: 90, aptitude: 55, reasoning: 60, communication: 66 },
    { month: "Sep 2026", date: "2026-09-09", overall: 72, coding: 90, aptitude: 55, reasoning: 62, communication: 68 }
  ],
  // Student 5: STU003 (Consistent hover around 65-70)
  "STU003": [
    { month: "Oct 2025", date: "2025-10-15", overall: 65, coding: 68, aptitude: 62, reasoning: 65, communication: 68 },
    { month: "Nov 2025", date: "2025-11-15", overall: 66, coding: 68, aptitude: 64, reasoning: 65, communication: 68 },
    { month: "Dec 2025", date: "2025-12-15", overall: 64, coding: 65, aptitude: 62, reasoning: 64, communication: 66 },
    { month: "Jan 2026", date: "2026-01-15", overall: 67, coding: 70, aptitude: 65, reasoning: 68, communication: 68 },
    { month: "Feb 2026", date: "2026-02-15", overall: 68, coding: 70, aptitude: 66, reasoning: 68, communication: 70 },
    { month: "Mar 2026", date: "2026-03-15", overall: 66, coding: 68, aptitude: 64, reasoning: 66, communication: 68 },
    { month: "Apr 2026", date: "2026-04-15", overall: 69, coding: 72, aptitude: 66, reasoning: 70, communication: 70 },
    { month: "May 2026", date: "2026-05-15", overall: 70, coding: 72, aptitude: 68, reasoning: 70, communication: 72 },
    { month: "Jun 2026", date: "2026-06-15", overall: 68, coding: 70, aptitude: 65, reasoning: 68, communication: 70 },
    { month: "Jul 2026", date: "2026-07-15", overall: 71, coding: 74, aptitude: 68, reasoning: 70, communication: 72 },
    { month: "Aug 2026", date: "2026-08-15", overall: 70, coding: 72, aptitude: 68, reasoning: 70, communication: 70 },
    { month: "Sep 2026", date: "2026-09-07", overall: 68, coding: 70, aptitude: 65, reasoning: 68, communication: 70 }
  ]
};

export const mockMilestones: PerformanceMilestone[] = [
  { id: "M1", title: "Complete Foundation Training", achieved: true, achievedDate: "2025-11-20" },
  { id: "M2", title: "Score 70%+ in Aptitude Mock", achieved: true, achievedDate: "2026-02-15" },
  { id: "M3", title: "Solve 50 Coding Problems", achieved: true, achievedDate: "2026-04-10" },
  { id: "M4", title: "Clear Company Specific Mock Test", achieved: false },
  { id: "M5", title: "Achieve 85%+ Overall Readiness", achieved: false }
];

export const mockFocusAreas: FocusArea[] = [
  { skill: "Dynamic Programming", status: "needs_improvement", currentScore: 45, targetScore: 75, suggestion: "Practice bottom-up approach and memoization." },
  { skill: "Quantitative Aptitude", status: "improving", currentScore: 65, targetScore: 80, suggestion: "Focus on Time & Work, Speed & Distance problems." },
  { skill: "System Design", status: "needs_improvement", currentScore: 50, targetScore: 70, suggestion: "Read up on load balancing and database sharding." },
  { skill: "Data Structures", status: "strong", currentScore: 88, targetScore: 90, suggestion: "Maintain proficiency with advanced graph algorithms." }
];
