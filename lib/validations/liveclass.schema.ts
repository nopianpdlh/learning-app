/**
 * Live Class Validation Schemas
 * Zod schemas for live class scheduling and management
 */

import { z } from "zod";

// ============================================
// SCHEMAS
// ============================================

/**
 * Create Live Class Schema
 */
export const createLiveClassSchema = z.object({
  classId: z.string().cuid("Invalid class ID"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title too long"),
  meetingUrl: z
    .string()
    .url("Invalid meeting URL")
    .refine(
      (url) => {
        // Validate Zoom or Google Meet URLs
        return url.includes("zoom.us") || url.includes("meet.google.com");
      },
      { message: "URL must be a Zoom or Google Meet link" }
    ),
  scheduledAt: z.string().refine(
    (date) => {
      const scheduledDate = new Date(date);
      const now = new Date();
      return scheduledDate > now;
    },
    { message: "Scheduled time must be in the future" }
  ),
  duration: z
    .number()
    .int()
    .min(15, "Duration must be at least 15 minutes")
    .max(480, "Duration cannot exceed 8 hours"),
});

/**
 * Update Live Class Schema
 */
export const updateLiveClassSchema = createLiveClassSchema
  .partial()
  .omit({ classId: true });

/**
 * Live Class Filter Schema (for query params)
 */
export const liveClassFilterSchema = z.object({
  classId: z.string().cuid().optional(),
  upcoming: z.enum(["true", "false"]).optional(),
  page: z.string().regex(/^\d+$/).optional().default("1"),
  limit: z.string().regex(/^\d+$/).optional().default("20"),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateLiveClassInput = z.infer<typeof createLiveClassSchema>;
export type UpdateLiveClassInput = z.infer<typeof updateLiveClassSchema>;
export type LiveClassFilterInput = z.infer<typeof liveClassFilterSchema>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if live class is upcoming (within next 24 hours)
 */
export function isUpcoming(scheduledAt: Date): boolean {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return scheduledAt >= now && scheduledAt <= tomorrow;
}

/**
 * Check if live class is happening now (within duration window)
 */
export function isLiveNow(scheduledAt: Date, duration: number): boolean {
  const now = new Date();
  const endTime = new Date(scheduledAt.getTime() + duration * 60 * 1000);
  return now >= scheduledAt && now <= endTime;
}

/**
 * Get time until live class starts
 */
export function getTimeUntil(scheduledAt: Date): string {
  const now = new Date();
  const diff = scheduledAt.getTime() - now.getTime();

  if (diff <= 0) return "Started";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} minutes`;
}

/**
 * Format duration in human readable format
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${mins} minute${mins > 1 ? "s" : ""}`;
}

/**
 * Get status color for live class
 */
export function getLiveClassStatusColor(
  scheduledAt: Date,
  duration: number
): string {
  if (isLiveNow(scheduledAt, duration)) return "bg-green-100 text-green-800";
  if (isUpcoming(scheduledAt)) return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-800";
}

/**
 * Get status text for live class
 */
export function getLiveClassStatusText(
  scheduledAt: Date,
  duration: number
): string {
  if (isLiveNow(scheduledAt, duration)) return "LIVE NOW";
  if (isUpcoming(scheduledAt)) return "UPCOMING";

  const now = new Date();
  if (scheduledAt < now) return "ENDED";

  return "SCHEDULED";
}
