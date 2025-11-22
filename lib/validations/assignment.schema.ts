/**
 * Assignment Validation Schemas
 * Zod schemas for assignments and submissions
 */

import { z } from "zod";

/**
 * Assignment Status Enum
 */
export const AssignmentStatusEnum = z.enum(["DRAFT", "PUBLISHED"]);

/**
 * Submission Status Enum
 */
export const SubmissionStatusEnum = z.enum([
  "NOT_SUBMITTED",
  "SUBMITTED",
  "GRADED",
  "LATE",
]);

/**
 * Create Assignment Schema
 */
export const createAssignmentSchema = z.object({
  classId: z.string().cuid("Invalid class ID"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  instructions: z
    .string()
    .min(10, "Instructions must be at least 10 characters")
    .max(5000, "Instructions must be less than 5000 characters"),
  dueDate: z
    .string()
    .datetime("Invalid date format")
    .refine(
      (date) => new Date(date) > new Date(),
      "Due date must be in the future"
    ),
  maxPoints: z
    .number()
    .int("Max points must be an integer")
    .min(1, "Max points must be at least 1")
    .max(1000, "Max points cannot exceed 1000")
    .default(100),
  attachmentUrl: z.string().url("Invalid attachment URL").optional().nullable(),
  status: AssignmentStatusEnum.default("DRAFT"),
});

/**
 * Update Assignment Schema
 */
export const updateAssignmentSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  instructions: z
    .string()
    .min(10, "Instructions must be at least 10 characters")
    .max(5000, "Instructions must be less than 5000 characters")
    .optional(),
  dueDate: z
    .string()
    .datetime("Invalid date format")
    .refine(
      (date) => new Date(date) > new Date(),
      "Due date must be in the future"
    )
    .optional(),
  maxPoints: z
    .number()
    .int("Max points must be an integer")
    .min(1, "Max points must be at least 1")
    .max(1000, "Max points cannot exceed 1000")
    .optional(),
  attachmentUrl: z.string().url("Invalid attachment URL").optional().nullable(),
  status: AssignmentStatusEnum.optional(),
});

/**
 * Assignment Filter Schema (for GET requests)
 */
export const assignmentFilterSchema = z.object({
  classId: z.string().cuid("Invalid class ID").optional(),
  status: AssignmentStatusEnum.optional(),
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),
});

/**
 * Submit Assignment Schema
 */
export const submitAssignmentSchema = z.object({
  assignmentId: z.string().cuid("Invalid assignment ID"),
  fileUrl: z.string().url("Invalid file URL"),
});

/**
 * Grade Submission Schema
 */
export const gradeSubmissionSchema = z.object({
  score: z
    .number()
    .int("Score must be an integer")
    .min(0, "Score cannot be negative"),
  feedback: z
    .string()
    .max(2000, "Feedback must be less than 2000 characters")
    .optional()
    .nullable(),
});

/**
 * Submission Filter Schema
 */
export const submissionFilterSchema = z.object({
  assignmentId: z.string().cuid("Invalid assignment ID").optional(),
  studentId: z.string().cuid("Invalid student ID").optional(),
  status: SubmissionStatusEnum.optional(),
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),
});

/**
 * Type exports
 */
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type AssignmentFilterInput = z.infer<typeof assignmentFilterSchema>;
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
export type SubmissionFilterInput = z.infer<typeof submissionFilterSchema>;
export type AssignmentStatus = z.infer<typeof AssignmentStatusEnum>;
export type SubmissionStatus = z.infer<typeof SubmissionStatusEnum>;

/**
 * Helper: Check if assignment is overdue
 */
export function isOverdue(dueDate: Date): boolean {
  return new Date() > dueDate;
}

/**
 * Helper: Calculate submission status
 */
export function calculateSubmissionStatus(
  submittedAt: Date | null,
  dueDate: Date,
  isGraded: boolean
): SubmissionStatus {
  if (!submittedAt) return "NOT_SUBMITTED";
  if (isGraded) return "GRADED";
  if (submittedAt > dueDate) return "LATE";
  return "SUBMITTED";
}

/**
 * Helper: Format time remaining
 */
export function getTimeRemaining(dueDate: Date): string {
  const now = new Date();
  const diff = dueDate.getTime() - now.getTime();

  if (diff < 0) return "Overdue";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} remaining`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} remaining`;
  return `${minutes} minute${minutes > 1 ? "s" : ""} remaining`;
}

/**
 * Helper: Validate score against max points
 */
export function validateScore(score: number, maxPoints: number): boolean {
  return score >= 0 && score <= maxPoints;
}
