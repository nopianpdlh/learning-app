/**
 * Student Live Classes Page - Server Component
 * Fetches live classes data from database and passes to client component
 * Uses section-based enrollments only
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
        select: { sectionId: true },
      },
    },
  });

  if (!studentProfile) {
    redirect("/login");
  }

  // Collect section IDs
  const enrolledSectionIds = studentProfile.enrollments.map((e) => e.sectionId);

  // Handle no enrollments
  if (enrolledSectionIds.length === 0) {
    return (
      <LiveClassesClient
        initialLiveClasses={[]}
        initialStats={{ upcoming: 0, completed: 0, attended: 0, totalHours: 0 }}
      />
    );
  }

  // Fetch live classes from sections
  const liveClasses = await prisma.liveClass.findMany({
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
      attendances: {
        where: {
          studentId: studentProfile.id,
        },
        select: {
          id: true,
          joinedAt: true,
        },
      },
      _count: {
        select: {
          attendances: true,
        },
      },
    },
    orderBy: { scheduledAt: "desc" },
  });

  // Process live classes
  const now = new Date();
  const processedLiveClasses = liveClasses.map((lc) => {
    const scheduledAt = new Date(lc.scheduledAt);
    const endTime = new Date(scheduledAt.getTime() + lc.duration * 60 * 1000);

    let effectiveStatus: string;
    if (lc.status === "CANCELLED") {
      effectiveStatus = "CANCELLED";
    } else if (now < scheduledAt) {
      effectiveStatus = "UPCOMING";
    } else if (now >= scheduledAt && now <= endTime) {
      effectiveStatus = "LIVE";
    } else {
      effectiveStatus = "COMPLETED";
    }

    const attended = lc.attendances.length > 0;

    return {
      id: lc.id,
      title: lc.title,
      description: lc.description,
      meetingUrl: lc.meetingUrl,
      scheduledAt: lc.scheduledAt.toISOString(),
      duration: lc.duration,
      maxParticipants: lc.maxParticipants,
      recordingUrl: lc.recordingUrl,
      status: lc.status,
      effectiveStatus,
      class: {
        id: lc.section.id,
        name: `${lc.section.template.name} - Section ${lc.section.sectionLabel}`,
        subject: lc.section.template.subject,
      },
      tutor: {
        name: lc.section.tutor.user.name,
        avatarUrl: lc.section.tutor.user.avatar,
      },
      participantCount: lc._count.attendances,
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
