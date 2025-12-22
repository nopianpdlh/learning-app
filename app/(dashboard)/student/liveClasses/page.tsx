/**
 * Student Live Classes Page - Server Component
 * Fetches scheduled meetings data from database and passes to client component
 * Uses section-based enrollments with ScheduledMeeting model
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import LiveClassesClient from "./LiveClassesClient";

export default async function StudentLiveClassesPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get student profile with section enrollments
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    include: {
      enrollments: {
        where: {
          status: { in: ["ACTIVE", "EXPIRED"] },
        },
        select: {
          id: true,
          sectionId: true,
        },
      },
    },
  });

  if (!studentProfile) {
    redirect("/login");
  }

  // Collect section IDs and enrollment IDs
  const enrolledSectionIds = studentProfile.enrollments.map((e) => e.sectionId);
  const enrollmentIds = studentProfile.enrollments.map((e) => e.id);

  // Handle no enrollments
  if (enrolledSectionIds.length === 0) {
    return (
      <LiveClassesClient
        initialLiveClasses={[]}
        initialStats={{ upcoming: 0, completed: 0, attended: 0, totalHours: 0 }}
      />
    );
  }

  // Fetch scheduled meetings from sections (using ScheduledMeeting model that admin creates)
  const scheduledMeetings = await prisma.scheduledMeeting.findMany({
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
          enrollmentId: { in: enrollmentIds },
        },
        select: {
          id: true,
          status: true,
        },
      },
      _count: {
        select: {
          attendance: true,
        },
      },
    },
    orderBy: { scheduledAt: "desc" },
  });

  // Process scheduled meetings
  const now = new Date();
  const processedLiveClasses = scheduledMeetings.map((meeting) => {
    const scheduledAt = new Date(meeting.scheduledAt);
    const endTime = new Date(
      scheduledAt.getTime() + meeting.duration * 60 * 1000
    );

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
      meetingUrl: meeting.meetingUrl || "",
      scheduledAt: meeting.scheduledAt.toISOString(),
      duration: meeting.duration,
      maxParticipants: null as number | null,
      recordingUrl: meeting.recordingUrl,
      status: meeting.status,
      effectiveStatus,
      class: {
        id: meeting.section.id,
        name: `${meeting.section.template.name} - Section ${meeting.section.sectionLabel}`,
        subject: meeting.section.template.subject,
      },
      tutor: {
        name: meeting.section.tutor.user.name,
        avatarUrl: meeting.section.tutor.user.avatar,
      },
      participantCount: meeting._count.attendance,
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

  return (
    <LiveClassesClient
      initialLiveClasses={processedLiveClasses}
      initialStats={stats}
    />
  );
}
