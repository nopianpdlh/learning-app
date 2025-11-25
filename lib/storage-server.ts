/**
 * Supabase Storage Server-Side Helper
 * Uses service role key for backend uploads (bypasses RLS)
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

// Service role client - bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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
 * Server-side upload using service role (bypasses RLS)
 */
export async function uploadFileServer(
  options: UploadOptions
): Promise<UploadResult> {
  const { bucket, folder, file, fileName } = options;

  try {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const sanitizedFileName =
      fileName || file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const finalFileName = `${timestamp}_${randomString}_${sanitizedFileName}`;
    const filePath = `${folder}/${finalFileName}`;

    console.log("📤 [Server Upload] Starting:", {
      bucket,
      filePath,
      fileSize: file.size,
      fileType: file.type,
    });

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("❌ [Server Upload] Error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log("✅ [Server Upload] Success:", data.path);

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);

    return {
      success: true,
      path: data.path,
      publicUrl,
    };
  } catch (error) {
    console.error("❌ [Server Upload] Exception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Generate signed URL for secure download (1 hour expiry)
 */
export async function getSignedUrlServer(
  bucket: StorageBucket,
  path: string,
  expiresInSeconds: number = 3600
): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error) {
      console.error("❌ [Signed URL] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, signedUrl: data.signedUrl };
  } catch (error) {
    console.error("❌ [Signed URL] Exception:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate signed URL",
    };
  }
}

/**
 * Delete file from storage
 */
export async function deleteFileServer(
  bucket: StorageBucket,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);

    if (error) {
      console.error("❌ [Delete] Error:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ [Delete] Success:", path);
    return { success: true };
  } catch (error) {
    console.error("❌ [Delete] Exception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete file",
    };
  }
}
