/**
 * Quiz Validation Schemas
 * Zod schemas for quiz creation, questions, attempts, and grading
 */

import { z } from "zod";

// ============================================
// ENUMS
// ============================================

export const QuizStatusEnum = z.enum(["DRAFT", "PUBLISHED", "CLOSED"]);
export const QuestionTypeEnum = z.enum([
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "SHORT_ANSWER",
]);

export type QuizStatus = z.infer<typeof QuizStatusEnum>;
export type QuestionType = z.infer<typeof QuestionTypeEnum>;

// ============================================
// QUIZ QUESTION SCHEMAS
// ============================================

/**
 * Schema for creating a quiz question
 */
export const createQuestionSchema = z.object({
  questionType: QuestionTypeEnum,
  questionText: z
    .string()
    .min(5, "Question text must be at least 5 characters")
    .max(2000, "Question text must not exceed 2000 characters"),
  options: z
    .array(z.string().min(1, "Option cannot be empty"))
    .min(2, "Multiple choice questions must have at least 2 options")
    .max(6, "Multiple choice questions can have maximum 6 options")
    .optional(),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  explanation: z
    .string()
    .max(1000, "Explanation must not exceed 1000 characters")
    .optional(),
  points: z
    .number()
    .int()
    .min(1, "Points must be at least 1")
    .max(100, "Points must not exceed 100")
    .default(10),
  orderIndex: z.number().int().min(0),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;

// ============================================
// QUIZ SCHEMAS
// ============================================

/**
 * Schema for creating a quiz
 */
export const createQuizSchema = z
  .object({
    classId: z.string().cuid(),
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title must not exceed 200 characters"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description must not exceed 2000 characters")
      .optional(),
    timeLimit: z
      .number()
      .int()
      .min(1, "Time limit must be at least 1 minute")
      .max(180, "Time limit must not exceed 180 minutes")
      .optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    passingGrade: z
      .number()
      .int()
      .min(0, "Passing grade must be at least 0")
      .max(100, "Passing grade must not exceed 100")
      .optional(),
    status: QuizStatusEnum.default("DRAFT"),
    questions: z
      .array(createQuestionSchema)
      .min(1, "Quiz must have at least 1 question")
      .max(50, "Quiz can have maximum 50 questions")
      .optional(),
  })
  .refine(
    (data) => {
      // If both dates provided, endDate must be after startDate
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      // If startDate provided, it must be in the future (for new quizzes)
      if (data.startDate) {
        return new Date(data.startDate) > new Date();
      }
      return true;
    },
    {
      message: "Start date must be in the future",
      path: ["startDate"],
    }
  );

export const updateQuizSchema = createQuizSchema
  .partial()
  .omit({ classId: true });

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;

/**
 * Schema for filtering quizzes
 */
export const quizFilterSchema = z.object({
  classId: z.string().cuid().optional(),
  status: QuizStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type QuizFilterInput = z.infer<typeof quizFilterSchema>;

// ============================================
// QUIZ ATTEMPT SCHEMAS
// ============================================

/**
 * Schema for starting a quiz attempt
 */
export const startQuizSchema = z.object({
  quizId: z.string().cuid(),
});

export type StartQuizInput = z.infer<typeof startQuizSchema>;

/**
 * Schema for submitting a single answer
 */
export const submitAnswerSchema = z.object({
  questionId: z.string().cuid(),
  answer: z.string().min(1, "Answer cannot be empty"),
});

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;

/**
 * Schema for submitting all answers at once
 */
export const submitQuizSchema = z.object({
  attemptId: z.string().cuid(),
  answers: z
    .array(submitAnswerSchema)
    .min(1, "At least one answer must be provided"),
});

export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if quiz is currently available to take
 */
export function isQuizAvailable(
  status: QuizStatus,
  startDate?: Date | null,
  endDate?: Date | null
): boolean {
  if (status !== "PUBLISHED") return false;

  const now = new Date();

  if (startDate && now < startDate) return false;
  if (endDate && now > endDate) return false;

  return true;
}

/**
 * Check if quiz has expired
 */
export function isQuizExpired(endDate?: Date | null): boolean {
  if (!endDate) return false;
  return new Date() > endDate;
}

/**
 * Calculate time remaining in minutes
 */
export function getTimeRemaining(endDate: Date): number {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60)));
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(minutes: number): string {
  if (minutes === 0) return "Expired";
  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${hours}h ${mins}m`;
}

/**
 * Auto-grade a single answer
 */
export function gradeAnswer(
  studentAnswer: string,
  correctAnswer: string,
  questionType: QuestionType
): boolean {
  // Normalize answers for comparison
  const normalize = (str: string) => str.trim().toLowerCase();

  const normalizedStudent = normalize(studentAnswer);
  const normalizedCorrect = normalize(correctAnswer);

  switch (questionType) {
    case "MULTIPLE_CHOICE":
    case "TRUE_FALSE":
      // Exact match required
      return normalizedStudent === normalizedCorrect;

    case "SHORT_ANSWER":
      // More lenient comparison for short answers
      // Remove extra spaces and punctuation
      const cleanStudent = normalizedStudent.replace(/[^\w\s]/g, "");
      const cleanCorrect = normalizedCorrect.replace(/[^\w\s]/g, "");
      return cleanStudent === cleanCorrect;

    default:
      return false;
  }
}

/**
 * Calculate quiz score
 */
export function calculateQuizScore(
  answers: Array<{ isCorrect: boolean; points: number }>
): { score: number; totalPoints: number; percentage: number } {
  const score = answers
    .filter((a) => a.isCorrect)
    .reduce((sum, a) => sum + a.points, 0);

  const totalPoints = answers.reduce((sum, a) => sum + a.points, 0);

  const percentage =
    totalPoints > 0 ? Math.round((score / totalPoints) * 100 * 100) / 100 : 0;

  return { score, totalPoints, percentage };
}

/**
 * Validate question options based on type
 */
export function validateQuestionOptions(
  questionType: QuestionType,
  options?: string[],
  correctAnswer?: string
): { valid: boolean; error?: string } {
  switch (questionType) {
    case "MULTIPLE_CHOICE":
      if (!options || options.length < 2) {
        return {
          valid: false,
          error: "Multiple choice questions must have at least 2 options",
        };
      }
      if (!correctAnswer || !options.includes(correctAnswer)) {
        return {
          valid: false,
          error: "Correct answer must be one of the options",
        };
      }
      break;

    case "TRUE_FALSE":
      if (
        !correctAnswer ||
        !["true", "false"].includes(correctAnswer.toLowerCase())
      ) {
        return {
          valid: false,
          error:
            'True/False questions must have "true" or "false" as correct answer',
        };
      }
      break;

    case "SHORT_ANSWER":
      if (!correctAnswer || correctAnswer.trim().length === 0) {
        return {
          valid: false,
          error: "Short answer questions must have a correct answer",
        };
      }
      break;
  }

  return { valid: true };
}

/**
 * Check if student has already taken the quiz
 */
export function hasCompletedQuiz(
  attempts: Array<{ submittedAt: Date | null }>
): boolean {
  return attempts.some((attempt) => attempt.submittedAt !== null);
}

/**
 * Get quiz status badge color
 */
export function getQuizStatusColor(status: QuizStatus): string {
  switch (status) {
    case "PUBLISHED":
      return "bg-green-100 text-green-800";
    case "DRAFT":
      return "bg-gray-100 text-gray-800";
    case "CLOSED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
