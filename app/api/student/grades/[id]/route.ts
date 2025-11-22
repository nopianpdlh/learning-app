/**
 * Student Grade Report API
 * GET /api/student/grades/[id] - Get detailed grade report for a specific class
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

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

    // Get student profile
    const student = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    const classId = params.id;

    // Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_classId: {
          studentId: student.id,
          classId,
        },
      },
    });

    if (
      !enrollment ||
      !["PAID", "ACTIVE", "COMPLETED"].includes(enrollment.status)
    ) {
      return NextResponse.json(
        { error: "Not enrolled in this class" },
        { status: 403 }
      );
    }

    // Get class info
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        subject: true,
        gradeLevel: true,
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
    });

    if (!classInfo) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Get all assignments
    const assignments = await prisma.assignment.findMany({
      where: {
        classId,
        status: "PUBLISHED",
      },
      include: {
        submissions: {
          where: {
            studentId: student.id,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    // Get all quizzes
    const quizzes = await prisma.quiz.findMany({
      where: {
        classId,
        status: "PUBLISHED",
      },
      include: {
        attempts: {
          where: {
            studentId: student.id,
          },
          orderBy: {
            submittedAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Calculate summary statistics
    const assignmentScores = assignments
      .filter(
        (a) => a.submissions.length > 0 && a.submissions[0].score !== null
      )
      .map((a) => ({
        score: a.submissions[0].score!,
        maxPoints: a.maxPoints,
      }));

    const quizScores = quizzes
      .filter((q) => q.attempts.length > 0 && q.attempts[0].score !== null)
      .map((q) => q.attempts[0].score!);

    const assignmentsAverage =
      assignmentScores.length > 0
        ? Math.round(
            assignmentScores.reduce(
              (sum, item) => sum + (item.score / item.maxPoints) * 100,
              0
            ) / assignmentScores.length
          )
        : null;

    const quizzesAverage =
      quizScores.length > 0
        ? Math.round(
            quizScores.reduce((sum, score) => sum + score, 0) /
              quizScores.length
          )
        : null;

    const overallAverage =
      assignmentsAverage !== null && quizzesAverage !== null
        ? Math.round((assignmentsAverage + quizzesAverage) / 2)
        : assignmentsAverage || quizzesAverage;

    const totalActivities = assignments.length + quizzes.length;
    const completedActivities =
      assignments.filter((a) => a.submissions.length > 0).length +
      quizzes.filter((q) => q.attempts.length > 0).length;

    const completionRate =
      totalActivities > 0
        ? Math.round((completedActivities / totalActivities) * 100)
        : 0;

    const gradeData = {
      classInfo: {
        id: classInfo.id,
        name: classInfo.name,
        subject: classInfo.subject,
        gradeLevel: classInfo.gradeLevel,
        tutorName: classInfo.tutor.user.name,
      },
      student: {
        name: student.user.name,
        email: student.user.email,
      },
      assignments: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
        maxPoints: a.maxPoints,
        submission:
          a.submissions.length > 0
            ? {
                score: a.submissions[0].score,
                status: a.submissions[0].status,
                submittedAt: a.submissions[0].submittedAt,
                feedback: a.submissions[0].feedback,
              }
            : undefined,
      })),
      quizzes: quizzes.map((q) => ({
        id: q.id,
        title: q.title,
        attempt:
          q.attempts.length > 0
            ? {
                score: q.attempts[0].score,
                submittedAt: q.attempts[0].submittedAt,
              }
            : undefined,
      })),
      summary: {
        assignmentsAverage,
        quizzesAverage,
        overallAverage,
        completionRate,
      },
    };

    return NextResponse.json(gradeData);
  } catch (error: any) {
    console.error("Error fetching grade report:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
