/**
 * Quiz Questions API
 * POST /api/quizzes/[id]/questions - Add a question to a quiz
 * Updated to use section-based system
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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
        tutorProfile: true,
      },
    });

    if (!dbUser || !dbUser.tutorProfile) {
      return NextResponse.json(
        { error: "Tutor profile not found" },
        { status: 404 }
      );
    }

    // Get quiz and verify ownership via section
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        section: {
          select: {
            tutorId: true,
          },
        },
        questions: {
          select: {
            orderIndex: true,
          },
          orderBy: {
            orderIndex: "desc",
          },
          take: 1,
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (quiz.section.tutorId !== dbUser.tutorProfile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      questionType,
      questionText,
      options,
      correctAnswer,
      explanation,
      points,
    } = body;

    // Validation
    if (!questionType || !questionText || !correctAnswer) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate question type
    if (
      !["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"].includes(questionType)
    ) {
      return NextResponse.json(
        { error: "Invalid question type" },
        { status: 400 }
      );
    }

    // For multiple choice, validate options
    if (questionType === "MULTIPLE_CHOICE") {
      if (!options || !Array.isArray(options) || options.length < 2) {
        return NextResponse.json(
          { error: "Multiple choice questions must have at least 2 options" },
          { status: 400 }
        );
      }
    }

    // Calculate next order index
    const lastQuestion = quiz.questions[0];
    const nextOrderIndex = lastQuestion ? lastQuestion.orderIndex + 1 : 0;

    // Create question
    const question = await prisma.quizQuestion.create({
      data: {
        quizId: params.id,
        questionType,
        questionText,
        options: options || [],
        correctAnswer,
        explanation: explanation || null,
        points: points || 10,
        orderIndex: nextOrderIndex,
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("Add question error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
