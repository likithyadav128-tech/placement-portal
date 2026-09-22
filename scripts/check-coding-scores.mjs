// Diagnostic script: check AssessmentAttempt records for Core Algorithms assessment
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local manually
const envPath = path.join(__dirname, "..", ".env.local");
const content = fs.readFileSync(envPath, "utf-8");
for (const line of content.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx !== -1) {
    process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
}

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ASSESSMENT_ID = "5ee35c47-d81c-4e5e-b349-9f16adc2447a";
const LIKITH_STUDENT_ID = "05236f72-0bb5-4df3-a8b8-760cd62891ac";

// 1. Fetch all attempts ordered by score DESC (current API logic)
console.log("=== Attempts ordered by score DESC (current API logic) ===");
const attemptsDesc = await prisma.assessmentAttempt.findMany({
  where: {
    assessmentId: ASSESSMENT_ID,
    studentId: LIKITH_STUDENT_ID,
    status: { in: ["SUBMITTED", "EVALUATED"] },
  },
  orderBy: { score: "desc" },
});
for (const a of attemptsDesc) {
  console.log(`  id=${a.id.slice(0, 8)}... score=${a.score} pct=${a.percentage} status=${a.status} submittedAt=${a.submittedAt}`);
}
console.log(`  => FIRST PICK: score=${attemptsDesc[0]?.score}, percentage=${attemptsDesc[0]?.percentage}`);

// 2. Fetch all attempts ordered by percentage DESC (alternative)
console.log("\n=== Attempts ordered by percentage DESC (better for best-attempt) ===");
const attemptsPct = await prisma.assessmentAttempt.findMany({
  where: {
    assessmentId: ASSESSMENT_ID,
    studentId: LIKITH_STUDENT_ID,
    status: { in: ["SUBMITTED", "EVALUATED"] },
  },
  orderBy: { percentage: "desc" },
});
for (const a of attemptsPct) {
  console.log(`  id=${a.id.slice(0, 8)}... score=${a.score} pct=${a.percentage} status=${a.status} submittedAt=${a.submittedAt}`);
}
console.log(`  => FIRST PICK: score=${attemptsPct[0]?.score}, percentage=${attemptsPct[0]?.percentage}`);

// 3. Fetch all attempts ordered by submittedAt DESC (most recent)
console.log("\n=== Attempts ordered by submittedAt DESC (most recent) ===");
const attemptsRecent = await prisma.assessmentAttempt.findMany({
  where: {
    assessmentId: ASSESSMENT_ID,
    studentId: LIKITH_STUDENT_ID,
    status: { in: ["SUBMITTED", "EVALUATED"] },
  },
  orderBy: { submittedAt: "desc" },
});
for (const a of attemptsRecent) {
  console.log(`  id=${a.id.slice(0, 8)}... score=${a.score} pct=${a.percentage} status=${a.status} submittedAt=${a.submittedAt}`);
}
console.log(`  => FIRST PICK: score=${attemptsRecent[0]?.score}, percentage=${attemptsRecent[0]?.percentage}`);

// 4. Check what the student-facing API logic uses
console.log("\n=== Best attempt: score NOT NULL, ordered by score DESC ===");
const attemptsNotNull = await prisma.assessmentAttempt.findMany({
  where: {
    assessmentId: ASSESSMENT_ID,
    studentId: LIKITH_STUDENT_ID,
    status: { in: ["SUBMITTED", "EVALUATED"] },
    score: { not: null },
  },
  orderBy: { score: "desc" },
});
for (const a of attemptsNotNull) {
  console.log(`  id=${a.id.slice(0, 8)}... score=${a.score} pct=${a.percentage} status=${a.status}`);
}
console.log(`  => FIRST PICK: score=${attemptsNotNull[0]?.score}, percentage=${attemptsNotNull[0]?.percentage}`);

await prisma.$disconnect();
await pool.end();
console.log("\nDone.");
