import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import TutorDashboardClient from "@/components/features/tutor/TutorDashboardClient";
import { Alert } from "@/components/ui/alert-banner";

// Get urgent alerts for tutor dashboard
async function getTutorAlerts(tutorProfileId: string): Promise<Alert[]> {
  const now = new Date();
  const alerts: Alert[] = [];

  // Get sections for this tutor
  const sections = await prisma.classSection.findMany({
    where: { tutorId: tutorProfileId, status: "ACTIVE" },
    select: { id: true },
  });
  const sectionIds = sections.map((s) => s.id);

  if (sectionIds.length === 0) return alerts;

  // Check for unanswered forum threads
  const unansweredForums = await prisma.forumThread.count({
    where: {
      sectionId: { in: sectionIds },
      posts: {
        none: {
          author: {
            role: "TUTOR",
          },
        },
      },
    },
  });

  if (unansweredForums > 0) {
    alerts.push({
      id: "unanswered-forums",
      type: "warning",
      message: `${unansweredForums} pertanyaan siswa belum dijawab di forum.`,
      link: "/tutor/forum",
      linkText: "Jawab",
    });
  }

  // Check for pending grading (submitted assignments)
  const pendingGrading = await prisma.assignmentSubmission.count({
    where: {
      assignment: { sectionId: { in: sectionIds } },
      status: "SUBMITTED",
    },
  });

  if (pendingGrading > 0) {
    alerts.push({
      id: "pending-grading",
      type: "warning",
      message: `${pendingGrading} tugas siswa menunggu penilaian.`,
      link: "/tutor/assignments",
      linkText: "Nilai",
    });
  }

  // Check for upcoming meetings (within 3 hours)
  const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const upcomingMeeting = await prisma.scheduledMeeting.findFirst({
    where: {
      sectionId: { in: sectionIds },
      scheduledAt: { gte: now, lte: threeHoursFromNow },
      status: "SCHEDULED",
    },
    include: { section: { include: { template: true } } },
  });

  if (upcomingMeeting) {
    const scheduledAt = new Date(upcomingMeeting.scheduledAt);
    const diffMins = Math.floor(
      (scheduledAt.getTime() - now.getTime()) / 60000
    );
    const timeText =
      diffMins < 60
        ? `${diffMins} menit`
        : `${Math.floor(diffMins / 60)} jam ${diffMins % 60} menit`;

    alerts.push({
      id: `upcoming-meeting-${upcomingMeeting.id}`,
      type: "info",
      message: `Live class "${upcomingMeeting.title}" dimulai dalam ${timeText}!`,
      link: upcomingMeeting.meetingUrl || "/tutor/liveClasses",
      linkText: "Join",
    });
  }

  return alerts;
}

export default async function TutorDashboardPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user from database
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      tutorProfile: true,
    },
  });

  if (!dbUser || dbUser.role !== "TUTOR" || !dbUser.tutorProfile) {
    redirect("/");
  }

  // Get alerts
  const alerts = await getTutorAlerts(dbUser.tutorProfile.id);

  return <TutorDashboardClient alerts={alerts} />;
}
