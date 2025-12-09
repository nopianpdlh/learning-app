/**
 * Material Download Tracking API
 * POST /api/student/materials/[id]/download - Track and provide download URL
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

    // Get material with access check
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

    // Increment download count
    const updated = await prisma.material.update({
      where: { id: materialId },
      data: {
        downloadCount: { increment: 1 },
      },
      select: {
        downloadCount: true,
        fileUrl: true,
        videoUrl: true,
        title: true,
      },
    });

    // Determine download URL (prefer fileUrl over videoUrl)
    const downloadUrl = updated.fileUrl || updated.videoUrl || "";

    if (!downloadUrl) {
      return NextResponse.json(
        { error: "No downloadable file available" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      downloadUrl,
      downloadCount: updated.downloadCount,
      filename: updated.title,
    });
  } catch (error: any) {
    console.error("Track download error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
