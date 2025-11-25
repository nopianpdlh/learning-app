import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/tutor/liveClasses
 * Fetch all scheduled live classes for tutor's classes (read-only)
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

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        tutorProfile: true,
      },
    });

    if (!dbUser || dbUser.role !== "TUTOR" || !dbUser.tutorProfile) {
      return NextResponse.json(
        { error: "Forbidden: Tutor only" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status"); // 'all' | 'upcoming' | 'completed'
    const classFilter = searchParams.get("classId");

    // Get all classes owned by tutor
    const tutorClasses = await db.class.findMany({
      where: { tutorId: dbUser.tutorProfile.id },
      select: {
        id: true,
        name: true,
        subject: true,
      },
    });

    if (tutorClasses.length === 0) {
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

    const classIds = tutorClasses.map((c) => c.id);

    // Build where clause
    const where: any = {
      classId: classFilter || { in: classIds },
    };

    // Fetch all live classes
    const liveClasses = await db.liveClass.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            _count: {
              select: {
                enrollments: {
                  where: {
                    status: { in: ["PAID", "ACTIVE"] },
                  },
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
        classId: lc.classId,
        className: lc.class.name,
        classSubject: lc.class.subject,
        enrollmentCount: lc.class._count.enrollments,
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

    return NextResponse.json({
      liveClasses: filteredClasses,
      stats,
      classes: tutorClasses,
    });
  } catch (error) {
    console.error("GET /api/tutor/liveClasses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch live classes" },
      { status: 500 }
    );
  }
}
