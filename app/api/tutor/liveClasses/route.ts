import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/tutor/liveClasses
 * Fetch all scheduled live classes for tutor's sections (read-only)
 * Uses section-based system
 */
export async function GET(req: NextRequest) {
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

    // Get user from database with sections
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        tutorProfile: {
          include: {
            sections: {
              select: {
                id: true,
                sectionLabel: true,
                template: { select: { name: true, subject: true } },
                enrollments: {
                  where: { status: { in: ["ACTIVE", "EXPIRED"] } },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!dbUser || dbUser.role !== "TUTOR" || !dbUser.tutorProfile) {
      return NextResponse.json(
        { error: "Forbidden: Tutor only" },
        { status: 403 }
      );
    }

    const sections = dbUser.tutorProfile.sections;

    if (sections.length === 0) {
      return NextResponse.json({
        liveClasses: [],
        stats: {
          total: 0,
          upcoming: 0,
          completed: 0,
          totalEnrollments: 0,
        },
        classes: [],
      });
    }

    const sectionIds = sections.map((s) => s.id);

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status"); // 'all' | 'upcoming' | 'completed'
    const sectionFilter =
      searchParams.get("classId") || searchParams.get("sectionId");

    // Build where clause
    const where: any = {
      sectionId: sectionFilter || { in: sectionIds },
    };

    // Fetch all live classes
    const liveClasses = await db.liveClass.findMany({
      where,
      include: {
        section: {
          select: {
            id: true,
            sectionLabel: true,
            template: { select: { name: true, subject: true } },
            _count: {
              select: {
                enrollments: {
                  where: { status: { in: ["ACTIVE", "EXPIRED"] } },
                },
              },
            },
          },
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
    });

    const now = new Date();

    // Transform and filter by status
    const transformedClasses = liveClasses.map((lc) => {
      const scheduledAt = new Date(lc.scheduledAt);
      const isUpcoming = scheduledAt > now;

      return {
        id: lc.id,
        title: lc.title,
        meetingUrl: lc.meetingUrl,
        scheduledAt: lc.scheduledAt.toISOString(),
        duration: lc.duration,
        classId: lc.sectionId, // For client compatibility
        className: `${lc.section.template.name} - ${lc.section.sectionLabel}`,
        classSubject: lc.section.template.subject,
        enrollmentCount: lc.section._count.enrollments,
        status: isUpcoming ? "upcoming" : "completed",
        createdAt: lc.createdAt.toISOString(),
        updatedAt: lc.updatedAt.toISOString(),
      };
    });

    // Apply status filter
    let filteredClasses = transformedClasses;
    if (statusFilter && statusFilter !== "all") {
      filteredClasses = transformedClasses.filter(
        (lc) => lc.status === statusFilter
      );
    }

    // Calculate statistics
    const stats = {
      total: transformedClasses.length,
      upcoming: transformedClasses.filter((lc) => lc.status === "upcoming")
        .length,
      completed: transformedClasses.filter((lc) => lc.status === "completed")
        .length,
      totalEnrollments: transformedClasses.reduce(
        (sum, lc) => sum + lc.enrollmentCount,
        0
      ),
    };

    // Transform sections to classes for client compatibility
    const classes = sections.map((s) => ({
      id: s.id,
      name: `${s.template.name} - ${s.sectionLabel}`,
      subject: s.template.subject,
    }));

    return NextResponse.json({
      liveClasses: filteredClasses,
      stats,
      classes,
    });
  } catch (error) {
    console.error("GET /api/tutor/liveClasses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch live classes" },
      { status: 500 }
    );
  }
}
