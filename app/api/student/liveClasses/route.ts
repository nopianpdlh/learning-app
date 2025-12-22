/**
 * Student Live Classes API
 * GET /api/student/liveClasses - Fetch scheduled meetings from enrolled sections
 * Updated to use ScheduledMeeting model (section-based)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      include: {
        enrollments: {
          where: {
            status: { in: ["ACTIVE", "EXPIRED"] },
          },
          select: { sectionId: true },
        },
      },
    });

    if (!studentProfile) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    const enrolledSectionIds = studentProfile.enrollments.map(
      (e) => e.sectionId
    );

    if (enrolledSectionIds.length === 0) {
      return NextResponse.json({
        liveClasses: [],
        stats: { upcoming: 0, completed: 0, attended: 0, totalHours: 0 },
      });
    }

    // Fetch scheduled meetings from enrolled sections
    const meetings = await prisma.scheduledMeeting.findMany({
      where: {
        sectionId: { in: enrolledSectionIds },
      },
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
            tutor: {
              include: {
                user: {
                  select: {
                    name: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        attendance: {
          where: {
            enrollment: {
              studentId: studentProfile.id,
            },
          },
          select: {
            id: true,
            status: true,
            joinedAt: true,
          },
        },
      },
      orderBy: { scheduledAt: "desc" },
    });

    // Process live classes
    const now = new Date();
    const processedLiveClasses = meetings.map((meeting) => {
      const scheduledAt = new Date(meeting.scheduledAt);
      const endTime = new Date(
        scheduledAt.getTime() + meeting.duration * 60 * 1000
      );

      // Determine effective status
      let effectiveStatus: string;
      if (meeting.status === "CANCELLED") {
        effectiveStatus = "CANCELLED";
      } else if (now < scheduledAt) {
        effectiveStatus = "UPCOMING";
      } else if (now >= scheduledAt && now <= endTime) {
        effectiveStatus = "LIVE";
      } else {
        effectiveStatus = "COMPLETED";
      }

      const attended = meeting.attendance.some((a) => a.status === "PRESENT");

      return {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        meetingUrl: meeting.meetingUrl,
        scheduledAt: meeting.scheduledAt.toISOString(),
        duration: meeting.duration,
        recordingUrl: meeting.recordingUrl,
        status: meeting.status,
        effectiveStatus,
        createdAt: meeting.createdAt.toISOString(),
        // Client compatibility
        class: {
          id: meeting.section.id,
          name: `${meeting.section.template.name} - Section ${meeting.section.sectionLabel}`,
          subject: meeting.section.template.subject,
        },
        tutor: {
          name: meeting.section.tutor.user.name,
          avatarUrl: meeting.section.tutor.user.avatar,
        },
        participantCount: meeting.attendance.length,
        attended,
      };
    });

    // Calculate stats
    const upcomingClasses = processedLiveClasses.filter(
      (lc) => lc.effectiveStatus === "UPCOMING" || lc.effectiveStatus === "LIVE"
    );
    const completedClasses = processedLiveClasses.filter(
      (lc) => lc.effectiveStatus === "COMPLETED"
    );
    const attendedClasses = completedClasses.filter((lc) => lc.attended);
    const totalMinutes = completedClasses.reduce(
      (sum, lc) => sum + lc.duration,
      0
    );

    const stats = {
      upcoming: upcomingClasses.length,
      completed: completedClasses.length,
      attended: attendedClasses.length,
      totalHours: Math.round(totalMinutes / 60),
    };

    return NextResponse.json({
      liveClasses: processedLiveClasses,
      stats,
    });
  } catch (error) {
    console.error("GET /api/student/liveClasses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch live classes" },
      { status: 500 }
    );
  }
}
