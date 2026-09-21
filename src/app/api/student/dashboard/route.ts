import { NextResponse } from "next/server";
import { createClient as createDirectClient, type User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { prisma, withDbRetry } from "@/lib/prisma";
import { syncRecommendationsForStudent } from "@/lib/recommendations/recommendationEngine";

export const dynamic = "force-dynamic";

/**
 * GET /api/student/dashboard
 *
 * Secure server-side data resolver for Student Dashboard.
 *
 * Requirements:
 * 1. Authenticates session via Supabase server-side cookies or Bearer token.
 * 2. Resolves auth.users.id -> public.User -> public.Student.
 * 3. Enforces STUDENT role.
 * 4. Queries REAL PostgreSQL data only (PerformanceRecord, FocusArea, Recommendation, Assessment, Roadmap).
 * 5. Calculates real, dynamic Placement Readiness score:
 *    30% Coding + 25% Aptitude + 15% Reasoning + 10% Communication + 10% Roadmap + 10% Profile.
 * 6. Generates actionable real reminders and data-driven recommended next step.
 * 7. Zero mock data fallbacks.
 */
export async function GET(req: Request) {
  try {
    let authUser: SupabaseUser | null = null;

    // 1. Primary check: Bearer token header if present
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (authHeader?.trim().toLowerCase().startsWith("bearer ")) {
      const token = authHeader.trim().slice(7).trim();
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project")
          ? process.env.NEXT_PUBLIC_SUPABASE_URL
          : "https://zfouzydarrtqfmrqjvsd.supabase.co";
      const supabaseAnonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder-anon")
          ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmb3V6eWRhcnJ0cWZtcnFqdnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTQ3MzcsImV4cCI6MjEwNDYzMDczN30.juQ-vhvvKx3AysRrRmEZkz5C4dU7TWwh52l8EfvN0QE";

      try {
        const directClient = createDirectClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data, error } = await directClient.auth.getUser(token);
        if (!error && data?.user) {
          authUser = data.user;
        }
      } catch (directErr) {
        console.warn("[api/student/dashboard] Direct token verification exception:", directErr);
      }
    }

    // 2. Secondary check: Cookie session
    if (!authUser) {
      try {
        const rawCookie = req.headers.get("cookie") || undefined;
        const supabase = await createClient(rawCookie);
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!authError && user) {
          authUser = user;
        }
      } catch (cookieErr) {
        console.warn("[api/student/dashboard] Cookie verification exception:", cookieErr);
      }
    }

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse timeRange from query
    const url = new URL(req.url);
    const timeRangeParam = (url.searchParams.get("timeRange") || "6M").toLowerCase().trim();

    // 2. Resolve User & Student record with projects and certs
    const dbUser = await withDbRetry(() =>
      prisma.user.findFirst({
        where: {
          OR: [{ authUserId: authUser.id }, { email: authUser.email || "" }],
        },
        include: {
          student: {
            include: {
              projects: true,
              certifications: true,
            },
          },
        },
      })
    );

    if (!dbUser) {
      return NextResponse.json(
        { error: "User record not found in application database." },
        { status: 404 }
      );
    }

    if (dbUser.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Forbidden: Access restricted to student accounts." },
        { status: 403 }
      );
    }

    const student = dbUser.student;
    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found." },
        { status: 404 }
      );
    }

    // 3. Fetch real performance history
    const allPerformanceRecords = await withDbRetry(() =>
      prisma.performanceRecord.findMany({
        where: { studentId: student.id },
        orderBy: { completedAt: "asc" },
      })
    );

    // Calculate cutoff date for date filtering
    const now = new Date();
    let cutoffDate: Date | null = null;
    if (timeRangeParam === "today") {
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeRangeParam === "7d" || timeRangeParam === "7 days") {
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRangeParam === "30d" || timeRangeParam === "30 days" || timeRangeParam === "1m") {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRangeParam === "3m" || timeRangeParam === "3 months") {
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (timeRangeParam === "6m" || timeRangeParam === "6 months") {
      cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    } else if (timeRangeParam === "1y" || timeRangeParam === "1 year" || timeRangeParam === "12m") {
      cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    } else {
      cutoffDate = null;
    }

    const filteredRecords = cutoffDate
      ? allPerformanceRecords.filter((r) => r.completedAt >= cutoffDate)
      : allPerformanceRecords;

    const performanceRecords =
      filteredRecords.length > 0 ? filteredRecords : allPerformanceRecords.slice(-2);

    // 4. Fetch real focus areas
    const focusAreas = await withDbRetry(() =>
      prisma.focusArea.findMany({
        where: { studentId: student.id },
        orderBy: { updatedAt: "desc" },
      })
    );

    // 5. Fetch real roadmap progress
    const totalRoadmapItems = await withDbRetry(() => prisma.roadmapItem.count());
    const completedRoadmapItems = await withDbRetry(() =>
      prisma.studentRoadmapProgress.count({
        where: {
          studentId: student.id,
          status: "COMPLETED",
        },
      })
    );

    const roadmapProgressPercentage =
      totalRoadmapItems > 0
        ? Math.round((completedRoadmapItems / totalRoadmapItems) * 100)
        : 0;

    // 6. Calculate real profile completion percentage
    const profileChecks = [
      Boolean(dbUser.name?.trim()),
      Boolean(student.rollNumber?.trim()),
      Boolean(student.department?.trim()),
      typeof student.cgpa === "number" && student.cgpa > 0,
      Array.isArray(student.technicalSkills) && student.technicalSkills.length >= 2,
      Array.isArray(student.projects) && student.projects.length >= 1,
      Array.isArray(student.certifications) && student.certifications.length >= 1,
      Boolean(student.targetRole?.trim()),
      Boolean(student.githubUrl?.trim()) || Boolean(student.linkedinUrl?.trim()),
    ];
    const profileCompleteness = Math.round(
      (profileChecks.filter(Boolean).length / profileChecks.length) * 100
    );

    // 7. Calculate real dynamic Placement Readiness score
    const codingPart = (student.codingScore || 0) * 0.30;
    const aptitudePart = (student.aptitudeScore || 0) * 0.25;
    const reasoningPart = (student.reasoningScore || 0) * 0.15;
    const commPart = (student.communicationScore || 0) * 0.10;
    const roadmapPart = roadmapProgressPercentage * 0.10;
    const profilePart = profileCompleteness * 0.10;

    const calculatedReadiness = Math.min(
      100,
      Math.round(codingPart + aptitudePart + reasoningPart + commPart + roadmapPart + profilePart)
    );

    // Update student's placementReadiness in database if altered
    if (Math.abs(calculatedReadiness - (student.placementReadiness || 0)) >= 1) {
      await withDbRetry(() =>
        prisma.student.update({
          where: { id: student.id },
          data: { placementReadiness: calculatedReadiness },
        })
      );
    }

    // 8. Fetch real published upcoming assessments
    const upcomingAssessments = await withDbRetry(() =>
      prisma.assessment.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          title: true,
          type: true,
          duration: true,
          totalQuestions: true,
          difficulty: true,
        },
      })
    );

    // 9. Fetch published mock tests
    const mockTestsCount = await withDbRetry(() =>
      prisma.mockTest.count({ where: { status: "PUBLISHED" } })
    );
    const mockAttemptsCount = await withDbRetry(() =>
      prisma.mockTestAttempt.count({ where: { studentId: student.id } })
    );

    // 10. Generate Actionable Real Reminders
    const reminders: Array<{
      id: string;
      title: string;
      description: string;
      actionLabel: string;
      actionUrl: string;
      priority: "HIGH" | "MEDIUM" | "LOW";
    }> = [];

    if (profileCompleteness < 80) {
      reminders.push({
        id: "rem-profile",
        title: "Complete Your Placement Profile",
        description: `Profile is currently ${profileCompleteness}% complete. Add your academic metrics, skills, and projects to unlock full placement readiness.`,
        actionLabel: "Complete Profile",
        actionUrl: "/student/profile",
        priority: "HIGH",
      });
    }

    if (!student.projects || student.projects.length === 0) {
      reminders.push({
        id: "rem-resume",
        title: "Create Campus Placement Resume",
        description: "Add your technical projects and download verified resumes in PDF or Word DOCX format.",
        actionLabel: "Create Resume",
        actionUrl: "/student/resume",
        priority: "HIGH",
      });
    }

    if (mockTestsCount > 0 && mockAttemptsCount === 0) {
      reminders.push({
        id: "rem-mock",
        title: "Attempt Full-Length Mock Test",
        description: "Experience the complete 4-level assessment including Aptitude, Verbal, Theory, and Live Coding.",
        actionLabel: "Start Mock Test",
        actionUrl: "/student/mock-tests",
        priority: "MEDIUM",
      });
    }

    if (upcomingAssessments.length > 0) {
      reminders.push({
        id: "rem-assess",
        title: "Placement Assignment Available",
        description: `Benchmark assignment "${upcomingAssessments[0].title}" is ready for completion.`,
        actionLabel: "Start Assignment",
        actionUrl: "/student/assignments",
        priority: "MEDIUM",
      });
    }

    if (roadmapProgressPercentage < 50) {
      reminders.push({
        id: "rem-roadmap",
        title: "Advance Placement Roadmap",
        description: "You have upcoming modules in Data Structures and Core Computer Science.",
        actionLabel: "View Roadmap",
        actionUrl: "/student/roadmap",
        priority: "LOW",
      });
    }

    // 11. Data-Driven Recommended Next Step
    let recommendedNextStep = {
      id: "rec-default",
      title: "Continue Full Practice",
      description: "Keep taking assessments and benchmark mock tests to raise your placement readiness score.",
      actionLabel: "View Assignments",
      actionUrl: "/student/assignments",
    };

    if (profileCompleteness < 70) {
      recommendedNextStep = {
        id: "rec-profile",
        title: "Complete Your Placement Profile",
        description: "Recruiters evaluate candidate profiles with complete CGPA, projects, and skills first.",
        actionLabel: "Update Profile",
        actionUrl: "/student/profile",
      };
    } else if ((student.codingScore || 0) < 50) {
      recommendedNextStep = {
        id: "rec-coding",
        title: "Practice Arrays, Strings & Algorithms",
        description: "Your coding score is currently your highest-leverage area for placement screening drives.",
        actionLabel: "Start Coding Practice",
        actionUrl: "/student/assessments/coding",
      };
    } else if ((student.aptitudeScore || 0) < 50) {
      recommendedNextStep = {
        id: "rec-aptitude",
        title: "Complete Quantitative Aptitude Practice",
        description: "Aptitude and speed math are required to clear initial campus screening cutoffs.",
        actionLabel: "Start Aptitude Test",
        actionUrl: "/student/assessments/aptitude",
      };
    } else if (mockAttemptsCount === 0) {
      recommendedNextStep = {
        id: "rec-mock",
        title: "Take Full-Length 4-Level Mock Test",
        description: "Simulate a live recruitment drive with Aptitude, Verbal, Course Theory, and Coding.",
        actionLabel: "Start Mock Test",
        actionUrl: "/student/mock-tests",
      };
    } else {
      recommendedNextStep = {
        id: "rec-resume",
        title: "Export Your Campus Placement Resume",
        description: "Generate and download your ATS-ready resume in PDF or Word DOCX format.",
        actionLabel: "Open Resume Creator",
        actionUrl: "/student/resume",
      };
    }

    // 12. Compute KPI deltas
    function computeDelta(area?: string) {
      const records = area
        ? allPerformanceRecords.filter((r) => r.skillArea.toLowerCase() === area.toLowerCase())
        : allPerformanceRecords;

      if (records.length >= 2) {
        const curr = records[records.length - 1];
        const prev = records[records.length - 2];
        const diff = Math.round(curr.percentage - prev.percentage);
        if (diff > 0) {
          return { change: `+${diff}% from last period`, changeType: "positive" as const };
        } else if (diff < 0) {
          return { change: `${diff}% from last period`, changeType: "negative" as const };
        } else {
          return { change: "0% from last period", changeType: "neutral" as const };
        }
      }

      if (records.length === 1) {
        return { change: "Baseline recorded", changeType: "neutral" as const };
      }

      return { change: "Initial baseline", changeType: "neutral" as const };
    }

    const readinessDelta = computeDelta();
    const codingDelta = computeDelta("coding");
    const aptitudeDelta = computeDelta("aptitude");
    const communicationDelta = computeDelta("communication");

    return NextResponse.json({
      student: {
        id: student.id,
        name: dbUser.name,
        email: dbUser.email,
        rollNumber: student.rollNumber,
        department: student.department,
        year: student.year,
        placementReadiness: calculatedReadiness,
        overallScore: student.overallScore,
        codingScore: student.codingScore,
        aptitudeScore: student.aptitudeScore,
        reasoningScore: student.reasoningScore,
        communicationScore: student.communicationScore,
        trend: student.trend,
        profileCompleteness,
      },
      kpiDeltas: {
        placementReadiness: readinessDelta,
        coding: codingDelta,
        aptitude: aptitudeDelta,
        communication: communicationDelta,
      },
      performanceHistory: performanceRecords.map((r) => ({
        id: r.id,
        month: r.month,
        date: r.completedAt.toISOString().split("T")[0],
        overall: r.percentage,
        score: r.score,
        maxScore: r.maxScore,
        title: r.title,
      })),
      focusAreas: focusAreas.map((fa) => ({
        id: fa.id,
        skill: fa.skill,
        status: fa.status,
        currentScore: fa.currentScore,
        targetScore: fa.targetScore,
        suggestion: fa.suggestion,
      })),
      reminders,
      recommendedNextStep,
      upcomingAssessments,
      roadmap: {
        totalItems: totalRoadmapItems,
        completedItems: completedRoadmapItems,
        progressPercentage: roadmapProgressPercentage,
      },
    });
  } catch (error) {
    console.error("GET /api/student/dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data." },
      { status: 500 }
    );
  }
}
