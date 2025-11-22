/**
 * Supabase Storage Helper Functions
 * Handles file uploads, downloads, and permissions
 */

import { createClient } from "@/lib/supabase/client";

export type StorageBucket = "materials" | "assignments" | "avatars";

export interface UploadOptions {
  bucket: StorageBucket;
  folder: string;
  file: File;
  fileName?: string;
}

export interface UploadResult {
  success: boolean;
  path?: string;
  publicUrl?: string;
  error?: string;
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  options: UploadOptions
): Promise<UploadResult> {
  const { bucket, folder, file, fileName } = options;
  const supabase = createClient();

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = (fileName || file.name).replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    );
    const path = `${folder}/${timestamp}-${sanitizedName}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error("Upload exception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Get signed URL for private file (expires in 1 hour)
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600
): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      return { error: error.message };
    }

    return { url: data.signedUrl };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to get signed URL",
    };
  }
}

/**
 * Download file from storage
 */
export async function downloadFile(
  bucket: StorageBucket,
  path: string
): Promise<{ blob?: Blob; error?: string }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);

    if (error) {
      return { error: error.message };
    }

    return { blob: data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Download failed",
    };
  }
}

/**
 * List files in a folder
 */
export async function listFiles(
  bucket: StorageBucket,
  folder: string
): Promise<{ files?: any[]; error?: string }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.storage.from(bucket).list(folder);

    if (error) {
      return { error: error.message };
    }

    return { files: data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "List failed",
    };
  }
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size (in MB)
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Get file extension
 */
export function getFileExtension(fileName: string): string {
  return fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Get MIME type from extension
 */
export function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };

  return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Extract storage path from full URL
 */
export function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split("/");
    // Remove /storage/v1/object/public/{bucket}
    return pathSegments.slice(5).join("/");
  } catch {
    return null;
  }
}

/**
 * Allowed file types for materials
 */
export const ALLOWED_MATERIAL_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/webp",
];

/**
 * Allowed file types for assignments
 */
export const ALLOWED_ASSIGNMENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

/**
 * Max file sizes
 */
export const MAX_MATERIAL_SIZE_MB = 50;
export const MAX_ASSIGNMENT_SIZE_MB = 20;
export const MAX_AVATAR_SIZE_MB = 2;
