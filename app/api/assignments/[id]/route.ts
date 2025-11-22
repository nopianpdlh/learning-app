/**
 * Assignments API - Single Assignment Operations
 * GET /api/assignments/[id] - Get assignment by ID
 * PUT /api/assignments/[id] - Update assignment
 * DELETE /api/assignments/[id] - Delete assignment
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { updateAssignmentSchema } from "@/lib/validations/assignment.schema";
import { deleteFile, extractPathFromUrl } from "@/lib/storage";

/**
 * GET /api/assignments/[id]
 * Get single assignment by ID
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
        studentProfile: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            tutorId: true,
            tutor: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            submissions: true,
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

    // Check access permissions
    if (dbUser.role === "STUDENT") {
      // Student must be enrolled and assignment must be published
      if (assignment.status !== "PUBLISHED") {
        return NextResponse.json(
          { error: "Assignment not available" },
          { status: 403 }
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
          { error: "Access denied to this assignment" },
          { status: 403 }
        );
      }

      // Check if student has submitted
      const submission = await prisma.assignmentSubmission.findFirst({
        where: {
          assignmentId: params.id,
          studentId: dbUser.studentProfile?.id,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          ...assignment,
          submission,
        },
      });
    } else if (dbUser.role === "TUTOR") {
      // Tutor must own the class
      if (assignment.class.tutorId !== dbUser.tutorProfile?.id) {
        return NextResponse.json(
          { error: "Access denied to this assignment" },
          { status: 403 }
        );
      }
    }
    // Admin can access all assignments

    return NextResponse.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error("GET /api/assignments/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/assignments/[id]
 * Update assignment (Tutor/Admin only)
 */
export async function PUT(
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

    // Only tutors and admins can update assignments
    if (dbUser.role !== "TUTOR" && dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only tutors and admins can update assignments" },
        { status: 403 }
      );
    }

    // Get existing assignment
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        class: true,
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check if tutor owns the class
    if (
      dbUser.role === "TUTOR" &&
      existingAssignment.class.tutorId !== dbUser.tutorProfile?.id
    ) {
      return NextResponse.json(
        { error: "You can only update assignments in your own classes" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validatedData = updateAssignmentSchema.parse(body);

    // Update assignment
    const updatedAssignment = await prisma.assignment.update({
      where: { id: params.id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.instructions && {
          instructions: validatedData.instructions,
        }),
        ...(validatedData.dueDate && {
          dueDate: new Date(validatedData.dueDate),
        }),
        ...(validatedData.maxPoints !== undefined && {
          maxPoints: validatedData.maxPoints,
        }),
        ...(validatedData.attachmentUrl !== undefined && {
          attachmentUrl: validatedData.attachmentUrl,
        }),
        ...(validatedData.status && { status: validatedData.status }),
      },
      include: {
        class: {
          select: {
            name: true,
          },
        },
      },
    });

    // If status changed to PUBLISHED, notify students
    if (
      validatedData.status === "PUBLISHED" &&
      existingAssignment.status === "DRAFT"
    ) {
      const enrolledStudents = await prisma.enrollment.findMany({
        where: {
          classId: existingAssignment.classId,
          status: { in: ["PAID", "ACTIVE"] },
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      await prisma.notification.createMany({
        data: enrolledStudents.map((enrollment) => ({
          userId: enrollment.student.user.id,
          title: "New Assignment",
          message: `Assignment "${updatedAssignment.title}" has been published in ${updatedAssignment.class.name}`,
          type: "ASSIGNMENT",
        })),
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedAssignment,
      message: "Assignment updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/assignments/[id] error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/assignments/[id]
 * Delete assignment (Tutor/Admin only)
 */
export async function DELETE(
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

    // Only tutors and admins can delete assignments
    if (dbUser.role !== "TUTOR" && dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only tutors and admins can delete assignments" },
        { status: 403 }
      );
    }

    // Get existing assignment
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        class: true,
        submissions: true,
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check if tutor owns the class
    if (
      dbUser.role === "TUTOR" &&
      existingAssignment.class.tutorId !== dbUser.tutorProfile?.id
    ) {
      return NextResponse.json(
        { error: "You can only delete assignments from your own classes" },
        { status: 403 }
      );
    }

    // Delete attachment from storage if exists
    if (existingAssignment.attachmentUrl) {
      const filePath = extractPathFromUrl(existingAssignment.attachmentUrl);
      if (filePath) {
        await deleteFile("assignments", filePath);
      }
    }

    // Delete submission files from storage
    for (const submission of existingAssignment.submissions) {
      const filePath = extractPathFromUrl(submission.fileUrl);
      if (filePath) {
        await deleteFile("assignments", filePath);
      }
    }

    // Delete assignment from database (cascade will delete submissions)
    await prisma.assignment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/assignments/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
