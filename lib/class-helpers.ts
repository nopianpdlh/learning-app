/**
 * Helper functions for class data processing
 */

/**
 * Generate a unique class code from subject and grade level
 * Format: {SUBJECT_CODE}-{GRADE}-{LETTER}
 * Example: MAT-XII-A, FIS-XI-B
 */
export function generateClassCode(
  subject: string,
  gradeLevel: string,
  index: number
): string {
  // Get first 3 letters of subject in uppercase
  const subjectCode = subject.slice(0, 3).toUpperCase();

  // Convert index to letter (A, B, C, ...)
  const letter = String.fromCharCode(65 + (index % 26));

  return `${subjectCode}-${gradeLevel}-${letter}`;
}

/**
 * Determine class status based on published state and enrollments
 */
export function determineClassStatus(
  published: boolean,
  enrollmentCount: number
): "active" | "completed" | "draft" {
  if (!published) return "draft";
  if (enrollmentCount > 0) return "active";
  return "completed";
}

/**
 * Calculate class progress percentage using weighted calculation
 * - Materials: 40%
 * - Assignments: 30%
 * - Quizzes: 30%
 *
 * Assumes targets: 12 materials, 6 assignments, 4 quizzes
 */
export function calculateClassProgress(counts: {
  materials: number;
  assignments: number;
  quizzes: number;
}): number {
  // Define targets for each category
  const TARGET_MATERIALS = 12;
  const TARGET_ASSIGNMENTS = 6;
  const TARGET_QUIZZES = 4;

  // Define weights
  const MATERIALS_WEIGHT = 0.4;
  const ASSIGNMENTS_WEIGHT = 0.3;
  const QUIZZES_WEIGHT = 0.3;

  // Calculate individual progress percentages
  const materialsProgress = Math.min(
    100,
    (counts.materials / TARGET_MATERIALS) * 100
  );
  const assignmentsProgress = Math.min(
    100,
    (counts.assignments / TARGET_ASSIGNMENTS) * 100
  );
  const quizzesProgress = Math.min(
    100,
    (counts.quizzes / TARGET_QUIZZES) * 100
  );

  // Calculate weighted total
  const weightedProgress =
    materialsProgress * MATERIALS_WEIGHT +
    assignmentsProgress * ASSIGNMENTS_WEIGHT +
    quizzesProgress * QUIZZES_WEIGHT;

  return Math.round(weightedProgress);
}

/**
 * Transform class data from database to display format
 */
export interface ClassWithStats {
  id: string;
  name: string;
  code: string;
  students: number;
  schedule: string;
  status: "active" | "completed" | "draft";
  progress: number;
  subject: string;
  gradeLevel: string;
  published: boolean;
}

/**
 * Format number to Rupiah currency
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate enrollment rate percentage
 */
export function calculateEnrollmentRate(
  enrolled: number,
  capacity: number
): number {
  if (capacity === 0) return 0;
  return Math.round((enrolled / capacity) * 100);
}

/**
 * Get status color for badge styling
 */
export function getStatusColor(
  status: "active" | "completed" | "draft"
): "default" | "secondary" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "draft":
      return "outline";
    case "completed":
      return "secondary";
    default:
      return "outline";
  }
}

/**
 * Get status label in Indonesian
 */
export function getStatusLabel(
  status: "active" | "completed" | "draft"
): string {
  switch (status) {
    case "active":
      return "Aktif";
    case "draft":
      return "Draft";
    case "completed":
      return "Selesai";
    default:
      return "Draft";
  }
}
