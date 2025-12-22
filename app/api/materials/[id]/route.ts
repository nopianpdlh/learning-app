/**
 * Materials API - Single Material Operations
 * GET /api/materials/[id] - Get material by ID
 * PUT /api/materials/[id] - Update material
 * DELETE /api/materials/[id] - Delete material
 *
 * Updated to use section-based system (ClassSection instead of Class)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { deleteFile, extractPathFromUrl } from "@/lib/storage";

// Validation schema for update
const updateMaterialSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  session: z.coerce.number().min(1).optional(),
  fileType: z.enum(["PDF", "VIDEO", "DOCUMENT", "IMAGE"]).optional(),
  fileUrl: z.string().url().optional().nullable().or(z.literal("")),
  videoUrl: z.string().url().optional().nullable().or(z.literal("")),
});

/**
 * GET /api/materials/[id]
 * Get single material by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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

    // Get material with section data
    const material = await prisma.material.findUnique({
      where: { id: params.id },
      include: {
        section: {
          select: {
            id: true,
            sectionLabel: true,
            tutorId: true,
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
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Check access permissions
    if (dbUser.role === "STUDENT") {
      // Student must be enrolled in the section
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          sectionId: material.sectionId,
          studentId: dbUser.studentProfile?.id,
          status: { in: ["ACTIVE", "EXPIRED"] },
        },
      });

      if (!enrollment) {
        return NextResponse.json(
          { error: "Access denied to this material" },
          { status: 403 }
        );
      }
    } else if (dbUser.role === "TUTOR") {
      // Tutor must own the section
      if (material.section.tutorId !== dbUser.tutorProfile?.id) {
        return NextResponse.json(
          { error: "Access denied to this material" },
          { status: 403 }
        );
      }
    }
    // Admin can access all materials

    // Increment view count (only for students viewing the material)
    if (dbUser.role === "STUDENT") {
      await prisma.material.update({
        where: { id: params.id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });
    }

    // Transform for client compatibility
    const response = {
      ...material,
      class: {
        id: material.section.id,
        name: `${material.section.template.name} - Section ${material.section.sectionLabel}`,
        tutorId: material.section.tutorId,
        tutor: material.section.tutor,
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("GET /api/materials/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch material" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/materials/[id]
 * Update material (Tutor/Admin only)
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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

    // Only tutors and admins can update materials
    if (dbUser.role !== "TUTOR" && dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only tutors and admins can update materials" },
        { status: 403 }
      );
    }

    // Get existing material
    const existingMaterial = await prisma.material.findUnique({
      where: { id: params.id },
      include: {
        section: true,
      },
    });

    if (!existingMaterial) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Check if tutor owns the section
    if (
      dbUser.role === "TUTOR" &&
      existingMaterial.section.tutorId !== dbUser.tutorProfile?.id
    ) {
      return NextResponse.json(
        { error: "You can only update materials in your own sections" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validatedData = updateMaterialSchema.parse(body);

    // Update material
    const updatedMaterial = await prisma.material.update({
      where: { id: params.id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description,
        }),
        ...(validatedData.session && { session: validatedData.session }),
        ...(validatedData.fileType && { fileType: validatedData.fileType }),
        ...(validatedData.fileUrl !== undefined && {
          fileUrl: validatedData.fileUrl || null,
        }),
        ...(validatedData.videoUrl !== undefined && {
          videoUrl: validatedData.videoUrl || null,
        }),
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

    return NextResponse.json({
      success: true,
      data: {
        ...updatedMaterial,
        class: {
          name: `${updatedMaterial.section.template.name} - Section ${updatedMaterial.section.sectionLabel}`,
        },
      },
      message: "Material updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/materials/[id] error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update material" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/materials/[id]
 * Delete material (Tutor/Admin only)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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

    // Only tutors and admins can delete materials
    if (dbUser.role !== "TUTOR" && dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only tutors and admins can delete materials" },
        { status: 403 }
      );
    }

    // Get existing material
    const existingMaterial = await prisma.material.findUnique({
      where: { id: params.id },
      include: {
        section: true,
      },
    });

    if (!existingMaterial) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Check if tutor owns the section
    if (
      dbUser.role === "TUTOR" &&
      existingMaterial.section.tutorId !== dbUser.tutorProfile?.id
    ) {
      return NextResponse.json(
        { error: "You can only delete materials from your own sections" },
        { status: 403 }
      );
    }

    // Delete file from storage if it exists
    if (existingMaterial.fileUrl) {
      const filePath = extractPathFromUrl(existingMaterial.fileUrl);
      if (filePath) {
        await deleteFile("materials", filePath);
      }
    }

    // Delete material from database
    await prisma.material.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Material deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/materials/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete material" },
      { status: 500 }
    );
  }
}
