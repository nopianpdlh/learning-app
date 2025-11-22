/**
 * Single Quiz API
 * GET /api/quizzes/[id] - Get quiz details
 * PUT /api/quizzes/[id] - Update quiz
 * DELETE /api/quizzes/[id] - Delete quiz
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import {
  updateQuizSchema,
  UpdateQuizInput,
} from "@/lib/validations/quiz.schema";
import { sendQuizPublishedNotification } from "@/lib/email";

export async function GET(
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
        tutorProfile: true,
        studentProfile: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch quiz with questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            tutorId: true,
            tutor: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        questions: {
          orderBy: { orderIndex: "asc" },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Permission checks based on role
    if (dbUser.role === "STUDENT") {
      // Students can only see PUBLISHED quizzes from enrolled classes
      if (!dbUser.studentProfile) {
        return NextResponse.json(
          { error: "Student profile not found" },
          { status: 404 }
        );
      }

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

      if (quiz.status !== "PUBLISHED") {
        return NextResponse.json(
          { error: "This quiz is not available yet" },
          { status: 403 }
        );
      }

      // Get student's attempts
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          quizId: quiz.id,
          studentId: dbUser.studentProfile.id,
        },
        include: {
          answers: {
            include: {
              question: true,
            },
          },
        },
        orderBy: { startedAt: "desc" },
      });

      // Don't show correct answers until quiz is submitted
      const questionsForStudent = quiz.questions.map((q) => {
        const hasSubmittedAttempt = attempts.some(
          (a) => a.submittedAt !== null
        );

        return {
          ...q,
          correctAnswer: hasSubmittedAttempt ? q.correctAnswer : undefined,
          explanation: hasSubmittedAttempt ? q.explanation : undefined,
        };
      });

      return NextResponse.json({
        ...quiz,
        questions: questionsForStudent,
        myAttempts: attempts,
      });
    } else if (dbUser.role === "TUTOR") {
      // Tutors can only see quizzes from their classes
      if (
        !dbUser.tutorProfile ||
        quiz.class.tutorId !== dbUser.tutorProfile.id
      ) {
        return NextResponse.json(
          { error: "You can only view quizzes from your own classes" },
          { status: 403 }
        );
      }
    }
    // Admins can see all quizzes

    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error("Error fetching quiz:", error);
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
        tutorProfile: true,
      },
    });

    if (!dbUser || !["TUTOR", "ADMIN"].includes(dbUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch existing quiz
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        class: true,
      },
    });

    if (!existingQuiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Verify tutor owns the class (skip for admin)
    if (dbUser.role === "TUTOR") {
      if (
        !dbUser.tutorProfile ||
        existingQuiz.class.tutorId !== dbUser.tutorProfile.id
      ) {
        return NextResponse.json(
          { error: "You can only update quizzes from your own classes" },
          { status: 403 }
        );
      }
    }

    // Parse request body
    const body: UpdateQuizInput = await request.json();
    const validatedData = updateQuizSchema.parse(body);

    // Update quiz
    const updatedQuiz = await prisma.quiz.update({
      where: { id: params.id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        timeLimit: validatedData.timeLimit,
        startDate: validatedData.startDate
          ? new Date(validatedData.startDate)
          : undefined,
        endDate: validatedData.endDate
          ? new Date(validatedData.endDate)
          : undefined,
        passingGrade: validatedData.passingGrade,
        status: validatedData.status,
      },
      include: {
        class: {
          select: {
            name: true,
          },
        },
        questions: true,
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    // If status changed from DRAFT to PUBLISHED, send notifications
    if (existingQuiz.status === "DRAFT" && updatedQuiz.status === "PUBLISHED") {
      const enrolledStudents = await prisma.enrollment.findMany({
        where: {
          classId: existingQuiz.classId,
          status: { in: ["PAID", "ACTIVE"] },
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      // Create in-app notifications
      await prisma.notification.createMany({
        data: enrolledStudents.map((enrollment) => ({
          userId: enrollment.student.user.id,
          title: "New Quiz Available",
          message: `New quiz "${updatedQuiz.title}" has been published in ${updatedQuiz.class.name}`,
          type: "QUIZ",
        })),
      });

      // Send email notifications
      const quizUrl = `${process.env.NEXT_PUBLIC_APP_URL}/student/classes/${existingQuiz.classId}/quizzes/${updatedQuiz.id}`;

      for (const enrollment of enrolledStudents) {
        sendQuizPublishedNotification({
          to: enrollment.student.user.email,
          studentName: enrollment.student.user.name,
          quizTitle: updatedQuiz.title,
          className: updatedQuiz.class.name,
          startDate: updatedQuiz.startDate || undefined,
          endDate: updatedQuiz.endDate || undefined,
          quizUrl,
        }).catch((err) => {
          console.error(
            `Failed to send quiz email to ${enrollment.student.user.email}:`,
            err
          );
        });
      }
    }

    return NextResponse.json(updatedQuiz);
  } catch (error: any) {
    console.error("Error updating quiz:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
        tutorProfile: true,
      },
    });

    if (!dbUser || !["TUTOR", "ADMIN"].includes(dbUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        class: true,
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Verify tutor owns the class (skip for admin)
    if (dbUser.role === "TUTOR") {
      if (
        !dbUser.tutorProfile ||
        quiz.class.tutorId !== dbUser.tutorProfile.id
      ) {
        return NextResponse.json(
          { error: "You can only delete quizzes from your own classes" },
          { status: 403 }
        );
      }
    }

    // Delete quiz (cascade will delete questions, attempts, answers)
    await prisma.quiz.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Quiz deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
