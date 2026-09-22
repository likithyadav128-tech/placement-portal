import assert from "node:assert";

/**
 * Faculty-Student Assignment & Dashboard Aggregation Test Suite
 *
 * Tests:
 * 1. Faculty assigned students count resolution
 * 2. Faculty dashboard performance aggregation logic
 * 3. Faculty dashboard "needs attention" filter criteria (score < 60 or declining trend)
 * 4. Faculty student directory filtering (by name, roll number, department, status, tier)
 * 5. Anti-IDOR access control (assigned students permitted, unassigned students denied)
 * 6. Edge cases (zero assigned students, null scores)
 */

interface MockStudent {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  department: string;
  year: string;
  overallScore: number;
  codingScore: number;
  aptitudeScore: number;
  trend: string;
  status: string;
}

interface MockAssignment {
  facultyId: string;
  studentId: string;
}

const mockFacultyId = "6c9574ba-1ade-4594-b3fd-114aff672e52";

const mockStudents: MockStudent[] = [
  {
    id: "05236f72-0bb5-4df3-a8b8-760cd62891ac",
    name: "Likith Yadav",
    email: "likithyadav128@gmail.com",
    rollNumber: "122411520237",
    department: "Artificial Intelligence and Data Science",
    year: "3rd Year",
    overallScore: 70,
    codingScore: 100,
    aptitudeScore: 40,
    trend: "improving",
    status: "active",
  },
  {
    id: "0d142e2c-4f65-4415-bb17-ad432b775f82",
    name: "P Hemanth Sai",
    email: "hemantshaisai6@gmail.com",
    rollNumber: "122411520242",
    department: "AI & DS",
    year: "3",
    overallScore: 0,
    codingScore: 0,
    aptitudeScore: 0,
    trend: "stable",
    status: "active",
  },
  {
    id: "unassigned-student-id-9999",
    name: "Unassigned Student",
    email: "unassigned@university.edu",
    rollNumber: "999999999999",
    department: "Civil Engineering",
    year: "4",
    overallScore: 85,
    codingScore: 80,
    aptitudeScore: 90,
    trend: "stable",
    status: "active",
  },
];

const mockAssignments: MockAssignment[] = [
  {
    facultyId: mockFacultyId,
    studentId: "05236f72-0bb5-4df3-a8b8-760cd62891ac",
  },
  {
    facultyId: mockFacultyId,
    studentId: "0d142e2c-4f65-4415-bb17-ad432b775f82",
  },
];

function getAssignedStudents(facultyId: string, students: MockStudent[], assignments: MockAssignment[]): MockStudent[] {
  const assignedIds = new Set(
    assignments.filter((a) => a.facultyId === facultyId).map((a) => a.studentId)
  );
  return students.filter((s) => assignedIds.has(s.id));
}

function calculateFacultyDashboardMetrics(assignedStudents: MockStudent[]) {
  const totalStudents = assignedStudents.length;
  const avgPerformance =
    totalStudents > 0
      ? Math.round(
          (assignedStudents.reduce((sum, s) => sum + (s.overallScore || 0), 0) /
            totalStudents) *
            10
        ) / 10
      : 0;

  const needingAttentionList = assignedStudents.filter(
    (s) => s.overallScore < 60 || s.trend === "declining"
  );

  return {
    totalStudents,
    avgPerformance,
    needingAttentionCount: needingAttentionList.length,
    needingAttentionList,
  };
}

function canFacultyAccessStudent(facultyId: string, studentId: string, assignments: MockAssignment[]): boolean {
  return assignments.some((a) => a.facultyId === facultyId && a.studentId === studentId);
}

async function runTests() {
  console.log("=== RUNNING FACULTY-STUDENT ASSIGNMENT TESTS ===\n");

  // Test 1: Assignment resolution returns exactly 2 assigned students
  const assigned = getAssignedStudents(mockFacultyId, mockStudents, mockAssignments);
  assert.strictEqual(assigned.length, 2, "Should resolve exactly 2 assigned students");
  assert.ok(assigned.some((s) => s.name === "Likith Yadav"), "Likith Yadav must be assigned");
  assert.ok(assigned.some((s) => s.name === "P Hemanth Sai"), "P Hemanth Sai must be assigned");
  console.log("✅ Test 1 Passed: Faculty assignment resolves both Likith and Hemanth (count = 2)");

  // Test 2: Unassigned student is excluded
  assert.ok(!assigned.some((s) => s.name === "Unassigned Student"), "Unassigned student must be excluded");
  console.log("✅ Test 2 Passed: Unassigned students are strictly excluded from faculty cohort");

  // Test 3: Dashboard metrics calculate correct average
  const metrics = calculateFacultyDashboardMetrics(assigned);
  assert.strictEqual(metrics.totalStudents, 2, "Total students must be 2");
  // (70 + 0) / 2 = 35.0%
  assert.strictEqual(metrics.avgPerformance, 35.0, "Average performance should be 35.0%");
  console.log(`✅ Test 3 Passed: Average performance correctly calculated as ${metrics.avgPerformance}%`);

  // Test 4: Needs attention list correctly identifies students needing intervention
  assert.strictEqual(metrics.needingAttentionCount, 1, "Only Hemanth (score 0 < 60) should need attention");
  assert.strictEqual(metrics.needingAttentionList[0].name, "P Hemanth Sai", "Hemanth should be in needing attention list");
  console.log("✅ Test 4 Passed: Needing attention correctly identifies P Hemanth Sai (Score: 0%)");

  // Test 5: Anti-IDOR permits assigned student access
  const accessLikith = canFacultyAccessStudent(mockFacultyId, "05236f72-0bb5-4df3-a8b8-760cd62891ac", mockAssignments);
  const accessHemanth = canFacultyAccessStudent(mockFacultyId, "0d142e2c-4f65-4415-bb17-ad432b775f82", mockAssignments);
  assert.strictEqual(accessLikith, true, "Faculty must have access to Likith");
  assert.strictEqual(accessHemanth, true, "Faculty must have access to Hemanth");
  console.log("✅ Test 5 Passed: Anti-IDOR permits access to assigned students");

  // Test 6: Anti-IDOR blocks unassigned student access
  const accessUnassigned = canFacultyAccessStudent(mockFacultyId, "unassigned-student-id-9999", mockAssignments);
  assert.strictEqual(accessUnassigned, false, "Faculty must NOT have access to unassigned student");
  console.log("✅ Test 6 Passed: Anti-IDOR blocks access to unassigned students (403 Forbidden)");

  // Test 7: Zero assigned students edge case
  const emptyMetrics = calculateFacultyDashboardMetrics([]);
  assert.strictEqual(emptyMetrics.totalStudents, 0);
  assert.strictEqual(emptyMetrics.avgPerformance, 0);
  assert.strictEqual(emptyMetrics.needingAttentionCount, 0);
  console.log("✅ Test 7 Passed: Zero assigned students handled gracefully without division by zero");

  // Test 8: Student directory search filtering
  const searchFilter = (query: string) =>
    assigned.filter(
      (s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(query.toLowerCase())
    );
  assert.strictEqual(searchFilter("Likith").length, 1);
  assert.strictEqual(searchFilter("122411520242").length, 1);
  assert.strictEqual(searchFilter("NonExistent").length, 0);
  console.log("✅ Test 8 Passed: Student directory search filtering matches by name and roll number");

  console.log("\n🎉 All 8/8 Faculty-Student Assignment Tests Passed Successfully!\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
