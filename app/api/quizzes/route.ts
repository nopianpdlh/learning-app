/**
 * Quizzes API
 * GET /api/quizzes - List quizzes with filters
 * POST /api/quizzes - Create a new quiz
 * Updated to use section-based system
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

    // Parse query parameters - support both classId and sectionId
    const searchParams = request.nextUrl.searchParams;
    const sectionId =
      searchParams.get("classId") || searchParams.get("sectionId") || undefined;
    const params = quizFilterSchema.parse({
      classId: sectionId,
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

    // Build where clause based on role
    const where: any = {};

    // If sectionId provided, filter by section
    if (params.classId) {
      where.sectionId = params.classId;
    }

    // Role-based filtering
    if (dbUser.role === "STUDENT") {
      if (!dbUser.studentProfile) {
        return NextResponse.json(
          { error: "Student profile not found" },
          { status: 404 }
        );
      }

      const enrolledSections = await prisma.enrollment.findMany({
        where: {
          studentId: dbUser.studentProfile.id,
          status: { in: ["ACTIVE", "EXPIRED"] },
        },
        select: { sectionId: true },
      });

      where.sectionId = { in: enrolledSections.map((e) => e.sectionId) };
      where.status = "PUBLISHED";
      delete params.status;
    } else if (dbUser.role === "TUTOR") {
      if (!dbUser.tutorProfile) {
        return NextResponse.json(
          { error: "Tutor profile not found" },
          { status: 404 }
        );
      }

      const tutorSections = await prisma.classSection.findMany({
        where: { tutorId: dbUser.tutorProfile.id },
        select: { id: true },
      });

      where.sectionId = { in: tutorSections.map((s) => s.id) };
    }

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

    // Transform for client compatibility
    let quizzesWithAttempts = quizzes.map((quiz) => ({
      ...quiz,
      // Client compatibility
      class: {
        id: quiz.section.id,
        name: `${quiz.section.template.name} - Section ${quiz.section.sectionLabel}`,
        tutor: quiz.section.tutor,
      },
    }));

    // For students, include their attempt status
    if (dbUser.role === "STUDENT" && dbUser.studentProfile) {
      quizzesWithAttempts = await Promise.all(
        quizzesWithAttempts.map(async (quiz) => {
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

    // Support both classId and sectionId
    const sectionId = (body as any).sectionId || body.classId;
    const dataToValidate = { ...body, classId: sectionId };

    // Validate data
    const validation = createQuizSchema.safeParse(dataToValidate);
    if (!validation.success) {
      const errors = validation.error.issues.map((err: any) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Verify section exists
    const sectionData = await prisma.classSection.findUnique({
      where: { id: validatedData.classId },
      include: {
        template: true,
      },
    });

    if (!sectionData) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Verify tutor owns the section (skip for admin)
    if (dbUser.role === "TUTOR") {
      if (
        !dbUser.tutorProfile ||
        sectionData.tutorId !== dbUser.tutorProfile.id
      ) {
        return NextResponse.json(
          { error: "You can only create quizzes for your own sections" },
          { status: 403 }
        );
      }
    }

    // Create quiz with questions
    const quiz = await prisma.quiz.create({
      data: {
        sectionId: validatedData.classId,
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
        section: {
          select: {
            sectionLabel: true,
            template: {
              select: {
                name: true,
              },
            },
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
          sectionId: validatedData.classId,
          status: { in: ["ACTIVE"] },
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
      if (enrolledStudents.length > 0) {
        await prisma.notification.createMany({
          data: enrolledStudents.map((enrollment) => ({
            userId: enrollment.student.user.id,
            title: "New Quiz Available",
            message: `New quiz "${quiz.title}" has been published in ${quiz.section.template.name}`,
            type: "QUIZ",
          })),
        });
      }
    }

    return NextResponse.json(
      {
        ...quiz,
        class: {
          name: `${quiz.section.template.name} - Section ${quiz.section.sectionLabel}`,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating quiz:", error);

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
