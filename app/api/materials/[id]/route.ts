/**
 * Materials API - Single Material Operations
 * GET /api/materials/[id] - Get material by ID
 * PUT /api/materials/[id] - Update material
 * DELETE /api/materials/[id] - Delete material
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { updateMaterialSchema } from "@/lib/validations/material.schema";
import { deleteFile, extractPathFromUrl } from "@/lib/storage";

/**
 * GET /api/materials/[id]
 * Get single material by ID
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

    // Get material
    const material = await prisma.material.findUnique({
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
      // Student must be enrolled in the class
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          classId: material.classId,
          studentId: dbUser.studentProfile?.id,
          status: { in: ["PAID", "ACTIVE"] },
        },
      });

      if (!enrollment) {
        return NextResponse.json(
          { error: "Access denied to this material" },
          { status: 403 }
        );
      }
    } else if (dbUser.role === "TUTOR") {
      // Tutor must own the class
      if (material.class.tutorId !== dbUser.tutorProfile?.id) {
        return NextResponse.json(
          { error: "Access denied to this material" },
          { status: 403 }
        );
      }
    }
    // Admin can access all materials

    return NextResponse.json({
      success: true,
      data: material,
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
        class: true,
      },
    });

    if (!existingMaterial) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Check if tutor owns the class
    if (
      dbUser.role === "TUTOR" &&
      existingMaterial.class.tutorId !== dbUser.tutorProfile?.id
    ) {
      return NextResponse.json(
        { error: "You can only update materials in your own classes" },
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
          fileUrl: validatedData.fileUrl,
        }),
        ...(validatedData.videoUrl !== undefined && {
          videoUrl: validatedData.videoUrl,
        }),
      },
      include: {
        class: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedMaterial,
      message: "Material updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/materials/[id] error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
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
        class: true,
      },
    });

    if (!existingMaterial) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Check if tutor owns the class
    if (
      dbUser.role === "TUTOR" &&
      existingMaterial.class.tutorId !== dbUser.tutorProfile?.id
    ) {
      return NextResponse.json(
        { error: "You can only delete materials from your own classes" },
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
