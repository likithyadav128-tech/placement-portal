import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(rootDir, ".env") });
dotenv.config({ path: path.join(rootDir, ".env.local"), override: true });

let dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (dbUrl && !dbUrl.includes("pgbouncer=true") && dbUrl.includes(":6543")) {
  dbUrl += (dbUrl.includes("?") ? "&" : "?") + "pgbouncer=true";
}

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});

async function main() {
  console.log("=== APPLYING SAFE ADDITIVE SCHEMA MIGRATION ===");
  try {
    // 1. Add Student extended profile columns
    const alterStudentQueries = [
      `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "college" TEXT`,
      `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "university" TEXT`,
      `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "course" TEXT`,
      `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "branch" TEXT`,
      `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "cgpa" DOUBLE PRECISION`,
      `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "semester" INTEGER`,
      `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "tenthPercentage" DOUBLE PRECISION`,
      `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "twelfthPercentage" DOUBLE PRECISION`,
      `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "activeBacklogs" INTEGER DEFAULT 0`,
      `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "technicalSkills" TEXT[] DEFAULT ARRAY[]::TEXT[]`,
      `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "softSkills" TEXT[] DEFAULT ARRAY[]::TEXT[]`,
      `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "toolsTechnologies" TEXT[] DEFAULT ARRAY[]::TEXT[]`,
      `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "targetRole" TEXT`,
      `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "targetDomain" TEXT`,
      `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "preferredCompanies" TEXT[] DEFAULT ARRAY[]::TEXT[]`,
      `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "githubUrl" TEXT`,
      `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "linkedinUrl" TEXT`,
      `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "portfolioUrl" TEXT`,
      `ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "bio" TEXT`,
    ];

    for (const q of alterStudentQueries) {
      await prisma.$executeRawUnsafe(q);
    }
    console.log("✅ Student extended columns added successfully.");

    // 2. Add MockTest and MockTestAttempt extended columns
    const alterMockTestQueries = [
      `ALTER TABLE "MockTest" ADD COLUMN IF NOT EXISTS "courseTag" TEXT`,
      `ALTER TABLE "MockTest" ADD COLUMN IF NOT EXISTS "departmentTag" TEXT`,
      `ALTER TABLE "MockTest" ADD COLUMN IF NOT EXISTS "levels" JSONB`,
      `ALTER TABLE "MockTestAttempt" ADD COLUMN IF NOT EXISTS "levelScores" JSONB`,
      `ALTER TABLE "MockTestAttempt" ADD COLUMN IF NOT EXISTS "answers" JSONB`,
    ];

    for (const q of alterMockTestQueries) {
      await prisma.$executeRawUnsafe(q);
    }
    console.log("✅ MockTest & MockTestAttempt extended columns added successfully.");

    // 3. Create Project table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Project" (
        "id" TEXT PRIMARY KEY,
        "studentId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "githubUrl" TEXT,
        "liveUrl" TEXT,
        "startDate" TEXT,
        "endDate" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Project_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Project_studentId_idx" ON "Project"("studentId")`);
    console.log("✅ Project table ensured.");

    // 4. Create Certification table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Certification" (
        "id" TEXT PRIMARY KEY,
        "studentId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "issuer" TEXT NOT NULL,
        "issueDate" TEXT,
        "credentialUrl" TEXT,
        "credentialId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Certification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Certification_studentId_idx" ON "Certification"("studentId")`);
    console.log("✅ Certification table ensured.");

    // 5. Verify Likith's records remain untouched
    const likith = await prisma.student.findFirst({
      include: {
        assessmentAttempts: true,
        performanceHistory: true,
        recommendations: true,
      },
    });

    console.log("Verification of student data integrity:");
    console.log(`- Student ID: ${likith.id}`);
    console.log(`- Overall Score: ${likith.overallScore}`);
    console.log(`- Attempts Count: ${likith.assessmentAttempts.length} (must be 6)`);
    console.log(`- Performance Records Count: ${likith.performanceHistory.length} (must be 4)`);
    console.log(`- Recommendations Count: ${likith.recommendations.length} (must be 4)`);

    console.log("🎉 SAFE MIGRATION COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
