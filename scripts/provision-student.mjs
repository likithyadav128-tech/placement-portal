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

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

if (!dbUrl) {
  console.error("❌ Missing DATABASE_URL / DIRECT_URL.");
  process.exit(1);
}

const targetEmail = "likithyadav128@gmail.com";
const targetName = "Likith Yadav";
const targetRollNumber = "122411520237";
const targetDepartment = "Artificial Intelligence and Data Science";
const targetYear = "3rd Year";

async function main() {
  console.log("🔍 Looking up Supabase Auth user for:", targetEmail);

  // 1. Read-only lookup of Supabase Auth user
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) {
    console.error("❌ Failed to query Supabase Auth:", authError.message);
    process.exit(1);
  }

  const matchingAuthUsers = authData.users.filter(
    (u) => u.email?.toLowerCase() === targetEmail.toLowerCase()
  );

  if (matchingAuthUsers.length === 0) {
    console.error(`❌ No Supabase Auth user found with email: ${targetEmail}`);
    console.error("   Please ensure the user exists in Supabase Auth before running this script.");
    process.exit(1);
  }

  const authUser = matchingAuthUsers[0];
  console.log(`✅ Found Auth user (auth.users.id confirmed)`);

  // 2. Safe, idempotent PostgreSQL provisioning via Prisma
  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  try {
    // 2A. Find or create public.User
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: targetEmail },
          { authUserId: authUser.id },
        ],
      },
    });

    let userAction = "ALREADY EXISTED";

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          authUserId: authUser.id,
          email: targetEmail,
          name: targetName,
          role: "STUDENT",
          status: "ACTIVE",
          department: targetDepartment,
        },
      });
      userAction = "CREATED";
    } else if (dbUser.authUserId !== authUser.id) {
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { authUserId: authUser.id },
      });
      userAction = "UPDATED (Linked authUserId)";
    }

    // 2B. Find or create public.Student
    let dbStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { userId: dbUser.id },
          { rollNumber: targetRollNumber },
        ],
      },
    });

    let studentAction = "ALREADY EXISTED";

    if (!dbStudent) {
      dbStudent = await prisma.student.create({
        data: {
          userId: dbUser.id,
          rollNumber: targetRollNumber,
          department: targetDepartment,
          year: targetYear,
          graduationYear: null,
          phone: null,
          skills: [],
        },
      });
      studentAction = "CREATED";
    } else if (dbStudent.userId !== dbUser.id) {
      dbStudent = await prisma.student.update({
        where: { id: dbStudent.id },
        data: { userId: dbUser.id },
      });
      studentAction = "UPDATED (Linked to public.User)";
    }

    // 3. Read-only verification queries
    const totalUserCount = await prisma.user.count();
    const totalStudentCount = await prisma.student.count();
    const authUserCountForEmail = matchingAuthUsers.length;

    console.log("\n==========================================");
    console.log("=== PROVISIONING & VERIFICATION RESULT ===");
    console.log("==========================================");
    console.log(`public.User Action:          ${userAction}`);
    console.log(`public.Student Action:       ${studentAction}`);
    console.log("------------------------------------------");
    console.log(`Total public.User count:     ${totalUserCount}`);
    console.log(`Total public.Student count:  ${totalStudentCount}`);
    console.log(`Auth user count for email:   ${authUserCountForEmail}`);
    console.log(`Created/Resolved User ID:    ${dbUser.id}`);
    console.log(`Linked authUserId:           ${dbUser.authUserId}`);
    console.log(`Student Roll Number:         ${dbStudent.rollNumber}`);
    console.log(`User Role:                   ${dbUser.role}`);
    console.log(`User Status:                 ${dbUser.status}`);
    console.log(`User Department:             ${dbUser.department}`);
    console.log(`Student Year:                ${dbStudent.year}`);
    console.log("==========================================\n");
  } catch (err) {
    console.error("❌ Database operation failed:", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
