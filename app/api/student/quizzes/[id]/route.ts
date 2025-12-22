/**
 * Student Quiz Detail API
 * GET /api/student/quizzes/[id] - Get quiz with questions for taking
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

    // Get quiz with section and questions
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
            enrollments: {
              where: {
                studentId: studentProfile.id,
                status: { in: ["ACTIVE", "EXPIRED"] },
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
            // Don't include correctAnswer for quiz taking
          },
        },
        attempts: {
          where: { studentId: studentProfile.id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            startedAt: true,
            submittedAt: true,
            score: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Check enrollment
    if (quiz.section.enrollments.length === 0) {
      return NextResponse.json(
        { error: "You are not enrolled in this section" },
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
    const endDate = quiz.endDate ? new Date(quiz.endDate) : null;
    const startDate = quiz.startDate ? new Date(quiz.startDate) : null;

    if (startDate && startDate > now) {
      return NextResponse.json(
        { error: "Quiz has not started yet" },
        { status: 400 }
      );
    }

    if (endDate && endDate < now) {
      return NextResponse.json(
        { error: "Quiz deadline has passed" },
        { status: 400 }
      );
    }

    const attemptCount = quiz.attempts.length;
    const maxAttempts = 1;
    const activeAttempt = quiz.attempts.find((a) => !a.submittedAt);
    const completedAttempts = quiz.attempts.filter((a) => a.submittedAt);

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        startDate: quiz.startDate?.toISOString() || null,
        endDate: quiz.endDate?.toISOString() || null,
        passingGrade: quiz.passingGrade || 70,
        // Client compatibility
        class: {
          id: quiz.section.id,
          name: `${quiz.section.template.name} - Section ${quiz.section.sectionLabel}`,
          subject: quiz.section.template.subject,
        },
        questions: quiz.questions,
        questionCount: quiz.questions.length,
        totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
      },
      attemptCount,
      maxAttempts,
      canAttempt: attemptCount < maxAttempts || !!activeAttempt,
      activeAttempt: activeAttempt
        ? {
            id: activeAttempt.id,
            startedAt: activeAttempt.startedAt.toISOString(),
          }
        : null,
      completedAttempts: completedAttempts.map((a) => ({
        id: a.id,
        submittedAt: a.submittedAt?.toISOString(),
        score: a.score,
      })),
    });
  } catch (error) {
    console.error("GET /api/student/quizzes/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}
