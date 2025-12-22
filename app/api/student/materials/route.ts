/**
 * Student Materials API
 * GET /api/student/materials - List all materials from enrolled sections
 * Updated to use section-based system
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
    const sectionId =
      searchParams.get("classId") || searchParams.get("sectionId") || null;
    const bookmarked = searchParams.get("bookmarked") === "true";

    // Get enrolled section IDs
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: studentProfile.id,
        status: { in: ["ACTIVE", "EXPIRED"] },
      },
      select: { sectionId: true },
    });

    const enrolledSectionIds = enrollments.map((e) => e.sectionId);

    if (enrolledSectionIds.length === 0) {
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
      sectionId: { in: enrolledSectionIds },
    };

    // Filter by specific section if provided
    if (sectionId) {
      where.sectionId = sectionId;
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

    // Fetch materials with section info and bookmark status
    const materials = await prisma.material.findMany({
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

      // Count by class (using template name)
      const className = material.section.template.name;
      stats.byClass[className] = (stats.byClass[className] || 0) + 1;
    });

    // Format response with client compatibility
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
      // Client compatibility - provide class object
      class: {
        id: material.section.id,
        name: `${material.section.template.name} - Section ${material.section.sectionLabel}`,
        subject: material.section.template.subject,
      },
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
