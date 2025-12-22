/**
 * Quiz Result API
 * GET /api/student/quizzes/[id]/result - Get quiz attempt result with answers
 * Updated to use section-based system
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const quizId = params.id;
    const { searchParams } = new URL(request.url);
    const attemptId = searchParams.get("attemptId");

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

    // Get quiz with questions and section
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
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
          },
        },
        questions: {
          orderBy: { orderIndex: "asc" },
          select: {
            id: true,
            questionType: true,
            questionText: true,
            options: true,
            correctAnswer: true,
            explanation: true,
            points: true,
            orderIndex: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Get attempt(s)
    let attempt;
    if (attemptId) {
      attempt = await prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        include: {
          answers: true,
        },
      });

      if (!attempt || attempt.studentId !== studentProfile.id) {
        return NextResponse.json(
          { error: "Attempt not found" },
          { status: 404 }
        );
      }
    } else {
      // Get best attempt
      attempt = await prisma.quizAttempt.findFirst({
        where: {
          quizId: quizId,
          studentId: studentProfile.id,
          submittedAt: { not: null },
        },
        orderBy: { score: "desc" },
        include: {
          answers: true,
        },
      });
    }

    if (!attempt || !attempt.submittedAt) {
      return NextResponse.json(
        { error: "No completed attempt found" },
        { status: 404 }
      );
    }

    // Build detailed result with answers
    const questionsWithAnswers = quiz.questions.map((question) => {
      const studentAnswer = attempt.answers.find(
        (a) => a.questionId === question.id
      );

      return {
        id: question.id,
        questionType: question.questionType,
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        points: question.points,
        studentAnswer: studentAnswer?.answer || null,
        isCorrect: studentAnswer?.isCorrect || false,
        earnedPoints: studentAnswer?.isCorrect ? question.points : 0,
      };
    });

    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = questionsWithAnswers.reduce(
      (sum, q) => sum + q.earnedPoints,
      0
    );
    const correctCount = questionsWithAnswers.filter((q) => q.isCorrect).length;

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        passingGrade: quiz.passingGrade || 70,
        // Client compatibility
        class: {
          id: quiz.section.id,
          name: `${quiz.section.template.name} - Section ${quiz.section.sectionLabel}`,
          subject: quiz.section.template.subject,
        },
      },
      attempt: {
        id: attempt.id,
        startedAt: attempt.startedAt.toISOString(),
        submittedAt: attempt.submittedAt.toISOString(),
        score: attempt.score,
      },
      result: {
        score: attempt.score || 0,
        totalPoints,
        earnedPoints,
        correctCount,
        totalQuestions: quiz.questions.length,
        passed: (attempt.score || 0) >= (quiz.passingGrade || 70),
      },
      questions: questionsWithAnswers,
    });
  } catch (error) {
    console.error("GET /api/student/quizzes/[id]/result error:", error);
    return NextResponse.json(
      { error: "Failed to fetch result" },
      { status: 500 }
    );
  }
}
