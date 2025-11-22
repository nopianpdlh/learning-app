/**
 * Forum Validation Schemas
 * Zod schemas for forum threads and posts
 */

import { z } from "zod";

// ============================================
// SCHEMAS
// ============================================

/**
 * Create Forum Thread Schema
 */
export const createThreadSchema = z.object({
  classId: z.string().cuid("Invalid class ID"),
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title too long"),
});

/**
 * Update Forum Thread Schema
 */
export const updateThreadSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title too long")
    .optional(),
  isPinned: z.boolean().optional(),
});

/**
 * Create Forum Post Schema
 */
export const createPostSchema = z.object({
  threadId: z.string().cuid("Invalid thread ID"),
  content: z
    .string()
    .min(1, "Content cannot be empty")
    .max(5000, "Content too long"),
  parentId: z.string().cuid("Invalid parent post ID").optional(), // For replies
});

/**
 * Update Forum Post Schema
 */
export const updatePostSchema = z.object({
  content: z
    .string()
    .min(1, "Content cannot be empty")
    .max(5000, "Content too long"),
});

/**
 * Forum Filter Schema (for query params)
 */
export const forumFilterSchema = z.object({
  classId: z.string().cuid().optional(),
  page: z.string().regex(/^\d+$/).optional().default("1"),
  limit: z.string().regex(/^\d+$/).optional().default("20"),
  sort: z
    .enum(["recent", "oldest", "mostReplies"])
    .optional()
    .default("recent"),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type UpdateThreadInput = z.infer<typeof updateThreadSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type ForumFilterInput = z.infer<typeof forumFilterSchema>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get time ago text for post
 */
export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Count total replies in thread (including nested)
 */
export function countReplies(posts: any[]): number {
  return posts.length - 1; // Exclude the first post (thread starter)
}

/**
 * Get thread status badge color
 */
export function getThreadBadgeColor(
  isPinned: boolean,
  replyCount: number
): string {
  if (isPinned) return "bg-blue-100 text-blue-800";
  if (replyCount === 0) return "bg-gray-100 text-gray-600";
  if (replyCount > 10) return "bg-green-100 text-green-800";
  return "bg-yellow-100 text-yellow-800";
}
