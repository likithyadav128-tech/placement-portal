/**
 * Normalization and slug mapping utilities for academic Years and Branches.
 */

export interface YearOption {
  slug: string;
  label: string;
  yearNumber: number;
}

export interface BranchOption {
  slug: string;
  label: string;
  code: string;
}

export const YEARS: YearOption[] = [
  { slug: "4th-year", label: "4th Year", yearNumber: 4 },
  { slug: "3rd-year", label: "3rd Year", yearNumber: 3 },
  { slug: "2nd-year", label: "2nd Year", yearNumber: 2 },
];

export const BRANCHES: BranchOption[] = [
  { slug: "ai-ds", label: "AI & DS", code: "AIDS" },
  { slug: "ai-ml", label: "AI & ML", code: "AIML" },
  { slug: "cse", label: "CSE", code: "CSE" },
  { slug: "cyber-security", label: "Cyber Security", code: "CS" },
];

/**
 * Resolves a year slug to its canonical display label (e.g. "3rd-year" -> "3rd Year").
 */
export function slugToYear(slug: string): string {
  const match = YEARS.find((y) => y.slug === slug.toLowerCase());
  if (match) return match.label;
  if (slug.includes("4")) return "4th Year";
  if (slug.includes("3")) return "3rd Year";
  if (slug.includes("2")) return "2nd Year";
  return "3rd Year";
}

/**
 * Resolves a year label to its URL-safe slug (e.g. "3rd Year" -> "3rd-year").
 */
export function yearToSlug(year: string): string {
  if (year.includes("4")) return "4th-year";
  if (year.includes("3")) return "3rd-year";
  if (year.includes("2")) return "2nd-year";
  return "3rd-year";
}

/**
 * Resolves a branch slug to its canonical display label (e.g. "ai-ds" -> "AI & DS").
 */
export function slugToBranch(slug: string): string {
  const normalized = slug.toLowerCase().replace(/[^a-z]/g, "");
  if (normalized === "aids" || slug === "ai-ds") return "AI & DS";
  if (normalized === "aiml" || slug === "ai-ml") return "AI & ML";
  if (normalized === "cse") return "CSE";
  if (normalized === "cybersecurity" || slug === "cyber-security") return "Cyber Security";
  return "AI & DS";
}

/**
 * Resolves a branch label to its URL-safe slug (e.g. "AI & DS" -> "ai-ds").
 */
export function branchToSlug(branch: string): string {
  const b = branch.toUpperCase();
  if (b.includes("CYBER")) return "cyber-security";
  if (b.includes("ML")) return "ai-ml";
  if (b.includes("DS") || b.includes("DATA")) return "ai-ds";
  if (b.includes("CSE") || b.includes("COMPUTER")) return "cse";
  return "ai-ds";
}

/**
 * Checks if a student's stored year matches a target academic year.
 * Handles formats like "3", "3rd", "3rd Year", "Year 3", etc.
 */
export function matchesYear(studentYear: string | null | undefined, targetYear: string): boolean {
  if (!studentYear) return false;
  const sYear = studentYear.toLowerCase();
  const tYear = targetYear.toLowerCase();

  if (tYear.includes("4") && (sYear === "4" || sYear.includes("4th") || sYear.includes("4"))) return true;
  if (tYear.includes("3") && (sYear === "3" || sYear.includes("3rd") || sYear.includes("3"))) return true;
  if (tYear.includes("2") && (sYear === "2" || sYear.includes("2nd") || sYear.includes("2"))) return true;

  return sYear === tYear;
}

/**
 * Checks if a student's stored department matches a target branch.
 * Normalizes variations such as:
 * - "Artificial Intelligence and Data Science", "AI & DS", "AI and DS", "AIDS" -> "AI & DS"
 * - "Artificial Intelligence and Machine Learning", "AI & ML", "AIML" -> "AI & ML"
 * - "Computer Science and Engineering", "Computer Science", "CSE" -> "CSE"
 * - "Cyber Security", "Information Security", "Cyber" -> "Cyber Security"
 */
export function matchesBranch(studentDept: string | null | undefined, targetBranch: string): boolean {
  if (!studentDept) return false;
  const dept = studentDept.toUpperCase();
  const target = targetBranch.toUpperCase();

  if (target === "AI & DS" || target === "AI-DS") {
    return (
      dept === "AI & DS" ||
      dept === "AI AND DS" ||
      dept === "AIDS" ||
      (dept.includes("ARTIFICIAL") && (dept.includes("DATA") || dept.includes("DS"))) ||
      (dept.includes("AI") && (dept.includes("DATA") || dept.includes("DS")))
    );
  }

  if (target === "AI & ML" || target === "AI-ML") {
    return (
      dept === "AI & ML" ||
      dept === "AI AND ML" ||
      dept === "AIML" ||
      (dept.includes("ARTIFICIAL") && (dept.includes("MACHINE") || dept.includes("ML"))) ||
      (dept.includes("AI") && (dept.includes("MACHINE") || dept.includes("ML")))
    );
  }

  if (target === "CSE") {
    return (
      dept === "CSE" ||
      dept.includes("COMPUTER SCIENCE") ||
      (dept.includes("COMPUTER") && dept.includes("ENGINEERING"))
    );
  }

  if (target === "CYBER SECURITY" || target === "CYBER-SECURITY") {
    return dept.includes("CYBER") || dept.includes("INFORMATION SECURITY");
  }

  return dept === target;
}
