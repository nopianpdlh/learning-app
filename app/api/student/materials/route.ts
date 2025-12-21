/**
 * Student Materials API
 * GET /api/student/materials - List all materials from enrolled classes
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
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

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all";
    const classId = searchParams.get("classId") || null;
    const bookmarked = searchParams.get("bookmarked") === "true";

    // Get enrolled class IDs
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: studentProfile.id,
        status: { in: ["PAID", "ACTIVE", "COMPLETED"] },
      },
      select: { classId: true },
    });

    const enrolledClassIds = enrollments.map((e) => e.classId);

    if (enrolledClassIds.length === 0) {
      return NextResponse.json({
        materials: [],
        stats: {
          total: 0,
          byType: {},
          byClass: {},
        },
      });
    }

    // Build where clause
    const where: any = {
      classId: { in: enrolledClassIds },
    };

    // Filter by specific class if provided
    if (classId) {
      where.classId = classId;
    }

    // Filter by type
    if (type !== "all") {
      where.fileType = type.toUpperCase();
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch materials with class info and bookmark status
    const materials = await prisma.material.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
        bookmarks: {
          where: { studentId: studentProfile.id },
          select: { id: true },
        },
      },
      orderBy: [{ session: "asc" }, { createdAt: "desc" }],
    });

    // Filter by bookmarked if requested
    let filteredMaterials = materials;
    if (bookmarked) {
      filteredMaterials = materials.filter((m) => m.bookmarks.length > 0);
    }

    // Calculate stats
    const stats = {
      total: filteredMaterials.length,
      byType: {} as Record<string, number>,
      byClass: {} as Record<string, number>,
    };

    filteredMaterials.forEach((material) => {
      // Count by type
      stats.byType[material.fileType] =
        (stats.byType[material.fileType] || 0) + 1;

      // Count by class
      stats.byClass[material.class.name] =
        (stats.byClass[material.class.name] || 0) + 1;
    });

    // Format response
    const formattedMaterials = filteredMaterials.map((material) => ({
      id: material.id,
      title: material.title,
      description: material.description,
      session: material.session,
      fileType: material.fileType,
      fileUrl: material.fileUrl,
      videoUrl: material.videoUrl,
      thumbnail: material.thumbnail,
      viewCount: material.viewCount,
      downloadCount: material.downloadCount,
      createdAt: material.createdAt,
      updatedAt: material.updatedAt,
      class: material.class,
      bookmarked: material.bookmarks.length > 0,
    }));

    return NextResponse.json({
      materials: formattedMaterials,
      stats,
    });
  } catch (error: any) {
    console.error("Get student materials error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
