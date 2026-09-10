import type { Notification } from "@/types";

export const mockNotifications: Notification[] = [
  {
    id: "NOTIF001",
    title: "New Mock Test Available",
    message: "TCS NQT Full Length Mock is now available. Complete it before Sep 15.",
    type: "info",
    read: false,
    createdAt: "2026-09-09T10:00:00Z"
  },
  {
    id: "NOTIF002",
    title: "Assessment Deadline Approaching",
    message: "You have 2 days left to complete the 'Advanced Algorithms Assessment'.",
    type: "warning",
    read: false,
    createdAt: "2026-09-08T14:30:00Z"
  },
  {
    id: "NOTIF003",
    title: "Milestone Achieved",
    message: "Congratulations! You have successfully completed the 'Solve 50 Coding Problems' milestone.",
    type: "success",
    read: true,
    createdAt: "2026-09-07T09:15:00Z"
  },
  {
    id: "NOTIF004",
    title: "System Maintenance",
    message: "The portal will be down for scheduled maintenance on Sunday from 2 AM to 4 AM.",
    type: "info",
    read: true,
    createdAt: "2026-09-05T11:00:00Z"
  },
  {
    id: "NOTIF005",
    title: "New Recommendation",
    message: "A new personalized recommendation 'Practice Dynamic Programming' has been added for you.",
    type: "info",
    read: true,
    createdAt: "2026-09-04T16:20:00Z"
  },
  {
    id: "NOTIF006",
    title: "Failed Code Submission",
    message: "Your submission for 'Valid Parentheses' failed 3 hidden test cases.",
    type: "error",
    read: true,
    createdAt: "2026-09-02T13:45:00Z"
  },
  {
    id: "NOTIF007",
    title: "Roadmap Updated",
    message: "The SDE Track roadmap has been updated with new System Design resources.",
    type: "info",
    read: true,
    createdAt: "2026-08-30T10:10:00Z"
  },
  {
    id: "NOTIF008",
    title: "Assessment Graded",
    message: "Your 'Cognizant GenC Aptitude' mock has been graded. You scored 80%.",
    type: "success",
    read: true,
    createdAt: "2026-08-25T15:30:00Z"
  }
];
