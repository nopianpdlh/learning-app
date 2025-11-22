/**
 * Tutor Quiz Results API
 * GET /api/quizzes/[id]/results
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!profile || (profile.role !== "TUTOR" && profile.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            tutorId: true,
          },
        },
        questions: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Permission check: Tutor must own the class
    if (profile.role === "TUTOR" && quiz.class.tutorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all attempts with student info
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId: params.id,
        submittedAt: { not: null },
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                correctAnswer: true,
                points: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    // Calculate statistics
    const totalAttempts = attempts.length;
    const scores = attempts.map((a) => a.score || 0);
    const avgScore =
      totalAttempts > 0 ? scores.reduce((a, b) => a + b, 0) / totalAttempts : 0;
    const highestScore = totalAttempts > 0 ? Math.max(...scores) : 0;
    const lowestScore = totalAttempts > 0 ? Math.min(...scores) : 0;

    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const passedCount = quiz.passingGrade
      ? attempts.filter(
          (a) => ((a.score || 0) / totalPoints) * 100 >= quiz.passingGrade!
        ).length
      : 0;
    const passRate =
      totalAttempts > 0 && quiz.passingGrade
        ? Math.round((passedCount / totalAttempts) * 100)
        : null;

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        className: quiz.class.name,
        totalPoints,
        passingGrade: quiz.passingGrade,
      },
      statistics: {
        totalAttempts,
        avgScore: Math.round(avgScore * 10) / 10,
        highestScore,
        lowestScore,
        passRate,
      },
      attempts: attempts.map((attempt) => ({
        id: attempt.id,
        student: {
          id: attempt.student.user.id,
          name: attempt.student.user.name,
          email: attempt.student.user.email,
          avatar: attempt.student.user.avatar,
        },
        submittedAt: attempt.submittedAt,
        score: attempt.score,
        percentage: Math.round(((attempt.score || 0) / totalPoints) * 100),
        passed: quiz.passingGrade
          ? ((attempt.score || 0) / totalPoints) * 100 >= quiz.passingGrade
          : null,
        answers: attempt.answers.map((answer: any) => ({
          questionId: answer.questionId,
          questionText: answer.question.questionText,
          studentAnswer: answer.answer,
          correctAnswer: answer.question.correctAnswer,
          isCorrect: answer.isCorrect,
          points: answer.isCorrect ? answer.question.points : 0,
          maxPoints: answer.question.points,
        })),
      })),
    });
  } catch (error: any) {
    console.error("Get quiz results error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
