/**
 * Grade Assignment Submission API
 * PUT /api/assignments/[id]/submissions/[submissionId] - Grade a submission
 * Updated to use section-based system
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import {
  gradeSubmissionSchema,
  validateScore,
} from "@/lib/validations/assignment.schema";

/**
 * PUT /api/assignments/[id]/submissions/[submissionId]
 * Grade a submission (Tutor/Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const { id: assignmentId, submissionId } = await params;
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

    // Only tutors and admins can grade
    if (dbUser.role !== "TUTOR" && dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only tutors and admins can grade submissions" },
        { status: 403 }
      );
    }

    // Get assignment and submission
    const [assignment, submission] = await Promise.all([
      prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          section: {
            include: {
              tutor: true,
              template: true,
            },
          },
        },
      }),
      prisma.assignmentSubmission.findUnique({
        where: { id: submissionId },
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      }),
    ]);

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Verify submission belongs to this assignment
    if (submission.assignmentId !== assignmentId) {
      return NextResponse.json(
        { error: "Submission does not belong to this assignment" },
        { status: 400 }
      );
    }

    // Check if tutor owns the section
    if (
      dbUser.role === "TUTOR" &&
      assignment.section.tutorId !== dbUser.tutorProfile?.id
    ) {
      return NextResponse.json(
        { error: "You can only grade submissions in your own sections" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validatedData = gradeSubmissionSchema.parse(body);

    // Validate score against max points
    if (!validateScore(validatedData.score, assignment.maxPoints)) {
      return NextResponse.json(
        {
          error: `Score must be between 0 and ${assignment.maxPoints}`,
        },
        { status: 400 }
      );
    }

    // Update submission with grade
    const gradedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: validatedData.score,
        feedback: validatedData.feedback,
        status: "GRADED",
        gradedAt: new Date(),
      },
      include: {
        assignment: {
          select: {
            title: true,
            section: {
              select: {
                sectionLabel: true,
                template: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const className = `${gradedSubmission.assignment.section.template.name} - ${gradedSubmission.assignment.section.sectionLabel}`;

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: gradedSubmission.student.user.id,
        title: "Assignment Graded",
        message: `Your submission for "${gradedSubmission.assignment.title}" in ${className} has been graded: ${validatedData.score}/${assignment.maxPoints}`,
        type: "ASSIGNMENT",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...gradedSubmission,
        // Client compatibility
        assignment: {
          ...gradedSubmission.assignment,
          class: {
            name: className,
          },
        },
      },
      message: "Submission graded successfully",
    });
  } catch (error) {
    console.error(
      "PUT /api/assignments/[id]/submissions/[submissionId] error:",
      error
    );

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to grade submission" },
      { status: 500 }
    );
  }
}
