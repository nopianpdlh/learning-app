/**
 * Material Validation Schemas
 * Zod schemas for learning materials
 */

import { z } from "zod";

/**
 * File types enum
 */
export const FileType = z.enum(["PDF", "VIDEO", "LINK", "DOCUMENT", "IMAGE"]);

/**
 * Create Material Schema
 */
export const createMaterialSchema = z
  .object({
    classId: z.string().cuid("Invalid class ID"),
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title must be less than 200 characters"),
    description: z
      .string()
      .max(1000, "Description must be less than 1000 characters")
      .optional()
      .nullable(),
    session: z
      .number()
      .int("Session must be an integer")
      .min(1, "Session must be at least 1")
      .max(100, "Session cannot exceed 100"),
    fileType: FileType,
    fileUrl: z.string().url("Invalid file URL").optional().nullable(),
    videoUrl: z.string().url("Invalid video URL").optional().nullable(),
  })
  .refine(
    (data) => {
      // At least one URL must be provided
      if (data.fileType === "VIDEO") {
        return !!data.videoUrl;
      }
      if (data.fileType === "LINK") {
        return !!data.fileUrl;
      }
      return !!data.fileUrl;
    },
    {
      message: "Either fileUrl or videoUrl must be provided based on fileType",
      path: ["fileUrl"],
    }
  )
  .refine(
    (data) => {
      // Validate YouTube/Vimeo URLs for VIDEO type
      if (data.fileType === "VIDEO" && data.videoUrl) {
        const youtubeRegex =
          /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+$/;
        return (
          youtubeRegex.test(data.videoUrl) || vimeoRegex.test(data.videoUrl)
        );
      }
      return true;
    },
    {
      message: "Video URL must be from YouTube or Vimeo",
      path: ["videoUrl"],
    }
  );

/**
 * Update Material Schema
 */
export const updateMaterialSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title must be less than 200 characters")
      .optional(),
    description: z
      .string()
      .max(1000, "Description must be less than 1000 characters")
      .optional()
      .nullable(),
    session: z
      .number()
      .int("Session must be an integer")
      .min(1, "Session must be at least 1")
      .max(100, "Session cannot exceed 100")
      .optional(),
    fileType: FileType.optional(),
    fileUrl: z.string().optional().nullable(), // Allow both URL and path
    videoUrl: z.string().url("Invalid video URL").optional().nullable(),
  })
  .refine(
    (data) => {
      // Validate YouTube/Vimeo URLs for VIDEO type
      if (data.fileType === "VIDEO" && data.videoUrl) {
        const youtubeRegex =
          /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+$/;
        return (
          youtubeRegex.test(data.videoUrl) || vimeoRegex.test(data.videoUrl)
        );
      }
      return true;
    },
    {
      message: "Video URL must be from YouTube or Vimeo",
      path: ["videoUrl"],
    }
  );

/**
 * Material Filter Schema (for GET requests)
 */
export const materialFilterSchema = z.object({
  classId: z.string().cuid("Invalid class ID").optional(),
  session: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional(),
  fileType: FileType.optional(),
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
 * Material ID Schema
 */
export const materialIdSchema = z.object({
  id: z.string().cuid("Invalid material ID"),
});

/**
 * File Upload Schema
 */
export const fileUploadSchema = z.object({
  classId: z.string().cuid("Invalid class ID"),
  session: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .nullable()
    .optional()
    .transform((val) => val || null),
});

/**
 * Video Embed Schema
 */
export const videoEmbedSchema = z.object({
  classId: z.string().cuid("Invalid class ID"),
  session: z.number().int().min(1).max(100),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .nullable(),
  videoUrl: z
    .string()
    .url("Invalid video URL")
    .refine(
      (url) => {
        const youtubeRegex =
          /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+$/;
        return youtubeRegex.test(url) || vimeoRegex.test(url);
      },
      {
        message: "Video URL must be from YouTube or Vimeo",
      }
    ),
});

/**
 * Type exports
 */
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type MaterialFilterInput = z.infer<typeof materialFilterSchema>;
export type MaterialIdInput = z.infer<typeof materialIdSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type VideoEmbedInput = z.infer<typeof videoEmbedSchema>;
export type FileTypeEnum = z.infer<typeof FileType>;

/**
 * Helper: Extract YouTube video ID
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/,
    /youtube\.com\/v\/([^&\s]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Helper: Extract Vimeo video ID
 */
export function extractVimeoId(url: string): string | null {
  const pattern = /vimeo\.com\/(?:video\/)?(\d+)/;
  const match = url.match(pattern);
  return match ? match[1] : null;
}

/**
 * Helper: Generate embed URL
 */
export function getEmbedUrl(videoUrl: string): string | null {
  const youtubeId = extractYouTubeId(videoUrl);
  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}`;
  }

  const vimeoId = extractVimeoId(videoUrl);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}`;
  }

  return null;
}
