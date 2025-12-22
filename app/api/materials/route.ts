/**
 * Materials API - List and Create
 * GET /api/materials - List materials with filters
 * POST /api/materials - Create new material
 *
 * Updated to use section-based system (ClassSection instead of Class)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { getVideoThumbnail, extractVideoId } from "@/lib/video-thumbnail";

// Validation schemas
const materialFilterSchema = z.object({
  sectionId: z.string().optional(),
  session: z.coerce.number().optional(),
  fileType: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const createMaterialSchema = z.object({
  sectionId: z.string().min(1, "Section ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  session: z.coerce.number().min(1, "Session must be at least 1"),
  fileType: z.enum(["PDF", "VIDEO", "DOCUMENT", "IMAGE"]),
  fileUrl: z.string().url().optional().nullable().or(z.literal("")),
  videoUrl: z.string().url().optional().nullable().or(z.literal("")),
});

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
      sectionId:
        searchParams.get("sectionId") ||
        searchParams.get("classId") ||
        undefined,
      session: searchParams.get("session") || undefined,
      fileType: searchParams.get("fileType") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

    // Build query conditions
    const where: any = {};

    // Filter by sectionId if provided
    if (filters.sectionId) {
      where.sectionId = filters.sectionId;

      // Check user has access to this section
      if (dbUser.role === "STUDENT") {
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            sectionId: filters.sectionId,
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
            id: filters.sectionId,
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
        },
        orderBy: [{ session: "asc" }, { createdAt: "desc" }],
        skip,
        take: filters.limit,
      }),
      prisma.material.count({ where }),
    ]);

    // Transform for client compatibility
    const transformedMaterials = materials.map((m) => ({
      ...m,
      class: {
        id: m.section.id,
        name: `${m.section.template.name} - Section ${m.section.sectionLabel}`,
        tutor: m.section.tutor,
      },
    }));

    return NextResponse.json({
      success: true,
      data: transformedMaterials,
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

    // Support both sectionId and classId for backward compatibility
    const dataToValidate = {
      ...body,
      sectionId: body.sectionId || body.classId,
    };

    const validatedData = createMaterialSchema.parse(dataToValidate);

    // Verify section exists and user has access
    const sectionData = await prisma.classSection.findUnique({
      where: { id: validatedData.sectionId },
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
        { error: "You can only add materials to your own sections" },
        { status: 403 }
      );
    }

    // Auto-extract thumbnail from video URL if not provided
    let thumbnail: string | null = null;
    if (validatedData.fileType === "VIDEO" && validatedData.videoUrl) {
      thumbnail = getVideoThumbnail(validatedData.videoUrl);
    }

    // Create material
    const material = await prisma.material.create({
      data: {
        sectionId: validatedData.sectionId,
        title: validatedData.title,
        description: validatedData.description || null,
        session: validatedData.session,
        fileType: validatedData.fileType,
        fileUrl: validatedData.fileUrl || null,
        videoUrl: validatedData.videoUrl || null,
        thumbnail: thumbnail,
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

    return NextResponse.json(
      {
        success: true,
        data: {
          ...material,
          class: {
            name: `${material.section.template.name} - Section ${material.section.sectionLabel}`,
          },
        },
        message: "Material created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/materials error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create material" },
      { status: 500 }
    );
  }
}
