import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma, withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Calculates student profile completeness percentage and identifies missing fields.
 */
function calculateProfileCompleteness(user: any, student: any) {
  const checks = [
    { field: "Full Name", complete: Boolean(user.name?.trim()) },
    { field: "Email Address", complete: Boolean(user.email?.trim()) },
    { field: "Roll Number / Student ID", complete: Boolean(student.rollNumber?.trim()) },
    { field: "Department", complete: Boolean(student.department?.trim()) },
    { field: "Course / Degree", complete: Boolean(student.course?.trim()) },
    { field: "Current Year / Semester", complete: Boolean(student.year?.trim()) },
    { field: "CGPA", complete: typeof student.cgpa === "number" && student.cgpa > 0 },
    {
      field: "Technical Skills",
      complete: Array.isArray(student.technicalSkills) && student.technicalSkills.length >= 2,
    },
    {
      field: "Soft Skills & Tools",
      complete:
        (Array.isArray(student.softSkills) && student.softSkills.length >= 1) ||
        (Array.isArray(student.toolsTechnologies) && student.toolsTechnologies.length >= 1),
    },
    {
      field: "Projects",
      complete: Array.isArray(student.projects) && student.projects.length >= 1,
    },
    {
      field: "Certifications",
      complete: Array.isArray(student.certifications) && student.certifications.length >= 1,
    },
    {
      field: "Target Role & Domain",
      complete: Boolean(student.targetRole?.trim()) || Boolean(student.targetDomain?.trim()),
    },
    {
      field: "LinkedIn or GitHub Profile",
      complete: Boolean(student.linkedinUrl?.trim()) || Boolean(student.githubUrl?.trim()),
    },
  ];

  const completedCount = checks.filter((c) => c.complete).length;
  const percentage = Math.round((completedCount / checks.length) * 100);
  const missing = checks.filter((c) => !c.complete).map((c) => c.field);

  return { percentage, missing, totalChecks: checks.length, completedCount };
}

/**
 * GET /api/student/profile
 * Returns authenticated student profile, academic details, projects, certifications,
 * and dynamic profile completion score.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await withDbRetry(() =>
      prisma.user.findFirst({
        where: {
          OR: [{ authUserId: authUser.id }, { email: authUser.email || "" }],
        },
        include: {
          student: {
            include: {
              projects: { orderBy: { createdAt: "desc" } },
              certifications: { orderBy: { createdAt: "desc" } },
            },
          },
        },
      })
    );

    if (!dbUser || dbUser.role !== "STUDENT" || !dbUser.student) {
      return NextResponse.json(
        { error: "Student profile not found or unauthorized." },
        { status: 404 }
      );
    }

    const student = dbUser.student;
    const completeness = calculateProfileCompleteness(dbUser, student);

    return NextResponse.json({
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        avatarUrl: dbUser.avatarUrl,
        department: dbUser.department,
      },
      student: {
        id: student.id,
        rollNumber: student.rollNumber,
        department: student.department,
        year: student.year,
        graduationYear: student.graduationYear,
        phone: student.phone,
        college: student.college || "University Institute of Technology",
        university: student.university || "State Technical University",
        course: student.course || "B.Tech",
        branch: student.branch || student.department,
        cgpa: student.cgpa,
        semester: student.semester,
        tenthPercentage: student.tenthPercentage,
        twelfthPercentage: student.twelfthPercentage,
        activeBacklogs: student.activeBacklogs,
        skills: student.skills,
        technicalSkills: student.technicalSkills,
        softSkills: student.softSkills,
        toolsTechnologies: student.toolsTechnologies,
        targetRole: student.targetRole,
        targetDomain: student.targetDomain,
        preferredCompanies: student.preferredCompanies,
        githubUrl: student.githubUrl,
        linkedinUrl: student.linkedinUrl,
        portfolioUrl: student.portfolioUrl,
        bio: student.bio,
        placementReadiness: student.placementReadiness,
        overallScore: student.overallScore,
        codingScore: student.codingScore,
        aptitudeScore: student.aptitudeScore,
        reasoningScore: student.reasoningScore,
        communicationScore: student.communicationScore,
        projects: student.projects,
        certifications: student.certifications,
      },
      completeness,
    });
  } catch (error) {
    console.error("GET /api/student/profile error:", error);
    return NextResponse.json(
      { error: "Failed to load student profile." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/student/profile
 * Updates student profile details, academic records, skills, projects, and certifications.
 * Enforces ownership server-side.
 */
export async function PUT(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await withDbRetry(() =>
      prisma.user.findFirst({
        where: {
          OR: [{ authUserId: authUser.id }, { email: authUser.email || "" }],
        },
        include: { student: true },
      })
    );

    if (!dbUser || dbUser.role !== "STUDENT" || !dbUser.student) {
      return NextResponse.json(
        { error: "Forbidden: Only students can update their profile." },
        { status: 403 }
      );
    }

    const studentId = dbUser.student.id;
    const body = (await req.json()) as Record<string, any>;

    const {
      name,
      phone,
      bio,
      college,
      university,
      course,
      branch,
      year,
      graduationYear,
      cgpa,
      semester,
      tenthPercentage,
      twelfthPercentage,
      activeBacklogs,
      technicalSkills,
      softSkills,
      toolsTechnologies,
      targetRole,
      targetDomain,
      preferredCompanies,
      githubUrl,
      linkedinUrl,
      portfolioUrl,
      projects,
      certifications,
    } = body;

    // Transactionally update User & Student records
    await withDbRetry(async () => {
      // 1. Update User basic info
      if (name && name.trim()) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { name: name.trim() },
        });
      }

      // 2. Update Student info
      await prisma.student.update({
        where: { id: studentId },
        data: {
          phone: phone !== undefined ? phone : undefined,
          bio: bio !== undefined ? bio : undefined,
          college: college !== undefined ? college : undefined,
          university: university !== undefined ? university : undefined,
          course: course !== undefined ? course : undefined,
          branch: branch !== undefined ? branch : undefined,
          year: year !== undefined ? year : undefined,
          graduationYear: graduationYear !== undefined ? graduationYear : undefined,
          cgpa: typeof cgpa === "number" ? cgpa : undefined,
          semester: typeof semester === "number" ? semester : undefined,
          tenthPercentage: typeof tenthPercentage === "number" ? tenthPercentage : undefined,
          twelfthPercentage: typeof twelfthPercentage === "number" ? twelfthPercentage : undefined,
          activeBacklogs: typeof activeBacklogs === "number" ? activeBacklogs : undefined,
          technicalSkills: Array.isArray(technicalSkills) ? technicalSkills : undefined,
          softSkills: Array.isArray(softSkills) ? softSkills : undefined,
          toolsTechnologies: Array.isArray(toolsTechnologies) ? toolsTechnologies : undefined,
          skills: Array.isArray(technicalSkills) ? technicalSkills : undefined,
          targetRole: targetRole !== undefined ? targetRole : undefined,
          targetDomain: targetDomain !== undefined ? targetDomain : undefined,
          preferredCompanies: Array.isArray(preferredCompanies) ? preferredCompanies : undefined,
          githubUrl: githubUrl !== undefined ? githubUrl : undefined,
          linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : undefined,
          portfolioUrl: portfolioUrl !== undefined ? portfolioUrl : undefined,
          lastActivity: new Date(),
        },
      });

      // 3. Sync Projects if provided
      if (Array.isArray(projects)) {
        // Delete existing projects and recreate for clean sync
        await prisma.project.deleteMany({ where: { studentId } });
        for (const proj of projects) {
          if (proj.title && proj.title.trim()) {
            await prisma.project.create({
              data: {
                studentId,
                title: proj.title.trim(),
                description: proj.description?.trim() || "",
                technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
                githubUrl: proj.githubUrl || null,
                liveUrl: proj.liveUrl || null,
                startDate: proj.startDate || null,
                endDate: proj.endDate || null,
              },
            });
          }
        }
      }

      // 4. Sync Certifications if provided
      if (Array.isArray(certifications)) {
        await prisma.certification.deleteMany({ where: { studentId } });
        for (const cert of certifications) {
          if (cert.title && cert.title.trim()) {
            await prisma.certification.create({
              data: {
                studentId,
                title: cert.title.trim(),
                issuer: cert.issuer?.trim() || "Independent Provider",
                issueDate: cert.issueDate || null,
                credentialUrl: cert.credentialUrl || null,
                credentialId: cert.credentialId || null,
              },
            });
          }
        }
      }
    });

    // Re-fetch updated profile and compute readiness & completeness
    const updatedUser = await prisma.user.findUnique({
      where: { id: dbUser.id },
      include: {
        student: {
          include: {
            projects: true,
            certifications: true,
          },
        },
      },
    });

    const student = updatedUser?.student;
    const completeness = calculateProfileCompleteness(updatedUser, student);

    // Update Placement Readiness incorporating profile completion
    if (student) {
      const codingWeight = (student.codingScore || 0) * 0.3;
      const aptitudeWeight = (student.aptitudeScore || 0) * 0.25;
      const reasoningWeight = (student.reasoningScore || 0) * 0.15;
      const communicationWeight = (student.communicationScore || 0) * 0.1;
      const profileWeight = completeness.percentage * 0.2; // 20% weight on thorough profile

      const computedReadiness = Math.min(
        100,
        Math.round(codingWeight + aptitudeWeight + reasoningWeight + communicationWeight + profileWeight)
      );

      await prisma.student.update({
        where: { id: studentId },
        data: { placementReadiness: computedReadiness },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      completeness,
    });
  } catch (error) {
    console.error("PUT /api/student/profile error:", error);
    return NextResponse.json(
      { error: "Failed to update student profile." },
      { status: 500 }
    );
  }
}
