/**
 * Material Bookmark API
 * POST /api/student/materials/[id]/bookmark - Toggle bookmark
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: materialId } = await params;

  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!studentProfile) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Check if material exists and student has access
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        class: {
          include: {
            enrollments: {
              where: {
                studentId: studentProfile.id,
                status: { in: ["PAID", "ACTIVE", "COMPLETED"] },
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

    if (material.class.enrollments.length === 0) {
      return NextResponse.json(
        { error: "You are not enrolled in this class" },
        { status: 403 }
      );
    }

    // Check existing bookmark
    const existingBookmark = await prisma.materialBookmark.findUnique({
      where: {
        studentId_materialId: {
          studentId: studentProfile.id,
          materialId,
        },
      },
    });

    let bookmarked: boolean;

    if (existingBookmark) {
      // Remove bookmark
      await prisma.materialBookmark.delete({
        where: { id: existingBookmark.id },
      });
      bookmarked = false;
    } else {
      // Add bookmark
      await prisma.materialBookmark.create({
        data: {
          studentId: studentProfile.id,
          materialId,
        },
      });
      bookmarked = true;
    }

    return NextResponse.json({
      success: true,
      bookmarked,
    });
  } catch (error: any) {
    console.error("Toggle bookmark error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
