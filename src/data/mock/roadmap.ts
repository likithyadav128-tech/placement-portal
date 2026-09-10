import type { RoadmapItem, Roadmap } from "@/types";

export const mockRoadmapItems: RoadmapItem[] = [
  { id: "RM_I_001", title: "Programming Basics", description: "Variables, Loops, Functions in Python/C++/Java", phase: "foundation", status: "completed", estimatedHours: 20, skills: ["Programming Fundamentals"], resources: ["Video Lectures", "Practice Sets"], order: 1 },
  { id: "RM_I_002", title: "Arrays & Strings", description: "Array manipulations, String operations", phase: "foundation", status: "completed", estimatedHours: 25, skills: ["Arrays", "Strings"], resources: ["Coding Platform", "Tutorials"], order: 2 },
  { id: "RM_I_003", title: "Basic Math", description: "Prime numbers, GCD, LCM, Basic Combinatorics", phase: "foundation", status: "completed", estimatedHours: 15, skills: ["Mathematics"], resources: ["Notes", "Practice Problems"], order: 3 },
  { id: "RM_I_004", title: "Data Structures", description: "Linked Lists, Stacks, Queues, Trees, Graphs", phase: "current", status: "in_progress", estimatedHours: 40, skills: ["Data Structures"], resources: ["Interactive Visualizer", "Coding Challenges"], order: 4 },
  { id: "RM_I_005", title: "Algorithms Basics", description: "Searching, Sorting, Two Pointers, Sliding Window", phase: "current", status: "in_progress", estimatedHours: 35, skills: ["Algorithms"], resources: ["Algorithms Book", "Practice Contests"], order: 5 },
  { id: "RM_I_006", title: "Advanced Algorithms", description: "Dynamic Programming, Backtracking, Graph Algorithms", phase: "upcoming", status: "not_started", estimatedHours: 45, skills: ["Advanced Algorithms", "DP", "Graphs"], resources: ["Expert Lectures", "Hard Problems"], order: 6 },
  { id: "RM_I_007", title: "SQL & Databases", description: "Joins, Group By, Subqueries, Normalization", phase: "upcoming", status: "not_started", estimatedHours: 20, skills: ["SQL", "DBMS"], resources: ["SQL Simulator", "Theory Notes"], order: 7 },
  { id: "RM_I_008", title: "System Design Basics", description: "Client-Server model, Load Balancing, Caching", phase: "upcoming", status: "not_started", estimatedHours: 25, skills: ["System Design"], resources: ["System Design Primer", "Case Studies"], order: 8 },
  { id: "RM_I_009", title: "Aptitude Training", description: "Quantitative, Logical, Data Interpretation", phase: "upcoming", status: "not_started", estimatedHours: 30, skills: ["Quantitative", "Logical"], resources: ["Aptitude Tests", "Shortcuts Book"], order: 9 },
  { id: "RM_I_010", title: "Verbal & Communication", description: "Reading Comprehension, Grammar, Email Writing", phase: "upcoming", status: "not_started", estimatedHours: 20, skills: ["Verbal", "Communication"], resources: ["Grammar Exercises", "Reading Materials"], order: 10 },
  { id: "RM_I_011", title: "Group Discussion", description: "Current Affairs, Abstract Topics, Group Dynamics", phase: "upcoming", status: "not_started", estimatedHours: 15, skills: ["Communication", "Soft Skills"], resources: ["Mock GD Sessions", "Topic Lists"], order: 11 },
  { id: "RM_I_012", title: "Mock Interviews", description: "Technical and HR Mock Interviews", phase: "upcoming", status: "not_started", estimatedHours: 20, skills: ["Interview Prep"], resources: ["Interview Experiences", "Peer Mocks"], order: 12 }
];

export const mockRoadmaps: Roadmap[] = [
  {
    id: "RM_001",
    title: "Software Development Engineer (SDE) Track",
    targetGroup: "CS/IT 3rd & 4th Year",
    completion: 45,
    status: "active",
    items: mockRoadmapItems,
    lastUpdated: "2026-09-01T10:00:00Z"
  },
  {
    id: "RM_002",
    title: "Data Science & Analytics Track",
    targetGroup: "AI & DS, CS",
    completion: 30,
    status: "active",
    items: [], // Would contain specific DS items
    lastUpdated: "2026-08-15T10:00:00Z"
  },
  {
    id: "RM_003",
    title: "Core Engineering Track",
    targetGroup: "EC, EE, ME",
    completion: 60,
    status: "active",
    items: [], // Would contain core specific items
    lastUpdated: "2026-09-05T10:00:00Z"
  }
];
