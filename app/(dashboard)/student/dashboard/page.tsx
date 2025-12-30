/**
 * Student Dashboard Page - Server Component
 * Fetches dashboard data and passes to client component
 * Uses section-based enrollments only
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import DashboardClient from "./DashboardClient";
import { Alert } from "@/components/ui/alert-banner";

// Get urgent alerts for student dashboard
async function getStudentAlerts(
  studentProfileId: string,
  sectionIds: string[]
): Promise<Alert[]> {
  const now = new Date();
  const alerts: Alert[] = [];

  // Check for unpaid enrollments
  const unpaidEnrollments = await prisma.enrollment.count({
    where: {
      studentId: studentProfileId,
      status: "PENDING",
    },
  });

  if (unpaidEnrollments > 0) {
    alerts.push({
      id: "unpaid-enrollment",
      type: "critical",
      message: `Kamu memiliki ${unpaidEnrollments} kelas yang belum dibayar.`,
      link: "/student/sections",
      linkText: "Bayar Sekarang",
    });
  }

  // Check for assignments due in 24 hours
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const urgentAssignments = await prisma.assignment.count({
    where: {
      sectionId: { in: sectionIds },
      dueDate: { gte: now, lte: tomorrow },
      status: "PUBLISHED",
    },
  });

  if (urgentAssignments > 0) {
    alerts.push({
      id: "urgent-assignments",
      type: "warning",
      message: `${urgentAssignments} tugas harus dikerjakan dalam 24 jam!`,
      link: "/student/assignments",
      linkText: "Lihat Tugas",
    });
  }

  // Check for expiring enrollments (within 7 days)
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expiringEnrollments = await prisma.enrollment.count({
    where: {
      studentId: studentProfileId,
      status: "ACTIVE",
      expiryDate: { gte: now, lte: weekFromNow },
    },
  });

  if (expiringEnrollments > 0) {
    alerts.push({
      id: "expiring-enrollment",
      type: "warning",
      message: `${expiringEnrollments} kelas akan berakhir dalam 7 hari.`,
      link: "/student/sections",
      linkText: "Perpanjang",
    });
  }

  // Check for upcoming live class (within 3 hours)
  const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const upcomingLiveClass = await prisma.scheduledMeeting.findFirst({
    where: {
      sectionId: { in: sectionIds },
      scheduledAt: { gte: now, lte: threeHoursFromNow },
      status: "SCHEDULED",
    },
    include: {
      section: { include: { template: true } },
    },
  });

  if (upcomingLiveClass) {
    const scheduledAt = new Date(upcomingLiveClass.scheduledAt);
    const diffMins = Math.floor(
      (scheduledAt.getTime() - now.getTime()) / 60000
    );
    const timeText =
      diffMins < 60
        ? `${diffMins} menit`
        : `${Math.floor(diffMins / 60)} jam ${diffMins % 60} menit`;

    alerts.push({
      id: `upcoming-liveclass-${upcomingLiveClass.id}`,
      type: "info",
      message: `Live class "${upcomingLiveClass.title}" dimulai dalam ${timeText}!`,
      link: upcomingLiveClass.meetingUrl || "/student/sections",
      linkText: "Join",
    });
  }

  // Check for new materials (added in last 24 hours)
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const newMaterials = await prisma.material.count({
    where: {
      sectionId: { in: sectionIds },
      createdAt: { gte: yesterday },
    },
  });

  if (newMaterials > 0) {
    alerts.push({
      id: "new-materials",
      type: "info",
      message: `Ada ${newMaterials} materi baru ditambahkan!`,
      link: "/student/materials",
      linkText: "Lihat Materi",
    });
  }

  return alerts;
}

export default async function StudentDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get student profile and user data in parallel
  const [studentProfile, userData] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId: user.id },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true },
    }),
  ]);

  if (!studentProfile) {
    redirect("/login");
  }

  // Get enrolled sections
  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: studentProfile.id,
      status: { in: ["ACTIVE", "EXPIRED"] },
    },
    include: {
      section: {
        include: {
          template: {
            select: {
              name: true,
              subject: true,
              thumbnail: true,
              classType: true,
            },
          },
          tutor: {
            include: { user: { select: { name: true } } },
          },
          materials: { select: { id: true } },
          assignments: { select: { id: true } },
          quizzes: { select: { id: true } },
        },
      },
    },
  });

  const sectionIds = enrollments.map((e) => e.sectionId);
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Run all independent queries in parallel
  const [
    submittedAssignments,
    completedQuizzes,
    allAssignments,
    recentQuizAttempts,
    upcomingMeetings,
    gradedSubmissions,
    weeklySubmissions,
    weeklyQuizzes,
    alerts,
  ] = await Promise.all([
    // Progress tracking
    prisma.assignmentSubmission.findMany({
      where: {
        studentId: studentProfile.id,
        assignment: { sectionId: { in: sectionIds } },
      },
      select: {
        assignmentId: true,
        assignment: { select: { sectionId: true } },
      },
    }),
    prisma.quizAttempt.findMany({
      where: {
        studentId: studentProfile.id,
        submittedAt: { not: null },
        quiz: { sectionId: { in: sectionIds } },
      },
      select: { quizId: true, quiz: { select: { sectionId: true } } },
    }),
    // Pending assignments
    prisma.assignment.findMany({
      where: {
        sectionId: { in: sectionIds },
        dueDate: { gte: now },
        status: "PUBLISHED",
      },
      include: {
        section: {
          select: {
            sectionLabel: true,
            template: { select: { name: true } },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    }),
    // Recent quiz scores
    prisma.quizAttempt.findMany({
      where: {
        studentId: studentProfile.id,
        submittedAt: { not: null },
        score: { not: null },
      },
      include: {
        quiz: {
          include: {
            section: {
              select: {
                sectionLabel: true,
                template: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
    // Upcoming meetings
    prisma.scheduledMeeting.findMany({
      where: {
        sectionId: { in: sectionIds },
        scheduledAt: { gte: now },
        status: { not: "CANCELLED" },
      },
      include: {
        section: {
          include: { tutor: { include: { user: { select: { name: true } } } } },
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
    // Graded submissions for average score
    prisma.assignmentSubmission.findMany({
      where: {
        studentId: studentProfile.id,
        status: "GRADED",
        score: { not: null },
      },
      include: { assignment: { select: { maxPoints: true } } },
    }),
    // Weekly progress
    prisma.assignmentSubmission.count({
      where: { studentId: studentProfile.id, submittedAt: { gte: weekAgo } },
    }),
    prisma.quizAttempt.count({
      where: {
        studentId: studentProfile.id,
        submittedAt: { gte: weekAgo, not: null },
      },
    }),
    // Alerts
    getStudentAlerts(studentProfile.id, sectionIds),
  ]);

  // Process myClasses
  const myClasses = enrollments.slice(0, 4).map((enrollment) => {
    const section = enrollment.section;
    const totalItems = section.assignments.length + section.quizzes.length;

    const completedAssigns = submittedAssignments.filter(
      (s) => s.assignment.sectionId === section.id
    ).length;
    const completedQuiz = completedQuizzes.filter(
      (q) => q.quiz.sectionId === section.id
    ).length;

    const completedItems = completedAssigns + completedQuiz;
    const progress =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      id: section.id,
      name: `${section.template.name} - Section ${section.sectionLabel}`,
      subject: section.template.subject,
      tutorName: section.tutor.user.name,
      progress,
      thumbnail: section.template.thumbnail,
    };
  });

  // Process pending assignments
  const submittedIds = new Set(submittedAssignments.map((s) => s.assignmentId));
  const pendingAssignments = allAssignments
    .filter((a) => !submittedIds.has(a.id))
    .slice(0, 5)
    .map((a) => {
      const due = new Date(a.dueDate);
      const diffDays = Math.ceil(
        (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: a.id,
        title: a.title,
        className: `${a.section.template.name} - ${a.section.sectionLabel}`,
        dueDate:
          diffDays === 0
            ? "Hari ini"
            : diffDays === 1
            ? "1 hari lagi"
            : `${diffDays} hari lagi`,
        urgent: diffDays <= 1,
      };
    });

  // Process recent quizzes
  const recentQuizzes = recentQuizAttempts.map((attempt) => ({
    id: attempt.quiz.id,
    title: attempt.quiz.title,
    className: `${attempt.quiz.section.template.name} - ${attempt.quiz.section.sectionLabel}`,
    score: attempt.score!,
    maxScore: 100,
  }));

  // Process upcoming events
  const dayNames = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];

  const upcomingEvents = upcomingMeetings.map((meeting) => {
    const scheduledDate = new Date(meeting.scheduledAt);
    const dayName = dayNames[scheduledDate.getDay()];
    const time = scheduledDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      id: meeting.id,
      title: meeting.title,
      date: `${dayName}, ${time}`,
      type: "live",
    };
  });

  // Get next live class (hero card)
  const nextMeeting = upcomingMeetings[0];
  let upcomingLiveClass = null;

  if (nextMeeting) {
    const scheduledAt = new Date(nextMeeting.scheduledAt);
    const endTime = new Date(
      scheduledAt.getTime() + nextMeeting.duration * 60 * 1000
    );
    const diffMs = scheduledAt.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;

    let countdown = "";
    if (diffMs <= 0) {
      countdown = "Sedang berlangsung";
    } else if (diffHours > 0) {
      countdown = `${diffHours} jam ${remainingMins} menit lagi`;
    } else {
      countdown = `${diffMins} menit lagi`;
    }

    upcomingLiveClass = {
      id: nextMeeting.id,
      title: nextMeeting.title,
      tutorName: nextMeeting.section.tutor.user.name,
      time: `${scheduledAt.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })} - ${endTime.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      countdown,
      meetingUrl: nextMeeting.meetingUrl || "",
      isLive: diffMs <= 0 && diffMs > -nextMeeting.duration * 60 * 1000,
    };
  }

  // Calculate stats
  const activeClassCount = enrollments.length;
  const pendingAssignmentCount = pendingAssignments.length;

  // Calculate average score
  const allScores: number[] = [];
  gradedSubmissions.forEach((s) => {
    allScores.push((s.score! / s.assignment.maxPoints) * 100);
  });
  recentQuizAttempts.forEach((a) => {
    if (a.score !== null) allScores.push(a.score);
  });

  const averageScore =
    allScores.length > 0
      ? Math.round(
          (allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10
        ) / 10
      : 0;

  // Calculate weekly progress
  const weeklyTotal = weeklySubmissions + weeklyQuizzes;
  const weeklyTarget = 10;
  const weeklyProgress = Math.min(
    Math.round((weeklyTotal / weeklyTarget) * 100),
    100
  );

  // Prepare private enrollments for meeting request
  const privateEnrollments = enrollments
    .filter(
      (e) => e.section.template.classType === "PRIVATE" && e.status === "ACTIVE"
    )
    .map((e) => ({
      id: e.id,
      sectionId: e.sectionId,
      meetingsRemaining: e.meetingsRemaining,
      section: {
        sectionLabel: e.section.sectionLabel,
        template: {
          name: e.section.template.name,
          classType: e.section.template.classType,
        },
      },
    }));

  return (
    <DashboardClient
      studentName={userData?.name || "Student"}
      stats={{
        activeClassCount,
        pendingAssignmentCount,
        averageScore,
        weeklyProgress,
      }}
      upcomingLiveClass={upcomingLiveClass}
      myClasses={myClasses}
      pendingAssignments={pendingAssignments}
      recentQuizzes={recentQuizzes}
      upcomingEvents={upcomingEvents}
      alerts={alerts}
      privateEnrollments={privateEnrollments}
    />
  );
}
