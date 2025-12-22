/**
 * Assignments API - List and Create
 * GET /api/assignments - List assignments with filters
 * POST /api/assignments - Create new assignment
 * Updated to use section-based system
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

    // Parse query parameters - support both classId and sectionId
    const { searchParams } = new URL(request.url);
    const sectionId =
      searchParams.get("classId") || searchParams.get("sectionId") || undefined;
    const filters = assignmentFilterSchema.parse({
      classId: sectionId,
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

    // Build query conditions
    const where: any = {};

    // Filter by sectionId if provided
    if (filters.classId) {
      where.sectionId = filters.classId;

      // Check user has access to this section
      if (dbUser.role === "STUDENT") {
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            sectionId: filters.classId,
            studentId: dbUser.studentProfile?.id,
            status: { in: ["ACTIVE", "EXPIRED"] },
          },
        });

        if (!enrollment) {
          return NextResponse.json(
            { error: "Access denied to this section" },
            { status: 403 }
          );
        }
      } else if (dbUser.role === "TUTOR") {
        const sectionData = await prisma.classSection.findFirst({
          where: {
            id: filters.classId,
            tutorId: dbUser.tutorProfile?.id,
          },
        });

        if (!sectionData) {
          return NextResponse.json(
            { error: "Access denied to this section" },
            { status: 403 }
          );
        }
      }
    } else {
      // No sectionId provided, filter by user role
      if (dbUser.role === "STUDENT") {
        // Get enrolled sections
        const enrollments = await prisma.enrollment.findMany({
          where: {
            studentId: dbUser.studentProfile?.id,
            status: { in: ["ACTIVE", "EXPIRED"] },
          },
          select: { sectionId: true },
        });

        where.sectionId = {
          in: enrollments.map((e) => e.sectionId),
        };

        // Students only see published assignments
        where.status = "PUBLISHED";
      } else if (dbUser.role === "TUTOR") {
        // Get tutor's sections
        const sections = await prisma.classSection.findMany({
          where: {
            tutorId: dbUser.tutorProfile?.id,
          },
          select: { id: true },
        });

        where.sectionId = {
          in: sections.map((s) => s.id),
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
          section: {
            select: {
              id: true,
              sectionLabel: true,
              template: {
                select: {
                  name: true,
                  subject: true,
                },
              },
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

    // Transform for client compatibility
    const transformedAssignments = assignments.map((a) => ({
      ...a,
      // Client compatibility
      class: {
        id: a.section.id,
        name: `${a.section.template.name} - Section ${a.section.sectionLabel}`,
        tutor: a.section.tutor,
      },
    }));

    return NextResponse.json({
      success: true,
      data: transformedAssignments,
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

    // Parse request body - support both classId and sectionId
    const body = await request.json();
    const sectionId = body.sectionId || body.classId;
    const validatedData = createAssignmentSchema.parse({
      ...body,
      classId: sectionId,
    });

    // Verify section exists and user has access
    const sectionData = await prisma.classSection.findUnique({
      where: { id: validatedData.classId },
      include: {
        template: true,
      },
    });

    if (!sectionData) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Check if tutor owns the section
    if (
      dbUser.role === "TUTOR" &&
      sectionData.tutorId !== dbUser.tutorProfile?.id
    ) {
      return NextResponse.json(
        { error: "You can only add assignments to your own sections" },
        { status: 403 }
      );
    }

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        sectionId: validatedData.classId,
        title: validatedData.title,
        instructions: validatedData.instructions,
        dueDate: new Date(validatedData.dueDate),
        maxPoints: validatedData.maxPoints,
        attachmentUrl: validatedData.attachmentUrl,
        status: validatedData.status,
      },
      include: {
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
    });

    // If published, create notifications for enrolled students
    if (assignment.status === "PUBLISHED") {
      const enrolledStudents = await prisma.enrollment.findMany({
        where: {
          sectionId: validatedData.classId,
          status: { in: ["ACTIVE"] },
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
      if (enrolledStudents.length > 0) {
        await prisma.notification.createMany({
          data: enrolledStudents.map((enrollment) => ({
            userId: enrollment.student.user.id,
            title: "New Assignment",
            message: `New assignment "${assignment.title}" has been posted in ${assignment.section.template.name}`,
            type: "ASSIGNMENT",
          })),
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...assignment,
          class: {
            name: `${assignment.section.template.name} - Section ${assignment.section.sectionLabel}`,
          },
        },
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
