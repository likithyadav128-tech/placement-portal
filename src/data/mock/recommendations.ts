import type { Recommendation } from "@/types";

export const mockRecommendations: Recommendation[] = [
  {
    id: "REC_001",
    title: "Practice Dynamic Programming",
    description: "Your recent performance in DP problems has been below average. Dedicate 5 hours this week to foundational DP problems.",
    reason: "Scored < 40% in recent 'Advanced Algorithms' assessment.",
    priority: "high",
    expectedBenefit: "Will improve your problem-solving speed in technical interviews.",
    category: "Coding",
    actionLabel: "Start Practice",
    actionUrl: "/practice/dynamic-programming"
  },
  {
    id: "REC_002",
    title: "Take TCS NQT Mock Test",
    description: "You have completed the aptitude syllabus. It's time to evaluate your readiness for service-based companies.",
    reason: "Completed 80% of Aptitude Training roadmap.",
    priority: "medium",
    expectedBenefit: "Familiarity with exam pattern and time management.",
    category: "Assessment",
    actionLabel: "Take Test",
    actionUrl: "/mock-tests/tcs-nqt"
  },
  {
    id: "REC_003",
    title: "Improve Communication Skills",
    description: "Review grammar rules and practice reading comprehension exercises.",
    reason: "Consistent low scores in Verbal sections across last 3 mock tests.",
    priority: "high",
    expectedBenefit: "Essential for clearing the initial screening rounds.",
    category: "Aptitude",
    actionLabel: "View Resources",
    actionUrl: "/resources/verbal"
  },
  {
    id: "REC_004",
    title: "System Design Basics",
    description: "Start exploring High-Level Design concepts like Load Balancing and Caching.",
    reason: "Good progress in DSA. Ready for advanced topics.",
    priority: "low",
    expectedBenefit: "Crucial for product-based company interviews.",
    category: "Learning",
    actionLabel: "Start Module",
    actionUrl: "/roadmap/system-design"
  },
  {
    id: "REC_005",
    title: "Participate in Weekly Contest",
    description: "Join this week's coding contest to compete with peers and solve unseen problems under time pressure.",
    reason: "Haven't participated in a contest for 2 weeks.",
    priority: "medium",
    expectedBenefit: "Builds competitive spirit and speeds up coding.",
    category: "Contest",
    actionLabel: "Register Now",
    actionUrl: "/contests/weekly-95"
  },
  {
    id: "REC_006",
    title: "Review SQL Joins",
    description: "Revisit SQL Join types and practice complex queries involving multiple tables.",
    reason: "Missed 3 SQL-related questions in the recent Database mock.",
    priority: "medium",
    expectedBenefit: "SQL is frequently asked in almost all technical interviews.",
    category: "Coding",
    actionLabel: "Practice SQL",
    actionUrl: "/practice/sql"
  }
];
