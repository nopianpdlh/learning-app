import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/tutor/liveClasses
 * Fetch all scheduled meetings for tutor's sections (read-only)
 * Uses ScheduledMeeting model for admin-created meetings
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
      status: { not: "CANCELLED" },
    };

    // Fetch all scheduled meetings (using ScheduledMeeting model that admin creates)
    const scheduledMeetings = await db.scheduledMeeting.findMany({
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
    const transformedClasses = scheduledMeetings.map((meeting) => {
      const scheduledAt = new Date(meeting.scheduledAt);
      const endTime = new Date(
        scheduledAt.getTime() + meeting.duration * 60 * 1000
      );

      let status: "upcoming" | "completed" | "live";
      if (now < scheduledAt) {
        status = "upcoming";
      } else if (now >= scheduledAt && now <= endTime) {
        status = "upcoming"; // Still show as upcoming if currently live
      } else {
        status = "completed";
      }

      return {
        id: meeting.id,
        title: meeting.title,
        meetingUrl: meeting.meetingUrl || "",
        scheduledAt: meeting.scheduledAt.toISOString(),
        duration: meeting.duration,
        classId: meeting.sectionId, // For client compatibility
        className: `${meeting.section.template.name} - ${meeting.section.sectionLabel}`,
        classSubject: meeting.section.template.subject,
        enrollmentCount: meeting.section._count.enrollments,
        status,
        createdAt: meeting.createdAt.toISOString(),
        updatedAt: meeting.updatedAt.toISOString(),
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
      totalEnrollments: sections.reduce(
        (sum, s) => sum + s.enrollments.length,
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
