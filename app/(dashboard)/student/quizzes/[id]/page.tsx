/**
 * Quiz Taking Page - Server Component
 * Fetches quiz data and renders taking interface
 */

import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import QuizClient from "./QuizClient";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attemptId?: string }>;
}

export default async function QuizTakingPage({
  params,
  searchParams,
}: PageProps) {
  const { id: quizId } = await params;
  const { attemptId } = await searchParams;

  const supabase = await createClient();

  // Get authenticated user
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

  // Get quiz with questions (without correct answers for taking mode)
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          subject: true,
          enrollments: {
            where: {
              studentId: studentProfile.id,
              status: { in: ["ACTIVE", "PAID"] },
            },
            select: { id: true },
          },
        },
      },
      questions: {
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          questionType: true,
          questionText: true,
          options: true,
          points: true,
          orderIndex: true,
        },
      },
    },
  });

  if (!quiz) {
    notFound();
  }

  // Check enrollment
  if (quiz.class.enrollments.length === 0) {
    redirect("/student/quizzes");
  }

  // Check if quiz is available
  if (quiz.status !== "PUBLISHED") {
    redirect("/student/quizzes");
  }

  const now = new Date();
  if (quiz.startDate && new Date(quiz.startDate) > now) {
    redirect("/student/quizzes");
  }
  if (quiz.endDate && new Date(quiz.endDate) < now) {
    redirect("/student/quizzes");
  }

  // Get or verify attempt
  let attempt;
  if (attemptId) {
    attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.studentId !== studentProfile.id) {
      redirect("/student/quizzes");
    }

    if (attempt.submittedAt) {
      // Already submitted, redirect to result
      redirect(`/student/quizzes/${quizId}/result?attemptId=${attemptId}`);
    }
  } else {
    // Check for active attempt
    attempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        studentId: studentProfile.id,
        submittedAt: null,
      },
    });

    if (!attempt) {
      // No active attempt, redirect to start
      redirect("/student/quizzes");
    }
  }

  return (
    <QuizClient
      quiz={{
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        class: {
          id: quiz.class.id,
          name: quiz.class.name,
          subject: quiz.class.subject,
        },
        questions: quiz.questions,
        questionCount: quiz.questions.length,
        totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
      }}
      attemptId={attempt.id}
      startedAt={attempt.startedAt.toISOString()}
    />
  );
}
