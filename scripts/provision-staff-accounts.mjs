import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Load environment variables (.env.local overrides .env)
dotenv.config({ path: path.join(rootDir, ".env") });
dotenv.config({ path: path.join(rootDir, ".env.local"), override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (dbUrl && !dbUrl.includes("pgbouncer=true") && dbUrl.includes(":6543")) {
  dbUrl += (dbUrl.includes("?") ? "&" : "?") + "pgbouncer=true";
}

// ----------------------------------------------------------------------
// 1. Validate Infrastructure Configuration & Required Passwords
// ----------------------------------------------------------------------
if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

if (!dbUrl) {
  console.error("❌ Missing DATABASE_URL / DIRECT_URL.");
  process.exit(1);
}

const facultyPassword = process.env.FACULTY_TEST_PASSWORD;
const managementPassword = process.env.MANAGEMENT_TEST_PASSWORD;

if (!facultyPassword) {
  console.error("❌ Missing required environment variable: FACULTY_TEST_PASSWORD");
  console.error("   Please set FACULTY_TEST_PASSWORD before running this script.");
  process.exit(1);
}

if (!managementPassword) {
  console.error("❌ Missing required environment variable: MANAGEMENT_TEST_PASSWORD");
  console.error("   Please set MANAGEMENT_TEST_PASSWORD before running this script.");
  process.exit(1);
}

if (facultyPassword.length < 6 || managementPassword.length < 6) {
  console.error("❌ Passwords must be at least 6 characters long for Supabase Auth.");
  process.exit(1);
}

// ----------------------------------------------------------------------
// 2. Specifications & Constants
// ----------------------------------------------------------------------
const TARGET_STUDENT_ID = "05236f72-0bb5-4df3-a8b8-760cd62891ac";
const TARGET_STUDENT_EMAIL = "likithyadav128@gmail.com";

const FACULTY_SPEC = {
  email: "faculty@placeprep.edu",
  name: "Dr. Rajesh Kumar",
  role: "FACULTY",
  status: "ACTIVE",
  department: "Artificial Intelligence and Data Science",
  employeeId: "FAC2026001",
  designation: "Associate Professor",
  facultyStatus: "active",
};

const MANAGEMENT_SPEC = {
  email: "management@placeprep.edu",
  name: "Directorate of Placement",
  role: "MANAGEMENT",
  status: "ACTIVE",
  department: "Placement & Training Cell",
};

async function main() {
  console.log("==================================================================");
  console.log("🛡️  STAFF ACCOUNTS PROVISIONING (FACULTY & MANAGEMENT)");
  console.log("    Strict preflight validation, non-destructive, idempotent");
  console.log("==================================================================\n");

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  try {
    // ==================================================================
    // PHASE 1: COMPREHENSIVE PREFLIGHT VALIDATION (STRICTLY READ-ONLY)
    // ==================================================================
    console.log("🔍 [PREFLIGHT] Running comprehensive conflict and safety checks...\n");

    // Preflight 1: Target Student Verification & Baseline
    const targetStudent = await prisma.student.findUnique({
      where: { id: TARGET_STUDENT_ID },
      include: {
        user: true,
        assessmentAttempts: true,
        performanceHistory: true,
        recommendations: true,
        assignedFaculty: true,
      },
    });

    if (!targetStudent) {
      throw new Error(`PREFLIGHT FAILED: Target student ID ${TARGET_STUDENT_ID} does not exist in public.Student.`);
    }

    if (targetStudent.user.email.toLowerCase() !== TARGET_STUDENT_EMAIL.toLowerCase()) {
      throw new Error(
        `PREFLIGHT FAILED: Target student ID ${TARGET_STUDENT_ID} belongs to ${targetStudent.user.email}, expected ${TARGET_STUDENT_EMAIL}.`
      );
    }

    console.log(`  ✅ Preflight 1 Passed: Target student verified`);
    console.log(`     - Name: ${targetStudent.user.name}`);
    console.log(`     - Email: ${targetStudent.user.email}`);
    console.log(`     - Roll Number: ${targetStudent.rollNumber}`);
    console.log(`     - Baseline Attempts: ${targetStudent.assessmentAttempts.length} (must remain 6)`);
    console.log(`     - Baseline Performance Records: ${targetStudent.performanceHistory.length} (must remain 4)`);
    console.log(`     - Baseline Recommendations: ${targetStudent.recommendations.length} (must remain 4)`);

    // Preflight 2: Supabase Auth Inspection
    const { data: authUsersData, error: authListError } = await supabaseAdmin.auth.admin.listUsers();
    if (authListError) {
      throw new Error(`PREFLIGHT FAILED: Unable to query Supabase Auth: ${authListError.message}`);
    }

    const existingFacultyAuth = authUsersData.users.find(
      (u) => u.email?.toLowerCase() === FACULTY_SPEC.email.toLowerCase()
    );
    const existingMgmtAuth = authUsersData.users.find(
      (u) => u.email?.toLowerCase() === MANAGEMENT_SPEC.email.toLowerCase()
    );

    console.log(`  ✅ Preflight 2 Passed: Supabase Auth inspected`);
    console.log(`     - Faculty Auth (${FACULTY_SPEC.email}): ${existingFacultyAuth ? `Exists (UID: ${existingFacultyAuth.id})` : "Not present (Will create)"}`);
    console.log(`     - Management Auth (${MANAGEMENT_SPEC.email}): ${existingMgmtAuth ? `Exists (UID: ${existingMgmtAuth.id})` : "Not present (Will create)"}`);

    // Preflight 3: public.User Conflict Check for Faculty
    const existingFacultyUser = await prisma.user.findUnique({
      where: { email: FACULTY_SPEC.email },
    });

    if (existingFacultyUser) {
      if (existingFacultyUser.role !== "FACULTY") {
        throw new Error(
          `PREFLIGHT CONFLICT: public.User with email ${FACULTY_SPEC.email} exists with role ${existingFacultyUser.role}, expected FACULTY.`
        );
      }
      if (existingFacultyAuth && existingFacultyUser.authUserId && existingFacultyUser.authUserId !== existingFacultyAuth.id) {
        throw new Error(
          `PREFLIGHT CONFLICT: public.User ${FACULTY_SPEC.email} has authUserId ${existingFacultyUser.authUserId} which does not match Supabase Auth UID ${existingFacultyAuth.id}.`
        );
      }
      console.log(`  ✅ Preflight 3 Passed: Faculty public.User exists and is safe to reuse`);
    } else {
      console.log(`  ✅ Preflight 3 Passed: Faculty public.User does not exist (Will create)`);
    }

    // Preflight 4: public.User Conflict Check for Management
    const existingMgmtUser = await prisma.user.findUnique({
      where: { email: MANAGEMENT_SPEC.email },
    });

    if (existingMgmtUser) {
      if (existingMgmtUser.role !== "MANAGEMENT") {
        throw new Error(
          `PREFLIGHT CONFLICT: public.User with email ${MANAGEMENT_SPEC.email} exists with role ${existingMgmtUser.role}, expected MANAGEMENT.`
        );
      }
      if (existingMgmtAuth && existingMgmtUser.authUserId && existingMgmtUser.authUserId !== existingMgmtAuth.id) {
        throw new Error(
          `PREFLIGHT CONFLICT: public.User ${MANAGEMENT_SPEC.email} has authUserId ${existingMgmtUser.authUserId} which does not match Supabase Auth UID ${existingMgmtAuth.id}.`
        );
      }
      console.log(`  ✅ Preflight 4 Passed: Management public.User exists and is safe to reuse`);
    } else {
      console.log(`  ✅ Preflight 4 Passed: Management public.User does not exist (Will create)`);
    }

    // Preflight 5: Employee ID Uniqueness Check
    const existingFacultyByEmpId = await prisma.faculty.findUnique({
      where: { employeeId: FACULTY_SPEC.employeeId },
      include: { user: true },
    });

    if (existingFacultyByEmpId) {
      if (existingFacultyByEmpId.user.email.toLowerCase() !== FACULTY_SPEC.email.toLowerCase()) {
        throw new Error(
          `PREFLIGHT CONFLICT: Employee ID ${FACULTY_SPEC.employeeId} is already assigned to a different user (${existingFacultyByEmpId.user.email}).`
        );
      }
      console.log(`  ✅ Preflight 5 Passed: Employee ID ${FACULTY_SPEC.employeeId} is assigned to ${FACULTY_SPEC.email} (Safe to reuse)`);
    } else {
      console.log(`  ✅ Preflight 5 Passed: Employee ID ${FACULTY_SPEC.employeeId} is available`);
    }

    // Preflight 6: Faculty Profile Uniqueness Check
    if (existingFacultyUser) {
      const existingFacultyByUserId = await prisma.faculty.findUnique({
        where: { userId: existingFacultyUser.id },
      });
      if (existingFacultyByUserId && existingFacultyByUserId.employeeId !== FACULTY_SPEC.employeeId) {
        throw new Error(
          `PREFLIGHT CONFLICT: Faculty user ${FACULTY_SPEC.email} already has profile with different employeeId ${existingFacultyByUserId.employeeId}.`
        );
      }
    }
    console.log(`  ✅ Preflight 6 Passed: Faculty profile relation verified`);

    // Preflight 7: FacultyStudentAssignment Check
    let existingAssignment = null;
    if (existingFacultyByEmpId) {
      existingAssignment = await prisma.facultyStudentAssignment.findUnique({
        where: {
          facultyId_studentId: {
            facultyId: existingFacultyByEmpId.id,
            studentId: TARGET_STUDENT_ID,
          },
        },
      });
    }
    console.log(`  ✅ Preflight 7 Passed: Assignment check complete (${existingAssignment ? "Already assigned" : "Will create assignment"})`);

    console.log("\n==================================================================");
    console.log("✅ ALL PREFLIGHT CHECKS PASSED — PROCEEDING WITH PROVISIONING");
    console.log("==================================================================\n");

    // ==================================================================
    // PHASE 2: SAFE, NON-DESTRUCTIVE PROVISIONING
    // ==================================================================

    // ------------------------------------------------------------------
    // STEP A: Faculty Account Provisioning
    // ------------------------------------------------------------------
    let facultyAuthUid = existingFacultyAuth?.id;

    if (!existingFacultyAuth) {
      console.log(`🆕 Creating Supabase Auth account for ${FACULTY_SPEC.email}...`);
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: FACULTY_SPEC.email,
        password: facultyPassword,
        email_confirm: true,
        user_metadata: { name: FACULTY_SPEC.name, role: FACULTY_SPEC.role },
      });
      if (createError) {
        throw new Error(`Failed to create Auth user for ${FACULTY_SPEC.email}: ${createError.message}`);
      }
      facultyAuthUid = createData.user.id;
      console.log(`   ✅ Supabase Auth user created (UID: ${facultyAuthUid})`);
    } else {
      console.log(`ℹ️  Supabase Auth user already exists for ${FACULTY_SPEC.email} (UID: ${facultyAuthUid}). Password unchanged.`);
    }

    // public.User for Faculty
    let facultyUser = existingFacultyUser;
    if (!facultyUser) {
      console.log(`🆕 Creating public.User for ${FACULTY_SPEC.email}...`);
      facultyUser = await prisma.user.create({
        data: {
          authUserId: facultyAuthUid,
          email: FACULTY_SPEC.email,
          name: FACULTY_SPEC.name,
          role: "FACULTY",
          status: "ACTIVE",
          department: FACULTY_SPEC.department,
        },
      });
      console.log(`   ✅ public.User created (ID: ${facultyUser.id})`);
    } else {
      if (!facultyUser.authUserId && facultyAuthUid) {
        facultyUser = await prisma.user.update({
          where: { id: facultyUser.id },
          data: { authUserId: facultyAuthUid },
        });
        console.log(`   ✅ Linked authUserId to existing public.User (ID: ${facultyUser.id})`);
      } else {
        console.log(`ℹ️  public.User already linked (ID: ${facultyUser.id})`);
      }
    }

    // public.Faculty
    let facultyProfile = existingFacultyByEmpId;
    if (!facultyProfile) {
      console.log(`🆕 Creating public.Faculty profile for ${FACULTY_SPEC.email}...`);
      facultyProfile = await prisma.faculty.create({
        data: {
          userId: facultyUser.id,
          employeeId: FACULTY_SPEC.employeeId,
          department: FACULTY_SPEC.department,
          designation: FACULTY_SPEC.designation,
          status: FACULTY_SPEC.facultyStatus,
        },
      });
      console.log(`   ✅ public.Faculty created (ID: ${facultyProfile.id}, EmpId: ${facultyProfile.employeeId})`);
    } else {
      console.log(`ℹ️  public.Faculty profile already exists (ID: ${facultyProfile.id})`);
    }

    // FacultyStudentAssignment
    if (!existingAssignment) {
      const assignment = await prisma.facultyStudentAssignment.create({
        data: {
          facultyId: facultyProfile.id,
          studentId: TARGET_STUDENT_ID,
        },
      });
      console.log(`   ✅ FacultyStudentAssignment created (ID: ${assignment.id})`);
    } else {
      console.log(`ℹ️  FacultyStudentAssignment already exists (ID: ${existingAssignment.id})`);
    }

    // ------------------------------------------------------------------
    // STEP B: Management Account Provisioning
    // ------------------------------------------------------------------
    let mgmtAuthUid = existingMgmtAuth?.id;

    if (!existingMgmtAuth) {
      console.log(`\n🆕 Creating Supabase Auth account for ${MANAGEMENT_SPEC.email}...`);
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: MANAGEMENT_SPEC.email,
        password: managementPassword,
        email_confirm: true,
        user_metadata: { name: MANAGEMENT_SPEC.name, role: MANAGEMENT_SPEC.role },
      });
      if (createError) {
        throw new Error(`Failed to create Auth user for ${MANAGEMENT_SPEC.email}: ${createError.message}`);
      }
      mgmtAuthUid = createData.user.id;
      console.log(`   ✅ Supabase Auth user created (UID: ${mgmtAuthUid})`);
    } else {
      console.log(`\nℹ️  Supabase Auth user already exists for ${MANAGEMENT_SPEC.email} (UID: ${mgmtAuthUid}). Password unchanged.`);
    }

    // public.User for Management (no separate profile table needed)
    let mgmtUser = existingMgmtUser;
    if (!mgmtUser) {
      console.log(`🆕 Creating public.User for ${MANAGEMENT_SPEC.email}...`);
      mgmtUser = await prisma.user.create({
        data: {
          authUserId: mgmtAuthUid,
          email: MANAGEMENT_SPEC.email,
          name: MANAGEMENT_SPEC.name,
          role: "MANAGEMENT",
          status: "ACTIVE",
          department: MANAGEMENT_SPEC.department,
        },
      });
      console.log(`   ✅ public.User created (ID: ${mgmtUser.id}, Role: MANAGEMENT)`);
    } else {
      if (!mgmtUser.authUserId && mgmtAuthUid) {
        mgmtUser = await prisma.user.update({
          where: { id: mgmtUser.id },
          data: { authUserId: mgmtAuthUid },
        });
        console.log(`   ✅ Linked authUserId to existing public.User (ID: ${mgmtUser.id})`);
      } else {
        console.log(`ℹ️  public.User already linked (ID: ${mgmtUser.id})`);
      }
    }

    // ==================================================================
    // PHASE 3: POST-PROVISIONING READ-ONLY INTEGRITY VERIFICATION
    // ==================================================================
    console.log("\n==================================================================");
    console.log("🔍 [VERIFICATION] Verifying all accounts and student data integrity...");
    console.log("==================================================================\n");

    const finalStudent = await prisma.student.findUnique({
      where: { id: TARGET_STUDENT_ID },
      include: {
        user: true,
        assessmentAttempts: { orderBy: { startedAt: "desc" } },
        performanceHistory: { orderBy: { completedAt: "desc" } },
        recommendations: { orderBy: { createdAt: "desc" } },
        assignedFaculty: { include: { faculty: { include: { user: true } } } },
      },
    });

    console.log("1. Likith Yadav Student Verification:");
    console.log(`   - User ID: ${finalStudent.user.id}`);
    console.log(`   - Student ID: ${finalStudent.id}`);
    console.log(`   - Scores: Overall=${finalStudent.overallScore}, Coding=${finalStudent.codingScore}, Aptitude=${finalStudent.aptitudeScore}, Readiness=${finalStudent.placementReadiness}`);
    console.log(`   - Attempts Count: ${finalStudent.assessmentAttempts.length} (Expected: 6)`);
    console.log(`   - Performance Records Count: ${finalStudent.performanceHistory.length} (Expected: 4)`);
    console.log(`   - Recommendations Count: ${finalStudent.recommendations.length} (Expected: 4)`);
    console.log(`   - Assigned Faculty Count: ${finalStudent.assignedFaculty.length} (Expected: 1)`);

    if (
      finalStudent.assessmentAttempts.length !== 6 ||
      finalStudent.performanceHistory.length !== 4 ||
      finalStudent.recommendations.length !== 4
    ) {
      throw new Error("POST-CHECK FAILED: Student record counts do not match expected baselines!");
    }

    console.log("\n2. Faculty Profile Verification:");
    console.log(`   - User ID: ${facultyUser.id}`);
    console.log(`   - Faculty ID: ${facultyProfile.id}`);
    console.log(`   - Employee ID: ${facultyProfile.employeeId}`);
    console.log(`   - Designation: ${facultyProfile.designation}`);
    console.log(`   - Assigned to Student: ${finalStudent.user.name} (${finalStudent.rollNumber})`);

    console.log("\n3. Management Profile Verification:");
    console.log(`   - User ID: ${mgmtUser.id}`);
    console.log(`   - Email: ${mgmtUser.email}`);
    console.log(`   - Role: ${mgmtUser.role}`);
    console.log(`   - Status: ${mgmtUser.status}`);

    const [totalUsers, totalFaculty, totalAssignments] = await Promise.all([
      prisma.user.count(),
      prisma.faculty.count(),
      prisma.facultyStudentAssignment.count(),
    ]);

    console.log("\n4. Database Table Totals:");
    console.log(`   - Total public.User records: ${totalUsers}`);
    console.log(`   - Total public.Faculty records: ${totalFaculty}`);
    console.log(`   - Total FacultyStudentAssignment records: ${totalAssignments}`);

    console.log("\n🎉 PROVISIONING AND VERIFICATION COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("\n❌ Operation halted:", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
