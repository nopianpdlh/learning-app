/**
 * Student Quizzes API
 * GET /api/student/quizzes - Fetch all quizzes from enrolled classes
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
            status: { in: ["ACTIVE", "PAID"] },
          },
          select: { classId: true },
        },
      },
    });

    if (!studentProfile) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    const enrolledClassIds = studentProfile.enrollments.map((e) => e.classId);

    if (enrolledClassIds.length === 0) {
      return NextResponse.json({
        quizzes: [],
        stats: { total: 0, available: 0, completed: 0, missed: 0, avgScore: 0 },
      });
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
      const bestAttempt = attempts[0] || null; // Sorted by score desc
      const attemptCount = attempts.length;
      const maxAttempts = 1; // Default max attempts

      // Determine status
      let effectiveStatus: string;
      const endDate = quiz.endDate ? new Date(quiz.endDate) : null;
      const startDate = quiz.startDate ? new Date(quiz.startDate) : null;
      const isPastDue = endDate ? endDate < now : false;
      const isNotStarted = startDate ? startDate > now : false;

      if (attemptCount > 0 && bestAttempt?.submittedAt) {
        effectiveStatus = "COMPLETED";
      } else if (attemptCount > 0 && !bestAttempt?.submittedAt) {
        effectiveStatus = "IN_PROGRESS"; // Started but not submitted
      } else if (isPastDue) {
        effectiveStatus = "MISSED";
      } else if (isNotStarted) {
        effectiveStatus = "UPCOMING";
      } else {
        effectiveStatus = "AVAILABLE";
      }

      // Calculate total points from questions
      const questionCount = quiz.questions.length;

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
        questionCount,
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
          q.effectiveStatus === "AVAILABLE" ||
          q.effectiveStatus === "IN_PROGRESS"
      ).length,
      completed: completedQuizzes.length,
      missed: processedQuizzes.filter((q) => q.effectiveStatus === "MISSED")
        .length,
      avgScore:
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0,
    };

    return NextResponse.json({
      quizzes: processedQuizzes,
      stats,
    });
  } catch (error) {
    console.error("GET /api/student/quizzes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}
