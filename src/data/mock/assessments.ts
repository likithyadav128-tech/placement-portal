import type { Assessment, CodingProblem, AptitudeQuestion } from "@/types";

export const mockAssessments: Assessment[] = [
  {
    id: "ASSESS001",
    title: "Data Structures Weekly Challenge",
    type: "coding",
    difficulty: "medium",
    duration: 90,
    totalQuestions: 3,
    status: "completed",
    deadline: "2026-08-15T23:59:59Z",
    bestScore: 95,
    lastAttemptScore: 85,
    participants: 120,
    averageScore: 72,
    createdAt: "2026-08-01T10:00:00Z",
    createdBy: "Dr. Rajesh Kumar",
    description: "Weekly challenge covering Arrays, Linked Lists, and Stacks."
  },
  {
    id: "ASSESS002",
    title: "TCS NQT Pattern Mock - 1",
    type: "mixed",
    difficulty: "medium",
    duration: 180,
    totalQuestions: 90,
    status: "upcoming",
    deadline: "2026-09-15T23:59:59Z",
    participants: 450,
    createdAt: "2026-09-01T10:00:00Z",
    createdBy: "Placement Cell",
    description: "Full-length mock test based on the latest TCS NQT pattern."
  },
  {
    id: "ASSESS003",
    title: "Quantitative Aptitude - Number System",
    type: "aptitude",
    difficulty: "easy",
    duration: 45,
    totalQuestions: 20,
    status: "completed",
    bestScore: 100,
    lastAttemptScore: 100,
    participants: 380,
    averageScore: 82,
    createdAt: "2026-07-20T10:00:00Z",
    createdBy: "Dr. Ritu Verma"
  },
  {
    id: "ASSESS004",
    title: "Advanced Algorithms Assessment",
    type: "coding",
    difficulty: "hard",
    duration: 120,
    totalQuestions: 4,
    status: "in_progress",
    deadline: "2026-09-12T23:59:59Z",
    participants: 85,
    createdAt: "2026-09-05T10:00:00Z",
    createdBy: "Dr. Rajesh Kumar"
  },
  {
    id: "ASSESS005",
    title: "Infosys Logical Reasoning",
    type: "aptitude",
    difficulty: "medium",
    duration: 60,
    totalQuestions: 30,
    status: "expired",
    deadline: "2026-08-30T23:59:59Z",
    bestScore: 88,
    lastAttemptScore: 88,
    participants: 410,
    averageScore: 68,
    createdAt: "2026-08-20T10:00:00Z"
  },
  {
    id: "ASSESS006",
    title: "Wipro NLTH Coding Round Mock",
    type: "coding",
    difficulty: "medium",
    duration: 60,
    totalQuestions: 2,
    status: "upcoming",
    deadline: "2026-09-20T23:59:59Z",
    participants: 0,
    createdAt: "2026-09-08T10:00:00Z"
  },
  {
    id: "ASSESS007",
    title: "Verbal Ability Basics",
    type: "aptitude",
    difficulty: "easy",
    duration: 45,
    totalQuestions: 25,
    status: "completed",
    bestScore: 92,
    lastAttemptScore: 92,
    participants: 350,
    averageScore: 78,
    createdAt: "2026-07-15T10:00:00Z"
  },
  {
    id: "ASSESS008",
    title: "Dynamic Programming Bootcamp",
    type: "coding",
    difficulty: "hard",
    duration: 180,
    totalQuestions: 5,
    status: "upcoming",
    deadline: "2026-09-25T23:59:59Z",
    createdAt: "2026-09-05T10:00:00Z"
  },
  {
    id: "ASSESS009",
    title: "Cognizant GenC Aptitude",
    type: "aptitude",
    difficulty: "medium",
    duration: 90,
    totalQuestions: 40,
    status: "completed",
    bestScore: 85,
    lastAttemptScore: 80,
    participants: 390,
    averageScore: 70,
    createdAt: "2026-08-10T10:00:00Z"
  },
  {
    id: "ASSESS010",
    title: "Graph Algorithms Practice",
    type: "coding",
    difficulty: "hard",
    duration: 120,
    totalQuestions: 3,
    status: "expired",
    deadline: "2026-09-01T23:59:59Z",
    bestScore: 75,
    lastAttemptScore: 45,
    participants: 110,
    averageScore: 55,
    createdAt: "2026-08-25T10:00:00Z"
  },
  {
    id: "ASSESS011",
    title: "SQL Queries and Databases",
    type: "coding",
    difficulty: "medium",
    duration: 60,
    totalQuestions: 5,
    status: "in_progress",
    deadline: "2026-09-11T23:59:59Z",
    participants: 220,
    createdAt: "2026-09-08T10:00:00Z"
  },
  {
    id: "ASSESS012",
    title: "General Aptitude Grand Test",
    type: "aptitude",
    difficulty: "hard",
    duration: 120,
    totalQuestions: 60,
    status: "upcoming",
    deadline: "2026-09-30T23:59:59Z",
    createdAt: "2026-09-09T10:00:00Z"
  }
];

export const mockCodingProblems: CodingProblem[] = [
  {
    id: "PROB001",
    title: "Two Sum",
    difficulty: "easy",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\nYou can return the answer in any order.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" }
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    starterCode: {
      "python": "def twoSum(nums, target):\n    # Write your code here\n    pass",
      "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[]{};\n    }\n}",
      "cpp": "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n        return {};\n    }\n};"
    },
    testCases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
      { input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
      { input: "[3,3]\n6", expectedOutput: "[0,1]", hidden: true }
    ]
  },
  {
    id: "PROB002",
    title: "Reverse Linked List",
    difficulty: "easy",
    description: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" },
      { input: "head = [1,2]", output: "[2,1]" }
    ],
    constraints: [
      "The number of nodes in the list is the range [0, 5000].",
      "-5000 <= Node.val <= 5000"
    ],
    starterCode: {
      "python": "# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        pass",
      "java": "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode reverseList(ListNode head) {\n        \n    }\n}"
    },
    testCases: [
      { input: "[1,2,3,4,5]", expectedOutput: "[5,4,3,2,1]" },
      { input: "[1,2]", expectedOutput: "[2,1]", hidden: true }
    ]
  },
  {
    id: "PROB003",
    title: "Valid Parentheses",
    difficulty: "easy",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    examples: [
      { input: "s = '()'", output: "true" },
      { input: "s = '()[]{}'", output: "true" },
      { input: "s = '(]'", output: "false" }
    ],
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'."
    ],
    starterCode: {
      "python": "class Solution:\n    def isValid(self, s: str) -> bool:\n        pass",
      "java": "class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}"
    },
    testCases: [
      { input: "()", expectedOutput: "true" },
      { input: "()[]{}", expectedOutput: "true" },
      { input: "(]", expectedOutput: "false", hidden: true }
    ]
  }
];

export const mockAptitudeQuestions: AptitudeQuestion[] = [
  { id: "APT001", questionNumber: 1, question: "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?", options: ["120 metres", "180 metres", "324 metres", "150 metres"], correctAnswer: 3, category: "Quantitative" },
  { id: "APT002", questionNumber: 2, question: "If A is the brother of B; B is the sister of C; and C is the father of D, how D is related to A?", options: ["Brother", "Sister", "Nephew", "Cannot be determined"], correctAnswer: 3, category: "Logical Reasoning" },
  { id: "APT003", questionNumber: 3, question: "Find the correctly spelt word.", options: ["Adulation", "Adalation", "Aduletian", "Addulation"], correctAnswer: 0, category: "Verbal" },
  { id: "APT004", questionNumber: 4, question: "What is the probability of getting a sum 9 from two throws of a dice?", options: ["1/6", "1/8", "1/9", "1/12"], correctAnswer: 2, category: "Quantitative" },
  { id: "APT005", questionNumber: 5, question: "Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?", options: ["(1/3)", "(1/8)", "(2/8)", "(1/16)"], correctAnswer: 1, category: "Logical Reasoning" },
  { id: "APT006", questionNumber: 6, question: "Choose the exact meaning of the idiom/phrase: To leave someone in the lurch.", options: ["To come to compromise with someone", "Constant source of annoyance to someone", "To put someone at ease", "To desert someone in his difficulties"], correctAnswer: 3, category: "Verbal" },
  { id: "APT007", questionNumber: 7, question: "The sum of ages of 5 children born at the intervals of 3 years each is 50 years. What is the age of the youngest child?", options: ["4 years", "8 years", "10 years", "None of these"], correctAnswer: 0, category: "Quantitative" },
  { id: "APT008", questionNumber: 8, question: "If PLAY is coded as 8123 and RHYME is coded as 49367. What will be code of MALE?", options: ["6217", "6198", "6285", "6395"], correctAnswer: 0, category: "Logical Reasoning" },
  { id: "APT009", questionNumber: 9, question: "Synonym of 'Abundant' is:", options: ["Plentiful", "Scarce", "Brief", "Happy"], correctAnswer: 0, category: "Verbal" },
  { id: "APT010", questionNumber: 10, question: "A sum of money at simple interest amounts to Rs. 815 in 3 years and to Rs. 854 in 4 years. The sum is:", options: ["Rs. 650", "Rs. 690", "Rs. 698", "Rs. 700"], correctAnswer: 2, category: "Quantitative" },
  { id: "APT011", questionNumber: 11, question: "Pointing to a photograph of a boy Suresh said, 'He is the son of the only son of my mother.' How is Suresh related to that boy?", options: ["Brother", "Uncle", "Cousin", "Father"], correctAnswer: 3, category: "Logical Reasoning" },
  { id: "APT012", questionNumber: 12, question: "Antonym of 'Opaque' is:", options: ["Transparent", "Cloudy", "Thick", "Clear"], correctAnswer: 0, category: "Verbal" },
  { id: "APT013", questionNumber: 13, question: "A alone can do a piece of work in 6 days and B alone in 8 days. A and B undertook to do it for Rs. 3200. With the help of C, they completed the work in 3 days. How much is to be paid to C?", options: ["Rs. 375", "Rs. 400", "Rs. 600", "Rs. 800"], correctAnswer: 1, category: "Quantitative" },
  { id: "APT014", questionNumber: 14, question: "Choose the word which is different from the rest.", options: ["Chicken", "Snake", "Swan", "Crocodile", "Frog"], correctAnswer: 0, category: "Logical Reasoning" },
  { id: "APT015", questionNumber: 15, question: "Fill in the blank: He is too dull ___ understand it.", options: ["to", "that", "so", "for"], correctAnswer: 0, category: "Verbal" }
];
