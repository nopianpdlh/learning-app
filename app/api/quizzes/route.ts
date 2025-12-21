/**
 * Quizzes API
 * GET /api/quizzes - List quizzes with filters
 * POST /api/quizzes - Create a new quiz
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import {
  createQuizSchema,
  quizFilterSchema,
  CreateQuizInput,
} from "@/lib/validations/quiz.schema";

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = quizFilterSchema.parse({
      classId: searchParams.get("classId") || undefined,
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

    // Build where clause based on role
    const where: any = {};

    // If classId provided, filter by class
    if (params.classId) {
      where.classId = params.classId;
    }

    // Role-based filtering
    if (dbUser.role === "STUDENT") {
      // Students can only see PUBLISHED quizzes from enrolled classes
      if (!dbUser.studentProfile) {
        return NextResponse.json(
          { error: "Student profile not found" },
          { status: 404 }
        );
      }

      const enrolledClasses = await prisma.enrollment.findMany({
        where: {
          studentId: dbUser.studentProfile.id,
          status: { in: ["PAID", "ACTIVE"] },
        },
        select: { classId: true },
      });

      where.classId = { in: enrolledClasses.map((e) => e.classId) };
      where.status = "PUBLISHED";

      // Override status filter for students
      delete params.status;
    } else if (dbUser.role === "TUTOR") {
      // Tutors can see all quizzes from their classes
      if (!dbUser.tutorProfile) {
        return NextResponse.json(
          { error: "Tutor profile not found" },
          { status: 404 }
        );
      }

      const tutorClasses = await prisma.class.findMany({
        where: { tutorId: dbUser.tutorProfile.id },
        select: { id: true },
      });

      where.classId = { in: tutorClasses.map((c) => c.id) };
    }
    // Admins can see all quizzes

    // Apply status filter if provided
    if (params.status) {
      where.status = params.status;
    }

    // Pagination
    const skip = (params.page - 1) * params.limit;

    // Fetch quizzes
    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        include: {
          class: {
            select: {
              id: true,
              name: true,
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
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: params.limit,
      }),
      prisma.quiz.count({ where }),
    ]);

    // For students, include their attempt status
    let quizzesWithAttempts = quizzes;
    if (dbUser.role === "STUDENT" && dbUser.studentProfile) {
      quizzesWithAttempts = await Promise.all(
        quizzes.map(async (quiz) => {
          const attempts = await prisma.quizAttempt.findMany({
            where: {
              quizId: quiz.id,
              studentId: dbUser.studentProfile!.id,
            },
            select: {
              id: true,
              submittedAt: true,
              score: true,
            },
          });

          return {
            ...quiz,
            myAttempts: attempts,
          };
        })
      );
    }

    return NextResponse.json({
      quizzes: quizzesWithAttempts,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body: CreateQuizInput = await request.json();

    // Validate data
    const validation = createQuizSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Verify class exists
    const classData = await prisma.class.findUnique({
      where: { id: validatedData.classId },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Verify tutor owns the class (skip for admin)
    if (dbUser.role === "TUTOR") {
      if (
        !dbUser.tutorProfile ||
        classData.tutorId !== dbUser.tutorProfile.id
      ) {
        return NextResponse.json(
          { error: "You can only create quizzes for your own classes" },
          { status: 403 }
        );
      }
    }

    // Create quiz with questions
    const quiz = await prisma.quiz.create({
      data: {
        classId: validatedData.classId,
        title: validatedData.title,
        description: validatedData.description,
        timeLimit: validatedData.timeLimit,
        startDate: validatedData.startDate
          ? new Date(validatedData.startDate)
          : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        passingGrade: validatedData.passingGrade,
        status: validatedData.status,
        questions: validatedData.questions
          ? {
              create: validatedData.questions.map((q) => ({
                questionType: q.questionType,
                questionText: q.questionText,
                options: q.options || [],
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                points: q.points,
                orderIndex: q.orderIndex,
              })),
            }
          : undefined,
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
          },
        },
      },
    });

    // If quiz is published, send notifications to enrolled students
    if (quiz.status === "PUBLISHED") {
      const enrolledStudents = await prisma.enrollment.findMany({
        where: {
          classId: validatedData.classId,
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

      // Create notifications for all enrolled students
      await prisma.notification.createMany({
        data: enrolledStudents.map((enrollment) => ({
          userId: enrollment.student.user.id,
          title: "New Quiz Available",
          message: `New quiz "${quiz.title}" has been published in ${quiz.class.name}`,
          type: "QUIZ",
        })),
      });
    }

    return NextResponse.json(quiz, { status: 201 });
  } catch (error: any) {
    console.error("Error creating quiz:", error);

    // Handle Prisma errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A quiz with this information already exists" },
        { status: 409 }
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Related record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create quiz" },
      { status: 500 }
    );
  }
}
