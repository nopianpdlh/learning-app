/**
 * Start Quiz Attempt API
 * POST /api/student/quizzes/[id]/start - Create new quiz attempt
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

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

    // Get quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        class: {
          include: {
            enrollments: {
              where: {
                studentId: studentProfile.id,
                status: { in: ["ACTIVE", "PAID"] },
              },
            },
          },
        },
        attempts: {
          where: { studentId: studentProfile.id },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (quiz.class.enrollments.length === 0) {
      return NextResponse.json(
        { error: "You are not enrolled in this class" },
        { status: 403 }
      );
    }

    if (quiz.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Quiz is not available" },
        { status: 400 }
      );
    }

    const now = new Date();
    if (quiz.startDate && new Date(quiz.startDate) > now) {
      return NextResponse.json(
        { error: "Quiz has not started yet" },
        { status: 400 }
      );
    }

    if (quiz.endDate && new Date(quiz.endDate) < now) {
      return NextResponse.json(
        { error: "Quiz deadline has passed" },
        { status: 400 }
      );
    }

    // Check for active attempt
    const activeAttempt = quiz.attempts.find((a) => !a.submittedAt);
    if (activeAttempt) {
      // Return existing active attempt
      return NextResponse.json({
        success: true,
        attempt: {
          id: activeAttempt.id,
          startedAt: activeAttempt.startedAt.toISOString(),
          isResume: true,
        },
      });
    }

    // Check max attempts
    const completedAttempts = quiz.attempts.filter((a) => a.submittedAt);
    const maxAttempts = 1;
    if (completedAttempts.length >= maxAttempts) {
      return NextResponse.json(
        { error: "Maximum attempts reached" },
        { status: 400 }
      );
    }

    // Create new attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quizId,
        studentId: studentProfile.id,
        startedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        startedAt: attempt.startedAt.toISOString(),
        isResume: false,
      },
    });
  } catch (error) {
    console.error("POST /api/student/quizzes/[id]/start error:", error);
    return NextResponse.json(
      { error: "Failed to start quiz" },
      { status: 500 }
    );
  }
}
