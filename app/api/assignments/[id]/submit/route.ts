/**
 * Assignment Submissions API
 * POST /api/assignments/[id]/submit - Submit assignment
 * GET /api/assignments/[id]/submissions - Get all submissions (Tutor only)
 * Updated to use section-based system
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import {
  submitAssignmentSchema,
  calculateSubmissionStatus,
} from "@/lib/validations/assignment.schema";

/**
 * POST /api/assignments/[id]/submit
 * Student submits assignment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
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
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check if student is enrolled via section
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        sectionId: assignment.sectionId,
        studentId: dbUser.studentProfile?.id,
        status: { in: ["ACTIVE", "EXPIRED"] },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "You must be enrolled in this section to submit" },
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
      assignmentId: assignmentId,
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
        assignmentId: assignmentId,
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
          assignmentId: assignmentId,
          studentId: dbUser.studentProfile!.id,
          fileUrl: validatedData.fileUrl,
          status,
          submittedAt,
        },
      });
    }

    // Create notification for tutor via section
    const sectionData = await prisma.classSection.findUnique({
      where: { id: assignment.sectionId },
      include: {
        template: true,
        tutor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (sectionData) {
      await prisma.notification.create({
        data: {
          userId: sectionData.tutor.user.id,
          title: "New Submission",
          message: `${dbUser.name} submitted "${assignment.title}" in ${sectionData.template.name}`,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
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

    // Get assignment with section
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        section: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check permissions via section
    if (dbUser.role === "TUTOR") {
      if (assignment.section.tutorId !== dbUser.tutorProfile?.id) {
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
      where: { assignmentId: assignmentId },
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
