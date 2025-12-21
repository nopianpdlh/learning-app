/**
 * Assignment File Upload API
 * POST /api/assignments/upload - Upload assignment attachment or submission file
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import {
  uploadFile,
  validateFileType,
  validateFileSize,
  ALLOWED_ASSIGNMENT_TYPES,
  MAX_ASSIGNMENT_SIZE_MB,
} from "@/lib/storage";

/**
 * POST /api/assignments/upload
 * Upload assignment attachment or submission file
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
        studentProfile: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string; // 'attachment' or 'submission'
    const assignmentId = formData.get("assignmentId") as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!type || !["attachment", "submission"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid upload type" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!validateFileType(file, ALLOWED_ASSIGNMENT_TYPES)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Allowed: PDF, DOCX, JPEG, PNG",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (!validateFileSize(file, MAX_ASSIGNMENT_SIZE_MB)) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size: ${MAX_ASSIGNMENT_SIZE_MB}MB`,
        },
        { status: 400 }
      );
    }

    // Handle attachment upload (tutor only)
    if (type === "attachment") {
      if (dbUser.role !== "TUTOR" && dbUser.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only tutors can upload attachments" },
          { status: 403 }
        );
      }

      if (!assignmentId) {
        return NextResponse.json(
          { error: "Assignment ID required for attachments" },
          { status: 400 }
        );
      }

      // Verify assignment exists and tutor owns it
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: { class: true },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: "Assignment not found" },
          { status: 404 }
        );
      }

      if (
        dbUser.role === "TUTOR" &&
        assignment.class.tutorId !== dbUser.tutorProfile?.id
      ) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Upload to storage with authenticated client
      const folder = `assignment-files/${assignmentId}`;
      const uploadResult = await uploadFile({
        bucket: "assignments",
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

      return NextResponse.json({
        success: true,
        data: {
          fileUrl: uploadResult.publicUrl,
          fileName: file.name,
          fileSize: file.size,
        },
        message: "Attachment uploaded successfully",
      });
    }

    // Handle submission upload (student only)
    if (type === "submission") {
      if (dbUser.role !== "STUDENT") {
        return NextResponse.json(
          { error: "Only students can upload submissions" },
          { status: 403 }
        );
      }

      if (!assignmentId) {
        return NextResponse.json(
          { error: "Assignment ID required for submissions" },
          { status: 400 }
        );
      }

      // Verify assignment exists and student is enrolled
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: "Assignment not found" },
          { status: 404 }
        );
      }

      const enrollment = await prisma.enrollment.findFirst({
        where: {
          classId: assignment.classId,
          studentId: dbUser.studentProfile?.id,
          status: { in: ["PAID", "ACTIVE"] },
        },
      });

      if (!enrollment) {
        return NextResponse.json(
          { error: "You must be enrolled to submit" },
          { status: 403 }
        );
      }

      // Check for existing submission to generate unique folder
      const existingSubmission = await prisma.assignmentSubmission.findFirst({
        where: {
          assignmentId,
          studentId: dbUser.studentProfile?.id,
        },
      });

      const submissionId = existingSubmission?.id || `temp-${Date.now()}`;

      // Upload to storage with authenticated client
      const folder = `submissions/${submissionId}`;
      const uploadResult = await uploadFile({
        bucket: "assignments",
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

      return NextResponse.json({
        success: true,
        data: {
          fileUrl: uploadResult.publicUrl,
          fileName: file.name,
          fileSize: file.size,
        },
        message: "Submission uploaded successfully",
      });
    }

    return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/assignments/upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
