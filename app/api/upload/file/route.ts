/**
 * Simple File Upload API
 * POST /api/upload/file - Upload file to Supabase Storage (without creating material record)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import {
  uploadFile,
  validateFileType,
  validateFileSize,
  ALLOWED_MATERIAL_TYPES,
  MAX_MATERIAL_SIZE_MB,
} from "@/lib/storage";

/**
 * POST /api/upload/file
 * Upload file and return URL only (no database record)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        tutorProfile: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only tutors and admins can upload
    if (dbUser.role !== "TUTOR" && dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only tutors and admins can upload files" },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "materials";
    const folder = (formData.get("folder") as string) || "uploads";

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!validateFileType(file, ALLOWED_MATERIAL_TYPES)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Allowed: PDF, DOCX, PPTX, JPEG, PNG, WEBP",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (!validateFileSize(file, MAX_MATERIAL_SIZE_MB)) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size: ${MAX_MATERIAL_SIZE_MB}MB`,
        },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage with authenticated client
    const uploadResult = await uploadFile({
      bucket: bucket as "materials" | "assignments" | "avatars",
      folder,
      file,
      fileName: file.name,
      supabaseClient: supabase, // Pass authenticated client for RLS
    });

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || "Upload failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          publicUrl: uploadResult.publicUrl,
          path: uploadResult.path,
        },
        message: "File uploaded successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/upload/file error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
