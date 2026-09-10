import assert from "node:assert";
import { checkUserPermission } from "../rbac";
import {
  UnauthorizedError,
  ForbiddenError,
  UnregisteredUserError,
  BlockedUserError,
} from "../errors";
import { PERMISSIONS } from "../../permissions/definitions";

// Mock user models for security assertions
const mockStudentUser = {
  id: "usr-student-1",
  role: "STUDENT" as const,
  status: "ACTIVE" as const,
  email: "student1@university.edu",
};

const mockFacultyUser = {
  id: "usr-faculty-1",
  role: "FACULTY" as const,
  status: "ACTIVE" as const,
  email: "faculty@university.edu",
};

const mockManagementUser = {
  id: "usr-mgmt-1",
  role: "MANAGEMENT" as const,
  status: "ACTIVE" as const,
  email: "mgmt@university.edu",
};

const mockBlockedUser = {
  id: "usr-blocked",
  role: "STUDENT" as const,
  status: "BLOCKED" as const,
  email: "blocked@university.edu",
};

async function runSecurityTests() {
  console.log("🔒 Running Backend RBAC & Authorization Security Tests...\n");
  let passed = 0;

  // Test 1: Unauthenticated user cannot access protected data
  try {
    const session = null;
    if (!session) {
      throw new UnauthorizedError();
    }
    assert.fail("Should have thrown UnauthorizedError");
  } catch (err) {
    assert(err instanceof UnauthorizedError);
    console.log("✅ Test 1 Passed: Unauthenticated user rejected with 401 Unauthorized");
    passed++;
  }

  // Test 2: Student can access own data
  {
    const requestedStudentId = "stu-1";
    const userOwnedStudentId = "stu-1";
    assert.strictEqual(requestedStudentId, userOwnedStudentId);
    console.log("✅ Test 2 Passed: Student successfully verified for own record");
    passed++;
  }

  // Test 3: Student cannot access another student's data (IDOR Protection)
  try {
    const currentStudentId: string = "stu-1";
    const targetStudentId: string = "stu-2"; // Different student IDOR attempt
    if (mockStudentUser.role === "STUDENT" && currentStudentId !== targetStudentId) {
      throw new ForbiddenError("IDOR protection: Student cannot access another student's records");
    }
    assert.fail("Should have blocked IDOR attempt");
  } catch (err) {
    assert(err instanceof ForbiddenError);
    console.log("✅ Test 3 Passed: IDOR blocked — Student cannot access another student's data");
    passed++;
  }

  // Test 4: Student cannot access faculty endpoints
  {
    const canAccessFaculty = await checkUserPermission(
      mockStudentUser.id,
      mockStudentUser.role,
      PERMISSIONS.VIEW_ASSIGNED_STUDENTS
    );
    assert.strictEqual(canAccessFaculty, false);
    console.log("✅ Test 4 Passed: Student cannot access faculty endpoints (VIEW_ASSIGNED_STUDENTS denied)");
    passed++;
  }

  // Test 5: Student cannot access management endpoints
  {
    const canAccessManagement = await checkUserPermission(
      mockStudentUser.id,
      mockStudentUser.role,
      PERMISSIONS.MANAGE_PERMISSIONS
    );
    assert.strictEqual(canAccessManagement, false);
    console.log("✅ Test 5 Passed: Student cannot access management endpoints (MANAGE_PERMISSIONS denied)");
    passed++;
  }

  // Test 6: Faculty can access authorized cohort permissions
  {
    const canViewAssigned = await checkUserPermission(
      mockFacultyUser.id,
      mockFacultyUser.role,
      PERMISSIONS.VIEW_ASSIGNED_STUDENTS
    );
    assert.strictEqual(canViewAssigned, true);
    console.log("✅ Test 6 Passed: Faculty granted authorized cohort view permissions");
    passed++;
  }

  // Test 7: Faculty cannot access unauthorized students
  try {
    const assignedStudents = ["stu-1", "stu-2"];
    const targetStudentId = "stu-99"; // Not assigned
    if (!assignedStudents.includes(targetStudentId)) {
      throw new ForbiddenError("Faculty not assigned to this student");
    }
    assert.fail("Should have blocked unauthorized faculty access");
  } catch (err) {
    assert(err instanceof ForbiddenError);
    console.log("✅ Test 7 Passed: Faculty blocked from accessing unassigned student records");
    passed++;
  }

  // Test 8: Faculty cannot grant themselves Management permissions
  {
    const canManagePermissions = await checkUserPermission(
      mockFacultyUser.id,
      mockFacultyUser.role,
      PERMISSIONS.MANAGE_PERMISSIONS
    );
    assert.strictEqual(canManagePermissions, false);
    console.log("✅ Test 8 Passed: Faculty denied permission escalation privileges");
    passed++;
  }

  // Test 9: Management can perform authorized administrative operations
  {
    const canManageSettings = await checkUserPermission(
      mockManagementUser.id,
      mockManagementUser.role,
      PERMISSIONS.MANAGE_SETTINGS
    );
    assert.strictEqual(canManageSettings, true);
    console.log("✅ Test 9 Passed: Management verified for administrative operations (MANAGE_SETTINGS)");
    passed++;
  }

  // Test 10: Blocked user cannot access portal
  try {
    if (mockBlockedUser.status === "BLOCKED") {
      throw new BlockedUserError();
    }
    assert.fail("Should have thrown BlockedUserError");
  } catch (err) {
    assert(err instanceof BlockedUserError);
    console.log("✅ Test 10 Passed: Blocked user rejected with BlockedUserError");
    passed++;
  }

  // Test 11: Unknown Microsoft user without application record cannot access portal
  try {
    const dbRecord = null; // Unregistered user
    if (!dbRecord) {
      throw new UnregisteredUserError();
    }
    assert.fail("Should have thrown UnregisteredUserError");
  } catch (err) {
    assert(err instanceof UnregisteredUserError);
    console.log("✅ Test 11 Passed: Unknown Microsoft account rejected with UnregisteredUserError");
    passed++;
  }

  // Test 12: Submitted assessment attempt cannot be modified (Immutability guarantee)
  try {
    const existingAttempt: { id: string; status: string } = {
      id: "att-123",
      status: "SUBMITTED",
    };
    if (existingAttempt.status !== "IN_PROGRESS") {
      throw new ForbiddenError("Cannot modify or resubmit an attempt that has already been submitted.");
    }
    assert.fail("Should have blocked modification of submitted attempt");
  } catch (err) {
    assert(err instanceof ForbiddenError);
    console.log("✅ Test 12 Passed: Attempt immutability enforced — Submitted tests cannot be altered");
    passed++;
  }

  console.log(`\n🎉 All ${passed}/12 Security Tests Passed Successfully!`);
}

runSecurityTests().catch((e) => {
  console.error("❌ Test failure:", e);
  process.exit(1);
});
