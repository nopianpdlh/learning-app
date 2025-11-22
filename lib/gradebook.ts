/**
 * Gradebook Calculation Utilities
 * Calculates overall grades from assignments and quizzes
 */

export interface GradeItem {
  id: string;
  title: string;
  score: number;
  maxPoints: number;
  type: "assignment" | "quiz";
  gradedAt: Date;
}

export interface GradeBreakdown {
  assignments: {
    items: GradeItem[];
    totalScore: number;
    totalMaxPoints: number;
    percentage: number;
    weight: number;
  };
  quizzes: {
    items: GradeItem[];
    totalScore: number;
    totalMaxPoints: number;
    percentage: number;
    weight: number;
  };
  overall: {
    percentage: number;
    letter: string;
    status: "passing" | "failing";
  };
}

export interface GradebookConfig {
  assignmentWeight: number; // e.g., 0.6 for 60%
  quizWeight: number; // e.g., 0.4 for 40%
  passingGrade: number; // e.g., 60 for 60%
}

// Default configuration
export const DEFAULT_GRADEBOOK_CONFIG: GradebookConfig = {
  assignmentWeight: 0.6, // 60% weight for assignments
  quizWeight: 0.4, // 40% weight for quizzes
  passingGrade: 60, // 60% to pass
};

/**
 * Calculate percentage from score and max points
 */
export function calculatePercentage(score: number, maxPoints: number): number {
  if (maxPoints === 0) return 0;
  return Math.round((score / maxPoints) * 100 * 100) / 100; // Round to 2 decimals
}

/**
 * Get letter grade from percentage
 */
export function getLetterGrade(percentage: number): string {
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "F";
}

/**
 * Get grade color based on percentage
 */
export function getGradeColor(percentage: number): string {
  if (percentage >= 80) return "text-green-600";
  if (percentage >= 70) return "text-blue-600";
  if (percentage >= 60) return "text-yellow-600";
  return "text-red-600";
}

/**
 * Get grade background color
 */
export function getGradeBgColor(percentage: number): string {
  if (percentage >= 80) return "bg-green-50 border-green-200";
  if (percentage >= 70) return "bg-blue-50 border-blue-200";
  if (percentage >= 60) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

/**
 * Calculate total scores and percentages for a category (assignments or quizzes)
 */
function calculateCategoryStats(items: GradeItem[]) {
  const totalScore = items.reduce((sum, item) => sum + item.score, 0);
  const totalMaxPoints = items.reduce((sum, item) => sum + item.maxPoints, 0);
  const percentage = calculatePercentage(totalScore, totalMaxPoints);

  return {
    totalScore,
    totalMaxPoints,
    percentage,
  };
}

/**
 * Calculate overall grade breakdown from assignments and quizzes
 */
export function calculateGradeBreakdown(
  assignmentItems: GradeItem[],
  quizItems: GradeItem[],
  config: GradebookConfig = DEFAULT_GRADEBOOK_CONFIG
): GradeBreakdown {
  // Calculate assignment stats
  const assignmentStats = calculateCategoryStats(assignmentItems);

  // Calculate quiz stats
  const quizStats = calculateCategoryStats(quizItems);

  // Calculate weighted overall percentage
  let overallPercentage = 0;

  // Only include weights for categories that have items
  if (assignmentItems.length > 0 && quizItems.length > 0) {
    // Both categories have items, use full weights
    overallPercentage =
      assignmentStats.percentage * config.assignmentWeight +
      quizStats.percentage * config.quizWeight;
  } else if (assignmentItems.length > 0) {
    // Only assignments, use 100% weight
    overallPercentage = assignmentStats.percentage;
  } else if (quizItems.length > 0) {
    // Only quizzes, use 100% weight
    overallPercentage = quizStats.percentage;
  }

  overallPercentage = Math.round(overallPercentage * 100) / 100;

  return {
    assignments: {
      items: assignmentItems,
      totalScore: assignmentStats.totalScore,
      totalMaxPoints: assignmentStats.totalMaxPoints,
      percentage: assignmentStats.percentage,
      weight: config.assignmentWeight,
    },
    quizzes: {
      items: quizItems,
      totalScore: quizStats.totalScore,
      totalMaxPoints: quizStats.totalMaxPoints,
      percentage: quizStats.percentage,
      weight: config.quizWeight,
    },
    overall: {
      percentage: overallPercentage,
      letter: getLetterGrade(overallPercentage),
      status: overallPercentage >= config.passingGrade ? "passing" : "failing",
    },
  };
}

/**
 * Calculate class average from multiple student grades
 */
export function calculateClassAverage(studentGrades: number[]): number {
  if (studentGrades.length === 0) return 0;
  const sum = studentGrades.reduce((acc, grade) => acc + grade, 0);
  return Math.round((sum / studentGrades.length) * 100) / 100;
}

/**
 * Get statistics for a list of grades
 */
export function getGradeStatistics(grades: number[]) {
  if (grades.length === 0) {
    return {
      average: 0,
      highest: 0,
      lowest: 0,
      median: 0,
      passingCount: 0,
      failingCount: 0,
    };
  }

  const sorted = [...grades].sort((a, b) => a - b);
  const average = calculateClassAverage(grades);
  const highest = sorted[sorted.length - 1];
  const lowest = sorted[0];
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  const passingCount = grades.filter(
    (g) => g >= DEFAULT_GRADEBOOK_CONFIG.passingGrade
  ).length;
  const failingCount = grades.length - passingCount;

  return {
    average: Math.round(average * 100) / 100,
    highest: Math.round(highest * 100) / 100,
    lowest: Math.round(lowest * 100) / 100,
    median: Math.round(median * 100) / 100,
    passingCount,
    failingCount,
  };
}

/**
 * Format grade display with appropriate styling
 */
export function formatGrade(score: number | null, maxPoints: number): string {
  if (score === null || score === undefined) return "-";
  return `${score}/${maxPoints}`;
}

/**
 * Format percentage display
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}
