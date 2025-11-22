/**
 * File Upload API
 * POST /api/upload - Upload file to Supabase Storage
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
import { fileUploadSchema } from "@/lib/validations/material.schema";

/**
 * POST /api/upload
 * Upload file and create material record
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
    const classId = formData.get("classId") as string;
    const session = formData.get("session") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate metadata
    const validatedData = fileUploadSchema.parse({
      classId,
      session,
      title,
      description,
    });

    // Verify class exists and user has access
    const classData = await prisma.class.findUnique({
      where: { id: validatedData.classId },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Check if tutor owns the class
    if (
      dbUser.role === "TUTOR" &&
      classData.tutorId !== dbUser.tutorProfile?.id
    ) {
      return NextResponse.json(
        { error: "You can only upload files to your own classes" },
        { status: 403 }
      );
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

    // Determine file type
    const fileType = file.type.startsWith("image/")
      ? "IMAGE"
      : file.type === "application/pdf"
      ? "PDF"
      : "DOCUMENT";

    // Upload to Supabase Storage
    const folder = `${validatedData.classId}/session-${validatedData.session}`;
    const uploadResult = await uploadFile({
      bucket: "materials",
      folder,
      file,
      fileName: file.name,
    });

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || "Upload failed" },
        { status: 500 }
      );
    }

    // Create material record in database
    const material = await prisma.material.create({
      data: {
        classId: validatedData.classId,
        title: validatedData.title,
        description: validatedData.description,
        session: validatedData.session,
        fileType,
        fileUrl: uploadResult.publicUrl,
      },
      include: {
        class: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: material,
        message: "File uploaded successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/upload error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
