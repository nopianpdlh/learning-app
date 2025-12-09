/**
 * Student Dashboard Page - Server Component
 * Fetches dashboard data and passes to client component
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import DashboardClient from "./DashboardClient";

export default async function StudentDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get student profile
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });

  if (!studentProfile) {
    redirect("/login");
  }

  // Get user info
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true },
  });

  // Get enrolled classes
  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: studentProfile.id,
      status: { in: ["ACTIVE", "PAID"] },
    },
    include: {
      class: {
        include: {
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

  const classIds = enrollments.map((e) => e.class.id);

  // Calculate progress for each class
  const submittedAssignments = await prisma.assignmentSubmission.findMany({
    where: {
      studentId: studentProfile.id,
      assignment: { classId: { in: classIds } },
    },
    select: { assignmentId: true, assignment: { select: { classId: true } } },
  });

  const completedQuizzes = await prisma.quizAttempt.findMany({
    where: {
      studentId: studentProfile.id,
      submittedAt: { not: null },
      quiz: { classId: { in: classIds } },
    },
    select: { quizId: true, quiz: { select: { classId: true } } },
  });

  const myClasses = enrollments.slice(0, 4).map((enrollment) => {
    const cls = enrollment.class;
    const totalItems = cls.assignments.length + cls.quizzes.length;

    const completedAssigns = submittedAssignments.filter(
      (s) => s.assignment.classId === cls.id
    ).length;
    const completedQuiz = completedQuizzes.filter(
      (q) => q.quiz.classId === cls.id
    ).length;

    const completedItems = completedAssigns + completedQuiz;
    const progress =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      id: cls.id,
      name: cls.name,
      subject: cls.subject,
      tutorName: cls.tutor.user.name,
      progress,
      thumbnail: cls.thumbnail,
    };
  });

  // Get pending assignments
  const allAssignments = await prisma.assignment.findMany({
    where: {
      classId: { in: classIds },
      dueDate: { gte: new Date() },
    },
    include: { class: { select: { name: true } } },
    orderBy: { dueDate: "asc" },
  });

  const submittedIds = new Set(submittedAssignments.map((s) => s.assignmentId));
  const pendingAssignments = allAssignments
    .filter((a) => !submittedIds.has(a.id))
    .slice(0, 5)
    .map((a) => {
      const now = new Date();
      const due = new Date(a.dueDate);
      const diffDays = Math.ceil(
        (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: a.id,
        title: a.title,
        className: a.class.name,
        dueDate:
          diffDays === 0
            ? "Hari ini"
            : diffDays === 1
            ? "1 hari lagi"
            : `${diffDays} hari lagi`,
        urgent: diffDays <= 1,
      };
    });

  // Get recent quiz scores
  const recentQuizAttempts = await prisma.quizAttempt.findMany({
    where: {
      studentId: studentProfile.id,
      submittedAt: { not: null },
      score: { not: null },
    },
    include: {
      quiz: { include: { class: { select: { name: true } } } },
    },
    orderBy: { submittedAt: "desc" },
    take: 5,
  });

  const recentQuizzes = recentQuizAttempts.map((attempt) => ({
    id: attempt.quiz.id,
    title: attempt.quiz.title,
    className: attempt.quiz.class.name,
    score: attempt.score!,
    maxScore: 100,
  }));

  // Get upcoming live classes
  const now = new Date();
  const upcomingLiveClasses = await prisma.liveClass.findMany({
    where: {
      classId: { in: classIds },
      scheduledAt: { gte: now },
      status: { not: "CANCELLED" },
    },
    include: {
      class: {
        include: { tutor: { include: { user: { select: { name: true } } } } },
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: 5,
  });

  const dayNames = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];

  const upcomingEvents = upcomingLiveClasses.map((lc) => {
    const scheduledDate = new Date(lc.scheduledAt);
    const dayName = dayNames[scheduledDate.getDay()];
    const time = scheduledDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      id: lc.id,
      title: lc.title,
      date: `${dayName}, ${time}`,
      type: "live",
    };
  });

  // Get next live class (hero card)
  const nextLiveClass = upcomingLiveClasses[0];
  let upcomingLiveClass = null;

  if (nextLiveClass) {
    const scheduledAt = new Date(nextLiveClass.scheduledAt);
    const endTime = new Date(
      scheduledAt.getTime() + nextLiveClass.duration * 60 * 1000
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
      id: nextLiveClass.id,
      title: nextLiveClass.title,
      tutorName: nextLiveClass.class.tutor.user.name,
      time: `${scheduledAt.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })} - ${endTime.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      countdown,
      meetingUrl: nextLiveClass.meetingUrl,
      isLive: diffMs <= 0 && diffMs > -nextLiveClass.duration * 60 * 1000,
    };
  }

  // Calculate stats
  const activeClassCount = enrollments.length;
  const pendingAssignmentCount = pendingAssignments.length;

  // Calculate average score
  const gradedSubmissions = await prisma.assignmentSubmission.findMany({
    where: {
      studentId: studentProfile.id,
      status: "GRADED",
      score: { not: null },
    },
    include: { assignment: { select: { maxPoints: true } } },
  });

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
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weeklySubmissions = await prisma.assignmentSubmission.count({
    where: { studentId: studentProfile.id, submittedAt: { gte: weekAgo } },
  });

  const weeklyQuizzes = await prisma.quizAttempt.count({
    where: {
      studentId: studentProfile.id,
      submittedAt: { gte: weekAgo, not: null },
    },
  });

  const weeklyTotal = weeklySubmissions + weeklyQuizzes;
  const weeklyTarget = 10;
  const weeklyProgress = Math.min(
    Math.round((weeklyTotal / weeklyTarget) * 100),
    100
  );

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
    />
  );
}
