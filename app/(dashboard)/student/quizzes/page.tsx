/**
 * Student Quizzes Page - Server Component
 * Fetches quizzes data from database and passes to client component
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import QuizzesClient from "./QuizzesClient";

export default async function StudentQuizzesPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get student profile with enrollments
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    include: {
      enrollments: {
        where: {
          status: { in: ["ACTIVE", "PAID"] },
        },
        select: { classId: true },
      },
    },
  });

  if (!studentProfile) {
    redirect("/login");
  }

  const enrolledClassIds = studentProfile.enrollments.map((e) => e.classId);

  // Handle no enrollments
  if (enrolledClassIds.length === 0) {
    return (
      <QuizzesClient
        initialQuizzes={[]}
        initialStats={{
          total: 0,
          available: 0,
          completed: 0,
          missed: 0,
          avgScore: 0,
        }}
      />
    );
  }

  // Fetch all PUBLISHED quizzes from enrolled classes
  const quizzes = await prisma.quiz.findMany({
    where: {
      classId: { in: enrolledClassIds },
      status: "PUBLISHED",
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          subject: true,
        },
      },
      questions: {
        select: { id: true },
      },
      attempts: {
        where: {
          studentId: studentProfile.id,
        },
        orderBy: { score: "desc" },
        select: {
          id: true,
          startedAt: true,
          submittedAt: true,
          score: true,
        },
      },
    },
    orderBy: [{ endDate: "asc" }, { createdAt: "desc" }],
  });

  // Process quizzes with computed status
  const now = new Date();
  const processedQuizzes = quizzes.map((quiz) => {
    const attempts = quiz.attempts;
    const bestAttempt = attempts[0] || null;
    const attemptCount = attempts.length;
    const maxAttempts = 1;

    let effectiveStatus: string;
    const endDate = quiz.endDate ? new Date(quiz.endDate) : null;
    const startDate = quiz.startDate ? new Date(quiz.startDate) : null;
    const isPastDue = endDate ? endDate < now : false;
    const isNotStarted = startDate ? startDate > now : false;

    if (attemptCount > 0 && bestAttempt?.submittedAt) {
      effectiveStatus = "COMPLETED";
    } else if (attemptCount > 0 && !bestAttempt?.submittedAt) {
      effectiveStatus = "IN_PROGRESS";
    } else if (isPastDue) {
      effectiveStatus = "MISSED";
    } else if (isNotStarted) {
      effectiveStatus = "UPCOMING";
    } else {
      effectiveStatus = "AVAILABLE";
    }

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      startDate: quiz.startDate?.toISOString() || null,
      endDate: quiz.endDate?.toISOString() || null,
      passingGrade: quiz.passingGrade || 70,
      createdAt: quiz.createdAt.toISOString(),
      class: quiz.class,
      questionCount: quiz.questions.length,
      attemptCount,
      maxAttempts,
      effectiveStatus,
      canRetry: attemptCount < maxAttempts && !isPastDue,
      bestScore: bestAttempt?.score || null,
      lastAttemptAt: bestAttempt?.submittedAt?.toISOString() || null,
    };
  });

  // Calculate stats
  const completedQuizzes = processedQuizzes.filter(
    (q) => q.effectiveStatus === "COMPLETED"
  );
  const scores = completedQuizzes
    .filter((q) => q.bestScore !== null)
    .map((q) => q.bestScore as number);

  const stats = {
    total: processedQuizzes.length,
    available: processedQuizzes.filter(
      (q) =>
        q.effectiveStatus === "AVAILABLE" || q.effectiveStatus === "IN_PROGRESS"
    ).length,
    completed: completedQuizzes.length,
    missed: processedQuizzes.filter((q) => q.effectiveStatus === "MISSED")
      .length,
    avgScore:
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0,
  };

  return (
    <QuizzesClient initialQuizzes={processedQuizzes} initialStats={stats} />
  );
}
