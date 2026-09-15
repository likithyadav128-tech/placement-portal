import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

async function main() {
  console.log("=== PHASE A: PROVISIONING STARTER ASSESSMENTS (IDEMPOTENT) ===");

  // ─── 1. APTITUDE ASSESSMENT ──────────────────────────────────────────
  const aptitudeTitle = "Quantitative & Logical Placement Benchmark";
  let aptitudeAssessment = await prisma.assessment.findFirst({
    where: { title: aptitudeTitle },
  });

  if (!aptitudeAssessment) {
    console.log(`Creating Aptitude Assessment: "${aptitudeTitle}"...`);
    aptitudeAssessment = await prisma.assessment.create({
      data: {
        title: aptitudeTitle,
        type: "APTITUDE",
        difficulty: "medium",
        duration: 30, // 30 minutes
        totalQuestions: 10,
        status: "PUBLISHED",
        description: "Comprehensive benchmark evaluating quantitative aptitude, logical reasoning, and data interpretation fundamentals for campus placements.",
      },
    });
    console.log(`✅ Created Aptitude Assessment with ID: ${aptitudeAssessment.id}`);
  } else {
    console.log(`ℹ️ Aptitude Assessment already exists with ID: ${aptitudeAssessment.id}`);
  }

  // 10 Starter Aptitude Questions
  const starterAptitudeQuestions = [
    {
      questionNumber: 1,
      category: "Quantitative Aptitude",
      question: "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train in meters?",
      options: ["120 meters", "150 meters", "180 meters", "324 meters"],
      correctAnswer: 1, // 60 * (5/18) * 9 = 150
      marks: 1,
      explanation: "Speed = 60 * (5/18) m/sec = 50/3 m/sec. Length = Speed * Time = (50/3) * 9 = 150 meters.",
    },
    {
      questionNumber: 2,
      category: "Quantitative Aptitude",
      question: "A person incurs 10% loss by selling a watch for Rs. 1,800. At what price should the watch be sold to earn a 10% profit?",
      options: ["Rs. 2,000", "Rs. 2,100", "Rs. 2,200", "Rs. 2,400"],
      correctAnswer: 2, // CP = 1800 / 0.9 = 2000; SP = 2000 * 1.1 = 2200
      marks: 1,
      explanation: "Cost Price = 1800 / 0.9 = Rs. 2000. For 10% profit, Selling Price = 2000 * 1.10 = Rs. 2200.",
    },
    {
      questionNumber: 3,
      category: "Quantitative Aptitude",
      question: "A and B can complete a work in 12 days, B and C in 15 days, and C and A in 20 days. How many days will A alone take to finish the work?",
      options: ["20 days", "24 days", "30 days", "40 days"],
      correctAnswer: 2, // 2(A+B+C) = 1/12+1/15+1/20 = 12/60 = 1/5 -> A+B+C = 1/10. A = 1/10 - 1/15 = 1/30
      marks: 1,
      explanation: "2(A + B + C) = 1/12 + 1/15 + 1/20 = 12/60 = 1/5, so A + B + C = 1/10. A's 1-day work = 1/10 - 1/15 = 1/30. Thus, A alone takes 30 days.",
    },
    {
      questionNumber: 4,
      category: "Quantitative Aptitude",
      question: "The average age of a class of 30 students is 15 years. If the teacher's age is included, the average increases by 1 year. What is the teacher's age?",
      options: ["42 years", "44 years", "46 years", "48 years"],
      correctAnswer: 2, // 31 * 16 - 30 * 15 = 496 - 450 = 46
      marks: 1,
      explanation: "Total age of 30 students = 30 * 15 = 450. Total age with teacher = 31 * 16 = 496. Teacher's age = 496 - 450 = 46 years.",
    },
    {
      questionNumber: 5,
      category: "Logical Reasoning",
      question: "In a certain code language, 'COMPUTER' is written as 'RFUVQNPC'. How is 'MEDICINE' written in that same code?",
      options: ["MFEDJJOE", "EOJDEJFM", "EOJDJEFM", "MFEJDJOE"],
      correctAnswer: 2, // C...R -> R...C with internal letters shifted +1 reversed
      marks: 1,
      explanation: "First and last letters are swapped (M...E -> E...M). Intermediate letters are shifted by +1 and written in reverse order: E->F, D->E, I->J, C->D, I->J, N->O => EOJDJEFM.",
    },
    {
      questionNumber: 6,
      category: "Logical Reasoning",
      question: "Pointing to a photograph of a boy, Suresh said, 'He is the only son of my mother.' How is Suresh related to that boy?",
      options: ["Brother", "Uncle", "Father", "Cousin"],
      correctAnswer: 2,
      explanation: "The only son of Suresh's mother is Suresh himself. Therefore, Suresh is the father of the boy in the photograph.",
    },
    {
      questionNumber: 7,
      category: "Logical Reasoning",
      question: "Find the next term in the alphanumeric series: B2D, E4G, H8J, K16M, ?",
      options: ["N32P", "N30P", "O32P", "N32O"],
      correctAnswer: 0, // B(+3)E(+3)H(+3)K(+3)N; 2(*2)4(*2)8(*2)16(*2)32; D(+3)G(+3)J(+3)M(+3)P
      marks: 1,
      explanation: "Letters increase by 3 positions: B->E->H->K->N and D->G->J->M->P. Numbers double: 2->4->8->16->32. Next term is N32P.",
    },
    {
      questionNumber: 8,
      category: "Logical Reasoning",
      question: "Statements: All mangoes are golden in color. No golden-colored things are cheap. Conclusions: I. All mangoes are cheap. II. Golden-colored mangoes are not cheap.",
      options: ["Only conclusion I follows", "Only conclusion II follows", "Both conclusions I and II follow", "Neither conclusion I nor II follows"],
      correctAnswer: 1,
      explanation: "Since all mangoes are golden and no golden things are cheap, it directly follows that mangoes cannot be cheap, meaning conclusion II is valid.",
    },
    {
      questionNumber: 9,
      category: "Data Interpretation",
      question: "A company's revenue grew from $2.5 million in 2023 to $3.5 million in 2024. What was the percentage growth in revenue?",
      options: ["30%", "35%", "40%", "45%"],
      correctAnswer: 2, // (3.5 - 2.5)/2.5 = 1/2.5 = 40%
      marks: 1,
      explanation: "Percentage growth = ((3.5 - 2.5) / 2.5) * 100 = (1.0 / 2.5) * 100 = 40%.",
    },
    {
      questionNumber: 10,
      category: "Data Interpretation",
      question: "In a pie chart representing an engineering college's department distribution, the CSE department occupies a central angle of 108°. What percentage of total college students belong to CSE?",
      options: ["25%", "28%", "30%", "32%"],
      correctAnswer: 2, // (108 / 360) * 100 = 30%
      marks: 1,
      explanation: "Percentage = (108° / 360°) * 100 = 0.30 * 100 = 30%.",
    },
  ];

  for (const q of starterAptitudeQuestions) {
    const existing = await prisma.aptitudeQuestion.findFirst({
      where: {
        assessmentId: aptitudeAssessment.id,
        questionNumber: q.questionNumber,
      },
    });

    if (!existing) {
      await prisma.aptitudeQuestion.create({
        data: {
          assessmentId: aptitudeAssessment.id,
          questionNumber: q.questionNumber,
          category: q.category,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          marks: q.marks,
          explanation: q.explanation,
        },
      });
      console.log(`  + Created Aptitude Question #${q.questionNumber} (${q.category})`);
    } else {
      console.log(`  ✓ Aptitude Question #${q.questionNumber} already exists`);
    }
  }

  // ─── 2. CODING ASSESSMENT ───────────────────────────────────────────
  const codingTitle = "Core Algorithms & Problem Solving Benchmark";
  let codingAssessment = await prisma.assessment.findFirst({
    where: { title: codingTitle },
  });

  if (!codingAssessment) {
    console.log(`Creating Coding Assessment: "${codingTitle}"...`);
    codingAssessment = await prisma.assessment.create({
      data: {
        title: codingTitle,
        type: "CODING",
        difficulty: "medium",
        duration: 60, // 60 minutes
        totalQuestions: 5,
        status: "PUBLISHED",
        description: "Standard technical interview coding assessment testing arrays, strings, two-pointers, and hash table concepts.",
      },
    });
    console.log(`✅ Created Coding Assessment with ID: ${codingAssessment.id}`);
  } else {
    console.log(`ℹ️ Coding Assessment already exists with ID: ${codingAssessment.id}`);
  }

  // 5 Starter Coding Problems
  const starterCodingProblems = [
    {
      title: "Two Sum",
      difficulty: "easy",
      description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
      examples: [
        {
          input: "nums = [2,7,11,15], target = 9",
          output: "[0,1]",
          explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
        },
        {
          input: "nums = [3,2,4], target = 6",
          output: "[1,2]",
          explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
        },
      ],
      constraints: [
        "2 <= nums.length <= 10^4",
        "-10^9 <= nums[i] <= 10^9",
        "-10^9 <= target <= 10^9",
        "Only one valid answer exists.",
      ],
      starterCode: {
        python: "class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # Write your code here\n        pass\n",
        java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[]{};\n    }\n}\n",
        cpp: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n        return {};\n    }\n};\n",
      },
      testCases: [
        { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]", hidden: false },
        { input: "[3,2,4]\n6", expectedOutput: "[1,2]", hidden: false },
        { input: "[3,3]\n6", expectedOutput: "[0,1]", hidden: true },
      ],
    },
    {
      title: "Valid Anagram",
      difficulty: "easy",
      description: "Given two strings s and t, return true if t is an anagram of s, and false otherwise.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
      examples: [
        {
          input: 's = "anagram", t = "nagaram"',
          output: "true",
          explanation: "Both strings contain the same characters with identical counts.",
        },
        {
          input: 's = "rat", t = "car"',
          output: "false",
          explanation: "'car' contains 'c' which is not in 'rat'.",
        },
      ],
      constraints: [
        "1 <= s.length, t.length <= 5 * 10^4",
        "s and t consist of lowercase English letters.",
      ],
      starterCode: {
        python: "class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        # Write your solution here\n        pass\n",
        java: "class Solution {\n    public boolean isAnagram(String s, String t) {\n        // Write your solution here\n        return false;\n    }\n}\n",
        cpp: "#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    boolean isAnagram(string s, string t) {\n        // Write your solution here\n        return false;\n    }\n};\n",
      },
      testCases: [
        { input: '"anagram"\n"nagaram"', expectedOutput: "true", hidden: false },
        { input: '"rat"\n"car"', expectedOutput: "false", hidden: false },
      ],
    },
    {
      title: "Reverse Linked List",
      difficulty: "easy",
      description: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
      examples: [
        {
          input: "head = [1,2,3,4,5]",
          output: "[5,4,3,2,1]",
          explanation: "The direction of all node pointers is inverted.",
        },
      ],
      constraints: [
        "The number of nodes in the list is the range [0, 5000].",
        "-5000 <= Node.val <= 5000",
      ],
      starterCode: {
        python: "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def reverseList(self, head):\n        # Write your solution here\n        pass\n",
        java: "class Solution {\n    public ListNode reverseList(ListNode head) {\n        // Write your solution here\n        return null;\n    }\n}\n",
        cpp: "class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        // Write your solution here\n        return nullptr;\n    }\n};\n",
      },
      testCases: [
        { input: "[1,2,3,4,5]", expectedOutput: "[5,4,3,2,1]", hidden: false },
      ],
    },
    {
      title: "Merge Intervals",
      difficulty: "medium",
      description: "Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
      examples: [
        {
          input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
          output: "[[1,6],[8,10],[15,18]]",
          explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6].",
        },
      ],
      constraints: [
        "1 <= intervals.length <= 10^4",
        "intervals[i].length == 2",
        "0 <= start_i <= end_i <= 10^4",
      ],
      starterCode: {
        python: "class Solution:\n    def merge(self, intervals: list[list[int]]) -> list[list[int]]:\n        # Write your solution here\n        pass\n",
        java: "class Solution {\n    public int[][] merge(int[][] intervals) {\n        // Write your solution here\n        return new int[][]{};\n    }\n}\n",
        cpp: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        // Write your solution here\n        return {};\n    }\n};\n",
      },
      testCases: [
        { input: "[[1,3],[2,6],[8,10],[15,18]]", expectedOutput: "[[1,6],[8,10],[15,18]]", hidden: false },
      ],
    },
    {
      title: "Subarray Sum Equals K",
      difficulty: "medium",
      description: "Given an array of integers nums and an integer k, return the total number of subarrays whose sum equals to k.\n\nA subarray is a contiguous non-empty sequence of elements within an array.",
      examples: [
        {
          input: "nums = [1,1,1], k = 2",
          output: "2",
          explanation: "There are two contiguous subarrays summing to 2: [nums[0], nums[1]] and [nums[1], nums[2]].",
        },
        {
          input: "nums = [1,2,3], k = 3",
          output: "2",
          explanation: "Subarrays [1,2] and [3] both sum to 3.",
        },
      ],
      constraints: [
        "1 <= nums.length <= 2 * 10^4",
        "-1000 <= nums[i] <= 1000",
        "-10^7 <= k <= 10^7",
      ],
      starterCode: {
        python: "class Solution:\n    def subarraySum(self, nums: list[int], k: int) -> int:\n        # Write your solution here\n        pass\n",
        java: "class Solution {\n    public int subarraySum(int[] nums, int k) {\n        // Write your solution here\n        return 0;\n    }\n}\n",
        cpp: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int subarraySum(vector<int>& nums, int k) {\n        // Write your solution here\n        return 0;\n    }\n};\n",
      },
      testCases: [
        { input: "[1,1,1]\n2", expectedOutput: "2", hidden: false },
        { input: "[1,2,3]\n3", expectedOutput: "2", hidden: false },
      ],
    },
  ];

  for (const p of starterCodingProblems) {
    const existing = await prisma.codingProblem.findFirst({
      where: {
        assessmentId: codingAssessment.id,
        title: p.title,
      },
    });

    if (!existing) {
      await prisma.codingProblem.create({
        data: {
          assessmentId: codingAssessment.id,
          title: p.title,
          difficulty: p.difficulty,
          description: p.description,
          examples: p.examples,
          constraints: p.constraints,
          starterCode: p.starterCode,
          testCases: p.testCases,
        },
      });
      console.log(`  + Created Coding Problem: "${p.title}" (${p.difficulty})`);
    } else {
      console.log(`  ✓ Coding Problem: "${p.title}" already exists`);
    }
  }

  // ─── 3. VERIFICATION QUERY ──────────────────────────────────────────
  const totalAssessments = await prisma.assessment.count();
  const totalAptitudeQs = await prisma.aptitudeQuestion.count();
  const totalCodingPs = await prisma.codingProblem.count();

  console.log("\n=== STARTER CONTENT PROVISIONING COMPLETE ===");
  console.log(`Total Published Assessments: ${totalAssessments}`);
  console.log(`Total Aptitude Questions: ${totalAptitudeQs}`);
  console.log(`Total Coding Problems: ${totalCodingPs}`);
  console.log(`Aptitude Assessment ID: ${aptitudeAssessment.id}`);
  console.log(`Coding Assessment ID: ${codingAssessment.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
