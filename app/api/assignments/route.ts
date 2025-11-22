/**
 * Assignments API - List and Create
 * GET /api/assignments - List assignments with filters
 * POST /api/assignments - Create new assignment
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import {
  createAssignmentSchema,
  assignmentFilterSchema,
} from "@/lib/validations/assignment.schema";

/**
 * GET /api/assignments
 * List assignments with optional filters
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = assignmentFilterSchema.parse({
      classId: searchParams.get("classId") || undefined,
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

    // Build query conditions
    const where: any = {};

    // Filter by classId if provided
    if (filters.classId) {
      where.classId = filters.classId;

      // Check user has access to this class
      if (dbUser.role === "STUDENT") {
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            classId: filters.classId,
            studentId: dbUser.studentProfile?.id,
            status: { in: ["PAID", "ACTIVE"] },
          },
        });

        if (!enrollment) {
          return NextResponse.json(
            { error: "Access denied to this class" },
            { status: 403 }
          );
        }
      } else if (dbUser.role === "TUTOR") {
        const classData = await prisma.class.findFirst({
          where: {
            id: filters.classId,
            tutorId: dbUser.tutorProfile?.id,
          },
        });

        if (!classData) {
          return NextResponse.json(
            { error: "Access denied to this class" },
            { status: 403 }
          );
        }
      }
    } else {
      // No classId provided, filter by user role
      if (dbUser.role === "STUDENT") {
        // Get enrolled classes
        const enrollments = await prisma.enrollment.findMany({
          where: {
            studentId: dbUser.studentProfile?.id,
            status: { in: ["PAID", "ACTIVE"] },
          },
          select: { classId: true },
        });

        where.classId = {
          in: enrollments.map((e) => e.classId),
        };

        // Students only see published assignments
        where.status = "PUBLISHED";
      } else if (dbUser.role === "TUTOR") {
        // Get tutor's classes
        const classes = await prisma.class.findMany({
          where: {
            tutorId: dbUser.tutorProfile?.id,
          },
          select: { id: true },
        });

        where.classId = {
          in: classes.map((c) => c.id),
        };
      }
      // Admin can see all assignments (no filter)
    }

    // Apply status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Calculate pagination
    const skip = (filters.page - 1) * filters.limit;

    // Get assignments with pagination
    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        include: {
          class: {
            select: {
              id: true,
              name: true,
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
        orderBy: { dueDate: "asc" },
        skip,
        take: filters.limit,
      }),
      prisma.assignment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: assignments,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    });
  } catch (error) {
    console.error("GET /api/assignments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/assignments
 * Create new assignment (Tutor/Admin only)
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

    // Only tutors and admins can create assignments
    if (dbUser.role !== "TUTOR" && dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only tutors and admins can create assignments" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validatedData = createAssignmentSchema.parse(body);

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
        { error: "You can only add assignments to your own classes" },
        { status: 403 }
      );
    }

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        classId: validatedData.classId,
        title: validatedData.title,
        instructions: validatedData.instructions,
        dueDate: new Date(validatedData.dueDate),
        maxPoints: validatedData.maxPoints,
        attachmentUrl: validatedData.attachmentUrl,
        status: validatedData.status,
      },
      include: {
        class: {
          select: {
            name: true,
          },
        },
      },
    });

    // If published, create notifications for enrolled students
    if (assignment.status === "PUBLISHED") {
      const enrolledStudents = await prisma.enrollment.findMany({
        where: {
          classId: validatedData.classId,
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

      // Create notifications
      await prisma.notification.createMany({
        data: enrolledStudents.map((enrollment) => ({
          userId: enrollment.student.user.id,
          title: "New Assignment",
          message: `New assignment "${assignment.title}" has been posted in ${assignment.class.name}`,
          type: "ASSIGNMENT",
        })),
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: assignment,
        message: "Assignment created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/assignments error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}
