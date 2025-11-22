/**
 * Materials API - List and Create
 * GET /api/materials - List materials with filters
 * POST /api/materials - Create new material
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import {
  createMaterialSchema,
  materialFilterSchema,
} from "@/lib/validations/material.schema";

/**
 * GET /api/materials
 * List materials with optional filters
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
    const filters = materialFilterSchema.parse({
      classId: searchParams.get("classId") || undefined,
      session: searchParams.get("session") || undefined,
      fileType: searchParams.get("fileType") || undefined,
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
      // Admin can see all materials (no filter)
    }

    // Apply other filters
    if (filters.session) {
      where.session = filters.session;
    }

    if (filters.fileType) {
      where.fileType = filters.fileType;
    }

    // Calculate pagination
    const skip = (filters.page - 1) * filters.limit;

    // Get materials with pagination
    const [materials, total] = await Promise.all([
      prisma.material.findMany({
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
        },
        orderBy: [{ session: "asc" }, { createdAt: "desc" }],
        skip,
        take: filters.limit,
      }),
      prisma.material.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: materials,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    });
  } catch (error) {
    console.error("GET /api/materials error:", error);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/materials
 * Create new material (Tutor/Admin only)
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

    // Only tutors and admins can create materials
    if (dbUser.role !== "TUTOR" && dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only tutors and admins can create materials" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validatedData = createMaterialSchema.parse(body);

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
        { error: "You can only add materials to your own classes" },
        { status: 403 }
      );
    }

    // Create material
    const material = await prisma.material.create({
      data: {
        classId: validatedData.classId,
        title: validatedData.title,
        description: validatedData.description,
        session: validatedData.session,
        fileType: validatedData.fileType,
        fileUrl: validatedData.fileUrl,
        videoUrl: validatedData.videoUrl,
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
        message: "Material created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/materials error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create material" },
      { status: 500 }
    );
  }
}
