/**
 * Materials Download API
 * POST /api/materials/[id]/download - Track material download count
 * Note: Signed URL generation is now handled client-side
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/materials/[id]/download
 * Increment download count (students only)
 */
export async function POST(
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

    // Get material
    const material = await prisma.material.findUnique({
      where: { id: params.id },
      include: {
        class: {
          select: {
            id: true,
            tutorId: true,
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

    // Check if material has a file URL
    if (!material.fileUrl) {
      return NextResponse.json(
        { error: "This material has no downloadable file" },
        { status: 400 }
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

    // Increment download count (only for students)
    if (dbUser.role === "STUDENT") {
      await prisma.material.update({
        where: { id: params.id },
        data: {
          downloadCount: {
            increment: 1,
          },
        },
      });
    }

    // Return success (signed URL is generated client-side)
    return NextResponse.json({
      success: true,
      message: "Download tracked successfully",
    });
  } catch (error) {
    console.error("POST /api/materials/[id]/download error:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
