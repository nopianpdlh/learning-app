/**
 * Quiz Attempt API
 * POST /api/quizzes/[id]/attempt - Start a quiz attempt
 * PUT /api/quizzes/[id]/attempt - Submit quiz answers
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import {
  submitQuizSchema,
  gradeAnswer,
  calculateQuizScore,
  isQuizAvailable,
} from "@/lib/validations/quiz.schema";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        studentProfile: true,
      },
    });

    if (!dbUser || dbUser.role !== "STUDENT" || !dbUser.studentProfile) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Verify student is enrolled in the class
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_classId: {
          studentId: dbUser.studentProfile.id,
          classId: quiz.classId,
        },
      },
    });

    if (!enrollment || !["PAID", "ACTIVE"].includes(enrollment.status)) {
      return NextResponse.json(
        { error: "You must be enrolled in this class" },
        { status: 403 }
      );
    }

    // Check if quiz is available
    if (!isQuizAvailable(quiz.status, quiz.startDate, quiz.endDate)) {
      return NextResponse.json(
        { error: "This quiz is not available at the moment" },
        { status: 403 }
      );
    }

    // Check if student already has an active (not submitted) attempt
    const activeAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId: quiz.id,
        studentId: dbUser.studentProfile.id,
        submittedAt: null,
      },
    });

    if (activeAttempt) {
      return NextResponse.json(
        {
          error: "You already have an active attempt for this quiz",
          attemptId: activeAttempt.id,
        },
        { status: 400 }
      );
    }

    // Check if student already completed the quiz
    const completedAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId: quiz.id,
        studentId: dbUser.studentProfile.id,
        submittedAt: { not: null },
      },
    });

    if (completedAttempt) {
      return NextResponse.json(
        {
          error: "You have already completed this quiz",
          attemptId: completedAttempt.id,
        },
        { status: 400 }
      );
    }

    // Create new attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        studentId: dbUser.studentProfile.id,
      },
    });

    return NextResponse.json(
      {
        attemptId: attempt.id,
        startedAt: attempt.startedAt,
        timeLimit: quiz.timeLimit,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error starting quiz attempt:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        studentProfile: true,
      },
    });

    if (!dbUser || dbUser.role !== "STUDENT" || !dbUser.studentProfile) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const validatedData = submitQuizSchema.parse(body);

    // Fetch attempt
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: validatedData.attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { orderIndex: "asc" },
            },
            class: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Verify attempt belongs to student
    if (attempt.studentId !== dbUser.studentProfile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if already submitted
    if (attempt.submittedAt) {
      return NextResponse.json(
        { error: "Quiz already submitted" },
        { status: 400 }
      );
    }

    // Check time limit
    if (attempt.quiz.timeLimit) {
      const elapsedMinutes =
        (new Date().getTime() - new Date(attempt.startedAt).getTime()) /
        (1000 * 60);
      if (elapsedMinutes > attempt.quiz.timeLimit) {
        return NextResponse.json(
          { error: "Time limit exceeded" },
          { status: 400 }
        );
      }
    }

    // Grade all answers
    const gradedAnswers = validatedData.answers.map((answer) => {
      const question = attempt.quiz.questions.find(
        (q) => q.id === answer.questionId
      );

      if (!question) {
        throw new Error(`Question ${answer.questionId} not found`);
      }

      const isCorrect = gradeAnswer(
        answer.answer,
        question.correctAnswer,
        question.questionType as any
      );

      return {
        attemptId: attempt.id,
        questionId: answer.questionId,
        answer: answer.answer,
        isCorrect,
        points: question.points,
      };
    });

    // Calculate score
    const { score, totalPoints, percentage } =
      calculateQuizScore(gradedAnswers);

    // Save answers and update attempt
    await prisma.$transaction([
      // Delete existing answers (if any)
      prisma.quizAnswer.deleteMany({
        where: { attemptId: attempt.id },
      }),
      // Create new answers
      prisma.quizAnswer.createMany({
        data: gradedAnswers.map((a) => ({
          attemptId: a.attemptId,
          questionId: a.questionId,
          answer: a.answer,
          isCorrect: a.isCorrect,
        })),
      }),
      // Update attempt with score
      prisma.quizAttempt.update({
        where: { id: attempt.id },
        data: {
          submittedAt: new Date(),
          score,
        },
      }),
    ]);

    // Fetch updated attempt with answers
    const updatedAttempt = await prisma.quizAttempt.findUnique({
      where: { id: attempt.id },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        quiz: {
          include: {
            class: true,
          },
        },
      },
    });

    // Send notification to student
    await prisma.notification.create({
      data: {
        userId: dbUser.id,
        title: "Quiz Submitted",
        message: `Your quiz "${attempt.quiz.title}" has been submitted. Score: ${score}/${totalPoints} (${percentage}%)`,
        type: "QUIZ",
      },
    });

    return NextResponse.json({
      attempt: updatedAttempt,
      score,
      totalPoints,
      percentage,
    });
  } catch (error: any) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
