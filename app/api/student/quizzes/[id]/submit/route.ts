/**
 * Submit Quiz API
 * POST /api/student/quizzes/[id]/submit - Submit quiz answers
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

interface SubmitAnswer {
  questionId: string;
  answer: string;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const quizId = params.id;
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
    });

    if (!studentProfile) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Parse body
    const body = await request.json();
    const { attemptId, answers } = body as {
      attemptId: string;
      answers: SubmitAnswer[];
    };

    if (!attemptId || !answers) {
      return NextResponse.json(
        { error: "Missing attemptId or answers" },
        { status: 400 }
      );
    }

    // Get attempt
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.studentId !== studentProfile.id) {
      return NextResponse.json({ error: "Not your attempt" }, { status: 403 });
    }

    if (attempt.submittedAt) {
      return NextResponse.json(
        { error: "Quiz already submitted" },
        { status: 400 }
      );
    }

    // Check time limit
    if (attempt.quiz.timeLimit) {
      const startTime = new Date(attempt.startedAt);
      const endTime = new Date(
        startTime.getTime() + attempt.quiz.timeLimit * 60 * 1000
      );
      const now = new Date();

      // Allow 30 second grace period for network latency
      if (now > new Date(endTime.getTime() + 30000)) {
        // Auto-submit with current answers if past time
        console.log("Time exceeded, auto-submitting");
      }
    }

    // Grade answers
    const questions = attempt.quiz.questions;
    let totalScore = 0;
    let maxScore = 0;

    const gradedAnswers = answers.map((ans) => {
      const question = questions.find((q) => q.id === ans.questionId);
      if (!question) {
        return { ...ans, isCorrect: false, points: 0 };
      }

      maxScore += question.points;

      // Case-insensitive comparison for text answers
      const isCorrect =
        ans.answer.toLowerCase().trim() ===
        question.correctAnswer.toLowerCase().trim();

      if (isCorrect) {
        totalScore += question.points;
      }

      return {
        ...ans,
        isCorrect,
        points: isCorrect ? question.points : 0,
      };
    });

    // Calculate percentage score
    const percentageScore =
      maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Save answers and update attempt
    await prisma.$transaction(async (tx) => {
      // Delete any existing answers for this attempt
      await tx.quizAnswer.deleteMany({
        where: { attemptId: attemptId },
      });

      // Create new answers
      await tx.quizAnswer.createMany({
        data: gradedAnswers.map((ans) => ({
          attemptId: attemptId,
          questionId: ans.questionId,
          answer: ans.answer,
          isCorrect: ans.isCorrect,
        })),
      });

      // Update attempt with score
      await tx.quizAttempt.update({
        where: { id: attemptId },
        data: {
          submittedAt: new Date(),
          score: percentageScore,
        },
      });
    });

    return NextResponse.json({
      success: true,
      result: {
        attemptId,
        score: percentageScore,
        totalPoints: totalScore,
        maxPoints: maxScore,
        passingGrade: attempt.quiz.passingGrade || 70,
        passed: percentageScore >= (attempt.quiz.passingGrade || 70),
        correctCount: gradedAnswers.filter((a) => a.isCorrect).length,
        totalQuestions: questions.length,
      },
    });
  } catch (error) {
    console.error("POST /api/student/quizzes/[id]/submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}
