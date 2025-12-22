/**
 * Single Quiz Question API
 * PUT /api/quizzes/[id]/questions/[questionId] - Update question
 * DELETE /api/quizzes/[id]/questions/[questionId] - Delete question
 * Updated to use section-based system
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; questionId: string }> }
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

    // Get question and verify ownership via section
    const question = await prisma.quizQuestion.findUnique({
      where: { id: params.questionId },
      include: {
        quiz: {
          include: {
            section: {
              select: {
                tutorId: true,
              },
            },
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    if (question.quiz.id !== params.id) {
      return NextResponse.json(
        { error: "Question does not belong to this quiz" },
        { status: 400 }
      );
    }

    if (question.quiz.section.tutorId !== dbUser.tutorProfile.id) {
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

    // Update question
    const updatedQuestion = await prisma.quizQuestion.update({
      where: { id: params.questionId },
      data: {
        questionType,
        questionText,
        options: options || [],
        correctAnswer,
        explanation: explanation || null,
        points: points || 10,
      },
    });

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error("Update question error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; questionId: string }> }
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

    // Get question and verify ownership via section
    const question = await prisma.quizQuestion.findUnique({
      where: { id: params.questionId },
      include: {
        quiz: {
          include: {
            section: {
              select: {
                tutorId: true,
              },
            },
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    if (question.quiz.id !== params.id) {
      return NextResponse.json(
        { error: "Question does not belong to this quiz" },
        { status: 400 }
      );
    }

    if (question.quiz.section.tutorId !== dbUser.tutorProfile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete question
    await prisma.quizQuestion.delete({
      where: { id: params.questionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete question error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
