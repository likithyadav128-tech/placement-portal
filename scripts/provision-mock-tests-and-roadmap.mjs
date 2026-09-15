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
  console.log("=== PROVISIONING REAL MOCK TESTS AND ROADMAP CONTENT ===");

  // -------------------------------------------------------------
  // 1. PROVISION 4-LEVEL MOCK TESTS
  // -------------------------------------------------------------

  const mockTest1Data = {
    name: "TCS NQT National Benchmark Mock 2026",
    company: "TCS",
    category: "IT Services",
    sections: ["Aptitude & Reasoning", "Verbal Ability", "Course Theory (CS/IT)", "Live Coding (5 Problems)"],
    duration: 120, // 120 minutes total
    difficulty: "medium",
    totalQuestions: 35, // 10 + 10 + 10 + 5
    status: "PUBLISHED",
    description: "Full-length 4-level assessment mirroring the national campus placement pattern for TCS NQT and prime service recruiters.",
    courseTag: "B.Tech CSE / IT / AI&DS",
    departmentTag: "Computer Science & Engineering",
    levels: {
      level1: {
        title: "Level 1 — Aptitude & Reasoning",
        description: "Evaluates quantitative aptitude, mathematical logic, and analytical problem-solving skills.",
        timeMinutes: 30,
        questions: [
          {
            id: "l1_q1",
            question: "A train running at 72 km/hr crosses a platform 200 meters long in 22 seconds. What is the length of the train in meters?",
            options: ["220 m", "240 m", "250 m", "260 m"],
            correctAnswer: 1, // Speed = 72 * 5/18 = 20 m/s. Dist = 20 * 22 = 440 m. Train = 440 - 200 = 240 m
            marks: 2,
            explanation: "Speed in m/s = 72 * (5/18) = 20 m/s. Total distance = Speed * Time = 20 * 22 = 440m. Train length = 440 - 200 = 240 meters."
          },
          {
            id: "l1_q2",
            question: "In a class of 60 students, 40% are girls. How many additional girls must join so that girls form 50% of the entire class?",
            options: ["8", "10", "12", "15"],
            correctAnswer: 2, // Girls = 24, Boys = 36. For 50%, Total girls = 36. Add 12.
            marks: 2,
            explanation: "Current girls = 40% of 60 = 24. Boys = 36. For girls to be 50%, number of girls must equal boys (36). Additional girls needed = 36 - 24 = 12."
          },
          {
            id: "l1_q3",
            question: "A pipe can fill a cistern in 12 hours while an emptying pipe can empty it in 20 hours. If both pipes are opened simultaneously, how long will it take to fill the cistern?",
            options: ["25 hours", "30 hours", "32 hours", "35 hours"],
            correctAnswer: 1, // 1/12 - 1/20 = (5-3)/60 = 2/60 = 1/30
            marks: 2,
            explanation: "Net rate per hour = 1/12 - 1/20 = 2/60 = 1/30. Time required = 30 hours."
          },
          {
            id: "l1_q4",
            question: "Find the missing number in the series: 7, 14, 42, 168, 840, ?",
            options: ["4200", "5040", "5640", "6120"],
            correctAnswer: 1, // *2, *3, *4, *5, *6 -> 840 * 6 = 5040
            marks: 2,
            explanation: "Pattern: 7*2=14, 14*3=42, 42*4=168, 168*5=840, 840*6=5040."
          },
          {
            id: "l1_q5",
            question: "Pointing to a man, a woman said, 'His mother is the only daughter of my mother.' How is the woman related to the man?",
            options: ["Grandmother", "Sister", "Mother", "Aunt"],
            correctAnswer: 2,
            marks: 2,
            explanation: "The only daughter of the woman's mother is the woman herself. Hence she is the mother of the man."
          },
          {
            id: "l1_q6",
            question: "Statements: All laptops are devices. Some devices are phones. Conclusions: I. Some laptops are phones. II. Some devices are laptops.",
            options: ["Only I follows", "Only II follows", "Both I and II follow", "Neither follows"],
            correctAnswer: 1,
            marks: 2,
            explanation: "Since all laptops are devices, some devices must be laptops (II follows). There is no direct overlap established between laptops and phones (I does not necessarily follow)."
          },
          {
            id: "l1_q7",
            question: "If 'LIGHT' is coded as 'MJHIU', how is 'FLAME' coded in that same pattern?",
            options: ["GMBNF", "GMBNF", "GLBNF", "GMBLF"],
            correctAnswer: 0, // +1 each: F->G, L->M, A->B, M->N, E->F
            marks: 2,
            explanation: "Each character is shifted forward by +1 letter. F->G, L->M, A->B, M->N, E->F => GMBNF."
          },
          {
            id: "l1_q8",
            question: "A person travels 10 km North, turns right and walks 6 km, then turns right again and walks 10 km. How far and in which direction is he from his starting point?",
            options: ["6 km East", "6 km West", "10 km North", "16 km East"],
            correctAnswer: 0,
            marks: 2,
            explanation: "The North and South 10 km cancel out. The net displacement is 6 km East of the origin."
          },
          {
            id: "l1_q9",
            question: "Two cards are drawn at random from a standard deck of 52 cards without replacement. What is the probability that both are Aces?",
            options: ["1/221", "1/169", "4/663", "2/221"],
            correctAnswer: 0, // (4/52) * (3/51) = (1/13) * (1/17) = 1/221
            marks: 2,
            explanation: "P(1st Ace) = 4/52 = 1/13. P(2nd Ace | 1st) = 3/51 = 1/17. Total probability = 1/13 * 1/17 = 1/221."
          },
          {
            id: "l1_q10",
            question: "The ratio of present ages of Rahul and Amit is 4:5. After 6 years, the ratio becomes 5:6. What is Amit's present age?",
            options: ["24 years", "30 years", "36 years", "40 years"],
            correctAnswer: 1, // (4x+6)/(5x+6) = 5/6 => 24x + 36 = 25x + 30 => x = 6. Amit = 5*6 = 30
            marks: 2,
            explanation: "Let ages be 4x and 5x. (4x + 6) / (5x + 6) = 5/6 => 24x + 36 = 25x + 30 => x = 6. Amit's present age = 5 * 6 = 30 years."
          }
        ]
      },
      level2: {
        title: "Level 2 — Verbal Ability",
        description: "Assesses grammatical comprehension, vocabulary in context, reading comprehension, and business communication.",
        timeMinutes: 25,
        questions: [
          {
            id: "l2_q1",
            question: "Choose the word most nearly opposite in meaning to 'PRAGMATIC':",
            options: ["Idealistic", "Realistic", "Logical", "Expedient"],
            correctAnswer: 0,
            marks: 2,
            explanation: "'Pragmatic' means dealing with things sensibly and realistically. The direct opposite is 'Idealistic'."
          },
          {
            id: "l2_q2",
            question: "Identify the grammatically correct sentence:",
            options: [
              "Neither the manager nor the engineers was available for the meeting.",
              "Neither the manager nor the engineers were available for the meeting.",
              "Neither the manager or the engineers was available for the meeting.",
              "Neither the manager nor the engineers has been available for the meeting."
            ],
            correctAnswer: 1,
            marks: 2,
            explanation: "In 'neither...nor', the verb agrees with the closer subject. 'Engineers' is plural, so 'were' is correct."
          },
          {
            id: "l2_q3",
            question: "Select the correct meaning of the idiom: 'To cut corners'",
            options: [
              "To take a shorter driving route",
              "To perform a task hastily or improperly to save money or time",
              "To make sharp turns during navigation",
              "To reduce the physical boundaries of an office"
            ],
            correctAnswer: 1,
            marks: 2,
            explanation: "'To cut corners' means undertaking something in an easy or cheap manner at the cost of quality or safety."
          },
          {
            id: "l2_q4",
            question: "Fill in the blank: The committee members could not reach a ______ because of sharp ideological differences.",
            options: ["concurrence", "consensus", "contention", "conspiracy"],
            correctAnswer: 1,
            marks: 2,
            explanation: "'Consensus' refers to general agreement among a group of people."
          },
          {
            id: "l2_q5",
            question: "Rearrange into a coherent paragraph: P: This distributed ledger ensures immutability. Q: Blockchain is essentially a decentralized database. R: As a result, transactions cannot be retroactively altered. S: Information is stored across thousands of nodes worldwide.",
            options: ["QSPR", "QPSR", "SQPR", "RPQS"],
            correctAnswer: 0,
            marks: 2,
            explanation: "Q introduces the topic, S explains node distribution, P defines the ledger immutability, and R concludes the consequence (QSPR)."
          },
          {
            id: "l2_q6",
            question: "Select the antonym for 'EPHEMERAL':",
            options: ["Fleeting", "Transient", "Permanent", "Momentary"],
            correctAnswer: 2,
            marks: 2,
            explanation: "'Ephemeral' means lasting for a very short time. 'Permanent' is the direct antonym."
          },
          {
            id: "l2_q7",
            question: "Choose the correct preposition: She has been working on the enterprise distributed database ______ last September.",
            options: ["for", "since", "from", "during"],
            correctAnswer: 1,
            marks: 2,
            explanation: "'Since' is used to denote a specific point in time in the past up to the present."
          },
          {
            id: "l2_q8",
            question: "Identify the part of speech of 'swiftly' in: 'The engineer swiftly refactored the legacy microservice.'",
            options: ["Adjective", "Adverb", "Conjunction", "Noun"],
            correctAnswer: 1,
            marks: 2,
            explanation: "'Swiftly' modifies the verb 'refactored', making it an adverb of manner."
          },
          {
            id: "l2_q9",
            question: "Select the sentence with correct punctuation:",
            options: [
              "We must optimize query latency, however the database index is corrupted.",
              "We must optimize query latency; however, the database index is corrupted.",
              "We must optimize query latency however; the database index is corrupted.",
              "We must optimize query latency, however; the database index is corrupted."
            ],
            correctAnswer: 1,
            marks: 2,
            explanation: "When 'however' connects two independent clauses, it is preceded by a semicolon and followed by a comma."
          },
          {
            id: "l2_q10",
            question: "Choose the word that best fits: An algorithm that guarantees optimal memory utilization without redundant allocation is ______.",
            options: ["parsimonious", "efficacious", "efficient", "extravagant"],
            correctAnswer: 2,
            marks: 2,
            explanation: "'Efficient' in computer science context denotes achieving maximum productivity with minimal wasted effort or resources."
          }
        ]
      },
      level3: {
        title: "Level 3 — Course Theory (CS/IT/AI&DS Core)",
        description: "Department-specific theoretical examination covering Data Structures, Operating Systems, DBMS, Computer Networks, and OOP.",
        department: "Computer Science & Engineering",
        course: "B.Tech CSE",
        timeMinutes: 30,
        questions: [
          {
            id: "l3_q1",
            subject: "Operating Systems",
            topic: "Process Synchronization",
            difficulty: "medium",
            question: "Which of the following conditions is NOT required for a deadlock to occur in a multiprogramming operating system?",
            options: ["Mutual Exclusion", "Hold and Wait", "No Preemption", "Preemptive Scheduling"],
            correctAnswer: 3,
            marks: 2,
            explanation: "The 4 necessary conditions for deadlock are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Preemptive scheduling prevents deadlock."
          },
          {
            id: "l3_q2",
            subject: "Database Management Systems",
            topic: "ACID Properties & Normalization",
            difficulty: "medium",
            question: "A relation R is in Boyce-Codd Normal Form (BCNF) if and only if for every functional dependency X -> Y:",
            options: [
              "Y is a prime attribute",
              "X is a super key",
              "X is a candidate key and Y is atomic",
              "Y is functionally dependent on all attributes"
            ],
            correctAnswer: 1,
            marks: 2,
            explanation: "A relation is in BCNF if for every non-trivial functional dependency X -> Y, X is a super key."
          },
          {
            id: "l3_q3",
            subject: "Data Structures",
            topic: "Trees & Complexity",
            difficulty: "medium",
            question: "What is the worst-case time complexity of searching for an element in an AVL Tree containing N nodes?",
            options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
            correctAnswer: 1,
            marks: 2,
            explanation: "Because an AVL tree is strictly height-balanced with height bounded by 1.44 log2(N), the worst-case search complexity is strictly O(log N)."
          },
          {
            id: "l3_q4",
            subject: "Computer Networks",
            topic: "Transport Layer",
            difficulty: "medium",
            question: "In TCP flow control, what prevents a sender from overwhelming a receiver whose buffer is full?",
            options: ["Congestion Window (cwnd)", "Receive Window (rwnd)", "Maximum Segment Size (MSS)", "Slow Start Threshold"],
            correctAnswer: 1,
            marks: 2,
            explanation: "TCP Flow Control uses the Receive Window (rwnd) advertised by the receiver in ACKs to limit the sender's unacknowledged data."
          },
          {
            id: "l3_q5",
            subject: "Object-Oriented Programming",
            topic: "Polymorphism & Design",
            difficulty: "easy",
            question: "In Java/C++, runtime polymorphism (dynamic method dispatch) is primarily achieved through which language feature?",
            options: ["Method Overloading", "Virtual functions / Method Overriding", "Static binding", "Private inheritance"],
            correctAnswer: 1,
            marks: 2,
            explanation: "Runtime polymorphism occurs when an overridden method is called through the reference of a parent class at runtime using virtual method tables."
          },
          {
            id: "l3_q6",
            subject: "Operating Systems",
            topic: "Virtual Memory",
            difficulty: "medium",
            question: "Belady's Anomaly—where increasing page frames causes more page faults—can occur in which page replacement algorithm?",
            options: ["Least Recently Used (LRU)", "First-In-First-Out (FIFO)", "Optimal Page Replacement (OPT)", "Least Frequently Used (LFU)"],
            correctAnswer: 1,
            marks: 2,
            explanation: "FIFO page replacement is subject to Belady's Anomaly because it is not a stack algorithm."
          },
          {
            id: "l3_q7",
            subject: "Database Management Systems",
            topic: "Transactions & Concurrency",
            difficulty: "medium",
            question: "Under the Strict Two-Phase Locking (Strict 2PL) protocol, when are all exclusive locks released?",
            options: [
              "Immediately after the operation finishes",
              "During the shrinking phase before commit",
              "At the end of transaction after commit/abort",
              "Whenever another transaction requests a shared lock"
            ],
            correctAnswer: 2,
            marks: 2,
            explanation: "Strict 2PL requires that all exclusive locks acquired by a transaction must be held until the transaction commits or aborts, preventing cascading aborts."
          },
          {
            id: "l3_q8",
            subject: "Computer Networks",
            topic: "IP Addressing & Subnetting",
            difficulty: "medium",
            question: "How many usable host IP addresses are available in an IPv4 subnet with prefix /28?",
            options: ["14", "16", "30", "32"],
            correctAnswer: 0,
            marks: 2,
            explanation: "A /28 subnet has 32 - 28 = 4 host bits. Total addresses = 2^4 = 16. Subtracting network and broadcast addresses yields 14 usable hosts."
          },
          {
            id: "l3_q9",
            subject: "Data Structures & Algorithms",
            topic: "Sorting & Stability",
            difficulty: "easy",
            question: "Which of the following sorting algorithms is inherently stable and runs in O(N log N) worst-case time?",
            options: ["Quick Sort", "Heap Sort", "Merge Sort", "Selection Sort"],
            correctAnswer: 2,
            marks: 2,
            explanation: "Merge Sort is inherently stable and maintains O(N log N) worst-case time complexity, unlike QuickSort (not stable, O(N^2) worst case) and HeapSort (not stable)."
          },
          {
            id: "l3_q10",
            subject: "Software Engineering & Architecture",
            topic: "SOLID Principles",
            difficulty: "easy",
            question: "Which SOLID principle states that high-level modules should not depend on low-level modules, but both should depend on abstractions?",
            options: [
              "Single Responsibility Principle",
              "Open/Closed Principle",
              "Interface Segregation Principle",
              "Dependency Inversion Principle"
            ],
            correctAnswer: 3,
            marks: 2,
            explanation: "The Dependency Inversion Principle (D in SOLID) asserts that high-level modules and low-level modules should both depend on abstractions."
          }
        ]
      },
      level4: {
        title: "Level 4 — Live Coding (5 Progressive Problems)",
        description: "Hands-on coding challenges progressing from Easy to Hard. Real execution and test case verification.",
        timeMinutes: 35,
        problems: [
          {
            id: "p1_easy",
            tier: "Easy",
            order: 1,
            title: "Two Sum",
            difficulty: "easy",
            description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
            examples: [
              { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
              { input: "nums = [3,2,4], target = 6", output: "[1,2]" }
            ],
            constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9"],
            starterCode: {
              python: "def two_sum(nums: list[int], target: int) -> list[int]:\n    # Write your solution here\n    pass\n",
              java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}",
              cpp: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        return {};\n    }\n};"
            },
            testCases: [
              { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]", hidden: false },
              { input: "[3,2,4]\n6", expectedOutput: "[1,2]", hidden: false },
              { input: "[3,3]\n6", expectedOutput: "[0,1]", hidden: true }
            ]
          },
          {
            id: "p2_easy_medium",
            tier: "Easy/Medium",
            order: 2,
            title: "Valid Anagram",
            difficulty: "easy",
            description: "Given two strings `s` and `t`, return `True` if `t` is an anagram of `s`, and `False` otherwise. An anagram is a word or phrase formed by rearranging the letters of a different word or phrase, using all the original letters exactly once.",
            examples: [
              { input: 's = "anagram", t = "nagaram"', output: "True", explanation: "All characters match in frequency." },
              { input: 's = "rat", t = "car"', output: "False" }
            ],
            constraints: ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters."],
            starterCode: {
              python: "def is_anagram(s: str, t: str) -> bool:\n    # Write your solution here\n    pass\n",
              java: "class Solution {\n    public boolean isAnagram(String s, String t) {\n        // Write your solution here\n        return false;\n    }\n}",
              cpp: "#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        // Write your solution here\n        return false;\n    }\n};"
            },
            testCases: [
              { input: '"anagram"\n"nagaram"', expectedOutput: "True", hidden: false },
              { input: '"rat"\n"car"', expectedOutput: "False", hidden: false },
              { input: '"a"\n"ab"', expectedOutput: "False", hidden: true }
            ]
          },
          {
            id: "p3_medium",
            tier: "Medium",
            order: 3,
            title: "Find Maximum Subarray Sum (Kadane's)",
            difficulty: "medium",
            description: "Given an integer array `nums`, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
            examples: [
              { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum = 6." },
              { input: "nums = [1]", output: "1" }
            ],
            constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
            starterCode: {
              python: "def max_sub_array(nums: list[int]) -> int:\n    # Write your solution here\n    pass\n",
              java: "class Solution {\n    public int maxSubArray(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}",
              cpp: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Write your solution here\n        return 0;\n    }\n};"
            },
            testCases: [
              { input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6", hidden: false },
              { input: "[1]", expectedOutput: "1", hidden: false },
              { input: "[5,4,-1,7,8]", expectedOutput: "23", hidden: true }
            ]
          },
          {
            id: "p4_medium_hard",
            tier: "Medium/Hard",
            order: 4,
            title: "Longest Substring Without Repeating Characters",
            difficulty: "medium",
            description: "Given a string `s`, find the length of the longest substring without repeating characters.",
            examples: [
              { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with length 3.' },
              { input: 's = "bbbbb"', output: "1", explanation: 'The answer is "b", with length 1.' }
            ],
            constraints: ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces."],
            starterCode: {
              python: "def length_of_longest_substring(s: str) -> int:\n    # Write your solution here\n    pass\n",
              java: "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your solution here\n        return 0;\n    }\n}",
              cpp: "#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write your solution here\n        return 0;\n    }\n};"
            },
            testCases: [
              { input: '"abcabcbb"', expectedOutput: "3", hidden: false },
              { input: '"bbbbb"', expectedOutput: "1", hidden: false },
              { input: '"pwwkew"', expectedOutput: "3", hidden: true }
            ]
          },
          {
            id: "p5_hard",
            tier: "Hard",
            order: 5,
            title: "Trapping Rain Water",
            difficulty: "hard",
            description: "Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
            examples: [
              { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6", explanation: "The elevation map traps 6 units of rain water." },
              { input: "height = [4,2,0,3,2,5]", output: "9" }
            ],
            constraints: ["n == height.length", "1 <= n <= 2 * 10^4", "0 <= height[i] <= 10^5"],
            starterCode: {
              python: "def trap(height: list[int]) -> int:\n    # Write your solution here\n    pass\n",
              java: "class Solution {\n    public int trap(int[] height) {\n        // Write your solution here\n        return 0;\n    }\n}",
              cpp: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int trap(vector<int>& height) {\n        // Write your solution here\n        return 0;\n    }\n};"
            },
            testCases: [
              { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", expectedOutput: "6", hidden: false },
              { input: "[4,2,0,3,2,5]", expectedOutput: "9", hidden: false },
              { input: "[4,2,3]", expectedOutput: "1", hidden: true }
            ]
          }
        ]
      }
    }
  };

  const existingMock1 = await prisma.mockTest.findFirst({
    where: { name: mockTest1Data.name }
  });

  if (!existingMock1) {
    console.log(`Creating Mock Test: "${mockTest1Data.name}"...`);
    await prisma.mockTest.create({
      data: mockTest1Data
    });
    console.log(`✅ Created Mock Test: "${mockTest1Data.name}"`);
  } else {
    console.log(`Updating Mock Test levels: "${mockTest1Data.name}"...`);
    await prisma.mockTest.update({
      where: { id: existingMock1.id },
      data: {
        levels: mockTest1Data.levels,
        courseTag: mockTest1Data.courseTag,
        departmentTag: mockTest1Data.departmentTag,
        totalQuestions: 35
      }
    });
    console.log(`✅ Updated Mock Test: "${mockTest1Data.name}"`);
  }

  // -------------------------------------------------------------
  // 2. PROVISION ROADMAP & CURRICULUM ITEMS
  // -------------------------------------------------------------
  let defaultRoadmap = await prisma.roadmap.findFirst({
    where: { targetGroup: "Batch 2026 - CS & IT" }
  });

  if (!defaultRoadmap) {
    console.log("Creating default placement roadmap...");
    defaultRoadmap = await prisma.roadmap.create({
      data: {
        title: "Campus Placement Engineering Roadmap 2026",
        targetGroup: "Batch 2026 - CS & IT",
        status: "PUBLISHED"
      }
    });
    console.log(`✅ Created Roadmap: ID ${defaultRoadmap.id}`);
  }

  const roadmapItems = [
    {
      roadmapId: defaultRoadmap.id,
      title: "Programming Fundamentals & Basic Math",
      description: "Master computational logic, conditional flows, loops, and core numerical problem solving.",
      phase: "FOUNDATION",
      order: 1,
      estimatedHours: 15,
      skills: ["C++ / Java / Python", "Number Theory", "Recursion Basics", "Bit Manipulation"],
      resources: ["Standard Library Reference", "Complexity Analysis Primer"]
    },
    {
      roadmapId: defaultRoadmap.id,
      title: "Quantitative Aptitude & Logical Reasoning",
      description: "Speed math, percentages, ratios, time & work, syllogisms, and coding-decoding for preliminary screening tests.",
      phase: "FOUNDATION",
      order: 2,
      estimatedHours: 18,
      skills: ["Arithmetic", "Algebra", "Logical Reasoning", "Data Interpretation"],
      resources: ["Formula Cheatsheet", "Practice Question Sets"]
    },
    {
      roadmapId: defaultRoadmap.id,
      title: "Data Structures Mastery",
      description: "Arrays, Strings, Linked Lists, Stacks, Queues, Hash Tables, Binary Trees, and Heaps.",
      phase: "CURRENT",
      order: 3,
      estimatedHours: 35,
      skills: ["Dynamic Arrays", "Two Pointers", "Sliding Window", "Binary Trees", "Hashing"],
      resources: ["LeetCode Top 75", "Visualization Interactive Tools"]
    },
    {
      roadmapId: defaultRoadmap.id,
      title: "Core Computer Science Fundamentals",
      description: "In-depth understanding of Operating Systems, DBMS, Computer Networks, and Object-Oriented Design.",
      phase: "CURRENT",
      order: 4,
      estimatedHours: 25,
      skills: ["Process Scheduling", "Virtual Memory", "SQL Optimization", "TCP/IP", "SOLID Principles"],
      resources: ["CS Core Interview Handbook", "SQL Query Playground"]
    },
    {
      roadmapId: defaultRoadmap.id,
      title: "Advanced Algorithms & Dynamic Programming",
      description: "Graph traversals (BFS/DFS, Dijkstra), Greedy algorithms, Dynamic Programming, and Backtracking.",
      phase: "UPCOMING",
      order: 5,
      estimatedHours: 40,
      skills: ["Graph Theory", "DP Memoization & Tabulation", "Disjoint Set Union", "Trie"],
      resources: ["Competitive Programming Handbook", "Advanced Algorithmic Patterns"]
    },
    {
      roadmapId: defaultRoadmap.id,
      title: "Full-Length Mock Drives & Interview Readiness",
      description: "Timed 4-level mock tests, technical interview rounds, system design primers, and behavioral preparation.",
      phase: "UPCOMING",
      order: 6,
      estimatedHours: 30,
      skills: ["Live Coding Under Pressure", "System Design", "HR Behavioral (STAR Method)", "Resume Review"],
      resources: ["Mock Test Engine", "Company-Specific Question Bank"]
    }
  ];

  for (const item of roadmapItems) {
    const existingItem = await prisma.roadmapItem.findFirst({
      where: {
        roadmapId: item.roadmapId,
        title: item.title
      }
    });

    if (!existingItem) {
      await prisma.roadmapItem.create({ data: item });
      console.log(`  + Created RoadmapItem: "${item.title}"`);
    } else {
      console.log(`  ℹ️ RoadmapItem exists: "${item.title}"`);
    }
  }

  // -------------------------------------------------------------
  // 3. INITIALIZE ROADMAP PROGRESS FOR EXISTING STUDENT (IDEMPOTENT)
  // -------------------------------------------------------------
  const likith = await prisma.student.findFirst();
  if (likith) {
    const allItems = await prisma.roadmapItem.findMany({
      where: { roadmapId: defaultRoadmap.id },
      orderBy: { order: "asc" }
    });

    for (let i = 0; i < allItems.length; i++) {
      const itm = allItems[i];
      const existingProgress = await prisma.studentRoadmapProgress.findUnique({
        where: {
          studentId_roadmapItemId: {
            studentId: likith.id,
            roadmapItemId: itm.id
          }
        }
      });

      if (!existingProgress) {
        // First 2 completed (Foundation), 3rd in progress, rest not started
        const status = i < 2 ? "COMPLETED" : i === 2 ? "IN_PROGRESS" : "NOT_STARTED";
        await prisma.studentRoadmapProgress.create({
          data: {
            studentId: likith.id,
            roadmapItemId: itm.id,
            status,
            startedAt: new Date(),
            completedAt: i < 2 ? new Date() : null
          }
        });
      }
    }
    console.log(`✅ Roadmap progress initialized for student ${likith.id}`);
  }

  console.log("🎉 CONTENT PROVISIONING COMPLETED SUCCESSFULLY!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
