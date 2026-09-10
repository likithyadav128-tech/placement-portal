import { PrismaClient, Role, UserStatus, ContentStatus, AssessmentType, Priority, RoadmapPhase } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // ─── 1. Clean existing records (Dev only) ───────────────────
  console.log("Cleaning old development data...");
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.institutionSetting.deleteMany({});
  await prisma.facultyNote.deleteMany({});
  await prisma.recommendation.deleteMany({});
  await prisma.studentRoadmapProgress.deleteMany({});
  await prisma.roadmapItem.deleteMany({});
  await prisma.roadmap.deleteMany({});
  await prisma.performanceRecord.deleteMany({});
  await prisma.performanceMilestone.deleteMany({});
  await prisma.focusArea.deleteMany({});
  await prisma.assessmentAnswer.deleteMany({});
  await prisma.assessmentAttempt.deleteMany({});
  await prisma.codingProblem.deleteMany({});
  await prisma.aptitudeQuestion.deleteMany({});
  await prisma.assessment.deleteMany({});
  await prisma.mockTestAttempt.deleteMany({});
  await prisma.mockTest.deleteMany({});
  await prisma.facultyStudentAssignment.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.userPermissionOverride.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.faculty.deleteMany({});
  await prisma.user.deleteMany({});

  // ─── 2. Permissions & RBAC Defaults ─────────────────────────
  console.log("Seeding permissions...");
  const permissionsData = [
    { id: "VIEW_OWN_PROFILE", name: "View Own Profile", description: "View own student profile", category: "STUDENT" },
    { id: "VIEW_OWN_PERFORMANCE", name: "View Own Performance", description: "View personal performance trends", category: "STUDENT" },
    { id: "TAKE_ASSESSMENT", name: "Take Assessment", description: "Participate in assessments", category: "STUDENT" },
    { id: "TAKE_MOCK_TEST", name: "Take Mock Test", description: "Participate in mock tests", category: "STUDENT" },
    { id: "VIEW_OWN_ROADMAP", name: "View Roadmap", description: "View placement roadmap", category: "STUDENT" },
    { id: "VIEW_OWN_RECOMMENDATIONS", name: "View Recommendations", description: "View learning recommendations", category: "STUDENT" },
    { id: "VIEW_ASSIGNED_STUDENTS", name: "View Assigned Students", description: "View student directory for department", category: "FACULTY" },
    { id: "VIEW_STUDENT_PERFORMANCE", name: "View Student Performance", description: "View cohort and individual metrics", category: "FACULTY" },
    { id: "VIEW_ASSESSMENTS", name: "View Assessments", description: "View assessment catalog & results", category: "FACULTY" },
    { id: "VIEW_ANALYTICS", name: "View Analytics", description: "Access cohort distribution histograms", category: "FACULTY" },
    { id: "ADD_STUDENT_NOTE", name: "Add Student Note", description: "Record faculty notes on student profiles", category: "FACULTY" },
    { id: "SEND_STUDENT_REMINDER", name: "Send Student Reminder", description: "Send intervention reminders to students", category: "FACULTY" },
    { id: "MANAGE_STUDENTS", name: "Manage Students", description: "Create, edit, or deactivate students", category: "MANAGEMENT" },
    { id: "MANAGE_FACULTY", name: "Manage Faculty", description: "Manage faculty directory and assignments", category: "MANAGEMENT" },
    { id: "MANAGE_ASSESSMENTS", name: "Manage Assessments", description: "Create and publish assessments", category: "MANAGEMENT" },
    { id: "MANAGE_MOCK_TESTS", name: "Manage Mock Tests", description: "Create and edit mock tests", category: "MANAGEMENT" },
    { id: "MANAGE_ROADMAPS", name: "Manage Roadmaps", description: "Configure curriculum roadmaps", category: "MANAGEMENT" },
    { id: "VIEW_REPORTS", name: "View Reports", description: "Access institutional executive reports", category: "MANAGEMENT" },
    { id: "MANAGE_PERMISSIONS", name: "Manage Permissions", description: "Configure RBAC matrix", category: "MANAGEMENT" },
    { id: "VIEW_AUDIT_LOGS", name: "View Audit Logs", description: "Inspect security audit trails", category: "MANAGEMENT" },
    { id: "MANAGE_SETTINGS", name: "Manage Settings", description: "Configure system & proctoring options", category: "MANAGEMENT" },
  ];

  for (const perm of permissionsData) {
    await prisma.permission.create({ data: perm });
  }

  // ─── 3. Management User ─────────────────────────────────────
  console.log("Seeding management user...");
  const managementUser = await prisma.user.create({
    data: {
      email: "sunita.reddy@university.edu",
      name: "Prof. Sunita Reddy",
      role: Role.MANAGEMENT,
      status: UserStatus.ACTIVE,
      department: "Administration",
    },
  });

  // ─── 4. Faculty Users ───────────────────────────────────────
  console.log("Seeding faculty members...");
  const facultyData = [
    {
      name: "Dr. Rajesh Kumar",
      email: "rajesh.kumar@university.edu",
      department: "Computer Science",
      employeeId: "FAC001",
      designation: "Professor & HOD",
    },
    {
      name: "Dr. Meenakshi Sundaram",
      email: "meenakshi.s@university.edu",
      department: "Information Technology",
      employeeId: "FAC002",
      designation: "Associate Professor",
    },
    {
      name: "Prof. Amit Sharma",
      email: "amit.sharma@university.edu",
      department: "Electronics & Communication",
      employeeId: "FAC003",
      designation: "Assistant Professor",
    },
    {
      name: "Dr. Sunita Desai",
      email: "sunita.desai@university.edu",
      department: "AI & Data Science",
      employeeId: "FAC004",
      designation: "Associate Professor",
    },
  ];

  const createdFaculty = [];
  for (const f of facultyData) {
    const user = await prisma.user.create({
      data: {
        email: f.email,
        name: f.name,
        role: Role.FACULTY,
        status: UserStatus.ACTIVE,
        department: f.department,
      },
    });

    const faculty = await prisma.faculty.create({
      data: {
        userId: user.id,
        employeeId: f.employeeId,
        department: f.department,
        designation: f.designation,
      },
    });
    createdFaculty.push(faculty);
  }

  // ─── 5. Students & Performance ──────────────────────────────
  console.log("Seeding students and longitudinal performance records...");
  const studentsData = [
    {
      name: "Arjun Patel",
      email: "arjun.patel@university.edu",
      rollNumber: "CS2024001",
      department: "Computer Science",
      year: "4th Year",
      overall: 78,
      coding: 72,
      aptitude: 84,
      reasoning: 75,
      communication: 68,
      readiness: 78,
      skills: ["Python", "C++", "Data Structures", "SQL"],
    },
    {
      name: "Priya Sharma",
      email: "priya.sharma@university.edu",
      rollNumber: "CS2024002",
      department: "Computer Science",
      year: "4th Year",
      overall: 92,
      coding: 95,
      aptitude: 88,
      reasoning: 90,
      communication: 94,
      readiness: 94,
      skills: ["Java", "Python", "Algorithms", "System Design"],
    },
    {
      name: "Rahul Verma",
      email: "rahul.verma@university.edu",
      rollNumber: "CS2024003",
      department: "Computer Science",
      year: "3rd Year",
      overall: 48,
      coding: 42,
      aptitude: 55,
      reasoning: 50,
      communication: 45,
      readiness: 45,
      skills: ["C++", "HTML/CSS"],
    },
    {
      name: "Ananya Singh",
      email: "ananya.singh@university.edu",
      rollNumber: "IT2024001",
      department: "Information Technology",
      year: "4th Year",
      overall: 85,
      coding: 82,
      aptitude: 89,
      reasoning: 86,
      communication: 84,
      readiness: 87,
      skills: ["Python", "JavaScript", "React", "Node.js"],
    },
    {
      name: "Karthik Nair",
      email: "karthik.nair@university.edu",
      rollNumber: "EC2024001",
      department: "Electronics & Communication",
      year: "4th Year",
      overall: 65,
      coding: 58,
      aptitude: 72,
      reasoning: 68,
      communication: 62,
      readiness: 64,
      skills: ["C", "Embedded Systems", "MATLAB"],
    },
  ];

  for (const s of studentsData) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        name: s.name,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        department: s.department,
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        rollNumber: s.rollNumber,
        department: s.department,
        year: s.year,
        skills: s.skills,
        placementReadiness: s.readiness,
        overallScore: s.overall,
        codingScore: s.coding,
        aptitudeScore: s.aptitude,
        reasoningScore: s.reasoning,
        communicationScore: s.communication,
      },
    });

    // Assign to faculty in same department
    const matchingFaculty = createdFaculty.find((f) => f.department === s.department);
    if (matchingFaculty) {
      await prisma.facultyStudentAssignment.create({
        data: {
          facultyId: matchingFaculty.id,
          studentId: student.id,
        },
      });
    }

    // Historical 12-month performance records (CRITICAL REQUIREMENT)
    const months = [
      "Oct 2025", "Nov 2025", "Dec 2025", "Jan 2026",
      "Feb 2026", "Mar 2026", "Apr 2026", "May 2026",
      "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026"
    ];

    for (let i = 0; i < months.length; i++) {
      const progression = (i / 11);
      const score = Math.round(s.overall - 15 + progression * 15);
      await prisma.performanceRecord.create({
        data: {
          studentId: student.id,
          sourceType: "ASSESSMENT",
          title: `Monthly Benchmark - ${months[i]}`,
          score,
          percentage: score,
          skillArea: "overall",
          month: months[i],
          completedAt: new Date(2025, 9 + i, 15),
        },
      });
    }
  }

  // ─── 6. Assessments & Coding Problems ───────────────────────
  console.log("Seeding assessments and problem sets...");
  const assessment = await prisma.assessment.create({
    data: {
      title: "Data Structures & Algorithms Benchmark",
      type: AssessmentType.CODING,
      difficulty: "medium",
      duration: 60,
      totalQuestions: 2,
      status: ContentStatus.PUBLISHED,
      description: "Evaluates proficiency in array manipulation and two-pointer algorithms.",
      createdById: createdFaculty[0].id,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.codingProblem.create({
    data: {
      assessmentId: assessment.id,
      title: "Two Sum",
      difficulty: "easy",
      description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target.",
      examples: [
        { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      ],
      constraints: [
        "2 <= nums.length <= 10^4",
        "-10^9 <= nums[i] <= 10^9",
        "Only one valid answer exists."
      ],
      starterCode: {
        python: "def twoSum(nums: list[int], target: int) -> list[int]:\n    # Write your solution here\n    pass\n",
        java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}\n",
        cpp: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        return {};\n    }\n};\n",
      },
      testCases: [
        { input: "[2,7,11,15], 9", expectedOutput: "[0,1]", hidden: false },
        { input: "[3,2,4], 6", expectedOutput: "[1,2]", hidden: false },
        { input: "[3,3], 6", expectedOutput: "[0,1]", hidden: true },
      ],
    },
  });

  // ─── 7. Mock Tests ──────────────────────────────────────────
  console.log("Seeding mock tests...");
  await prisma.mockTest.create({
    data: {
      name: "TCS National Qualifier Test (NQT)",
      company: "TCS",
      category: "IT Services",
      sections: ["Numerical Ability", "Verbal Ability", "Reasoning Ability", "Hands-on Coding"],
      duration: 90,
      difficulty: "medium",
      totalQuestions: 60,
      status: ContentStatus.PUBLISHED,
      description: "Official pattern test covering foundational aptitude and basic programming.",
    },
  });

  // ─── 8. Audit Logs ──────────────────────────────────────────
  console.log("Seeding audit logs...");
  await prisma.auditLog.create({
    data: {
      actorUserId: managementUser.id,
      actorName: managementUser.name,
      role: Role.MANAGEMENT,
      action: "INITIAL_DATABASE_SEEDED",
      entityType: "System",
      status: "success",
      details: "Initial development seed data provisioned successfully.",
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
