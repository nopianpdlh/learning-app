/**
 * Student Assignment Submit API
 * POST /api/student/assignments/[id]/submit - Submit assignment with file upload
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

// Allowed file types and max size
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png"];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const assignmentId = params.id;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!studentProfile) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Get assignment and verify enrollment
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        class: {
          include: {
            enrollments: {
              where: {
                studentId: studentProfile.id,
                status: { in: ["ACTIVE", "PAID"] },
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    if (assignment.class.enrollments.length === 0) {
      return NextResponse.json(
        { error: "You are not enrolled in this class" },
        { status: 403 }
      );
    }

    if (assignment.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "This assignment is not available" },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit` },
        { status: 400 }
      );
    }

    // Validate file extension
    const fileName = file.name.toLowerCase();
    const ext = fileName.substring(fileName.lastIndexOf("."));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          error: `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Check if already submitted (for resubmit)
    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: assignmentId,
          studentId: studentProfile.id,
        },
      },
    });

    // Determine submission status
    const now = new Date();
    const isPastDue = new Date(assignment.dueDate) < now;
    const submissionStatus = isPastDue ? "LATE" : "SUBMITTED";

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `submissions/${assignmentId}/${studentProfile.id}/${timestamp}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("submissions")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Create or update submission
    let submission;
    if (existingSubmission) {
      // Resubmit - update existing
      submission = await prisma.assignmentSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          fileUrl: storagePath,
          status: submissionStatus,
          submittedAt: now,
          // Clear previous grading if resubmitted
          score: null,
          feedback: null,
          gradedAt: null,
        },
      });
    } else {
      // New submission
      submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId: assignmentId,
          studentId: studentProfile.id,
          fileUrl: storagePath,
          status: submissionStatus,
          submittedAt: now,
        },
      });
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        status: submission.status,
        submittedAt: submission.submittedAt.toISOString(),
        isResubmit: !!existingSubmission,
      },
      message: existingSubmission
        ? "Assignment resubmitted successfully"
        : "Assignment submitted successfully",
    });
  } catch (error) {
    console.error("POST /api/student/assignments/[id]/submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit assignment" },
      { status: 500 }
    );
  }
}
