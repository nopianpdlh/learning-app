/**
 * Assignment Submissions API
 * POST /api/assignments/[id]/submit - Submit assignment
 * GET /api/assignments/[id]/submissions - Get all submissions (Tutor only)
 * PUT /api/assignments/[id]/submissions/[submissionId]/grade - Grade submission
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import {
  submitAssignmentSchema,
  gradeSubmissionSchema,
  calculateSubmissionStatus,
  validateScore,
} from "@/lib/validations/assignment.schema";

/**
 * POST /api/assignments/[id]/submit
 * Student submits assignment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        studentProfile: true,
      },
    });

    if (!dbUser || dbUser.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can submit assignments" },
        { status: 403 }
      );
    }

    // Get assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check if student is enrolled
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        classId: assignment.classId,
        studentId: dbUser.studentProfile?.id,
        status: { in: ["PAID", "ACTIVE"] },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "You must be enrolled in this class to submit" },
        { status: 403 }
      );
    }

    // Check if assignment is published
    if (assignment.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Assignment is not available" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validatedData = submitAssignmentSchema.parse({
      assignmentId: params.id,
      fileUrl: body.fileUrl,
    });

    const submittedAt = new Date();
    const status = calculateSubmissionStatus(
      submittedAt,
      assignment.dueDate,
      false
    );

    // Check if student already submitted
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId: params.id,
        studentId: dbUser.studentProfile?.id,
      },
    });

    let submission;

    if (existingSubmission) {
      // Update existing submission
      submission = await prisma.assignmentSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          fileUrl: validatedData.fileUrl,
          status,
          submittedAt,
          // Reset score and feedback when resubmitting
          score: null,
          feedback: null,
          gradedAt: null,
        },
      });
    } else {
      // Create new submission
      submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId: params.id,
          studentId: dbUser.studentProfile!.id,
          fileUrl: validatedData.fileUrl,
          status,
          submittedAt,
        },
      });
    }

    // Create notification for tutor
    const classData = await prisma.class.findUnique({
      where: { id: assignment.classId },
      include: {
        tutor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (classData) {
      await prisma.notification.create({
        data: {
          userId: classData.tutor.user.id,
          title: "New Submission",
          message: `${dbUser.name} submitted "${assignment.title}" in ${classData.name}`,
          type: "ASSIGNMENT",
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: submission,
        message: "Assignment submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/assignments/[id]/submit error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit assignment" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/assignments/[id]/submissions
 * Get all submissions for an assignment (Tutor/Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        class: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (dbUser.role === "TUTOR") {
      if (assignment.class.tutorId !== dbUser.tutorProfile?.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else if (dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only tutors and admins can view submissions" },
        { status: 403 }
      );
    }

    // Get all submissions for this assignment
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: params.id },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error("GET /api/assignments/[id]/submissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
