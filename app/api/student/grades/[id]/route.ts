/**
 * Student Grade Report API
 * GET /api/student/grades/[id] - Get detailed grade report for a specific section
 * Updated to use section-based system
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sectionId } = await params;
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

    // Verify enrollment via section
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: student.id,
        sectionId,
        status: { in: ["ACTIVE", "EXPIRED"] },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this section" },
        { status: 403 }
      );
    }

    // Get section info
    const section = await prisma.classSection.findUnique({
      where: { id: sectionId },
      select: {
        id: true,
        sectionLabel: true,
        template: {
          select: {
            name: true,
            subject: true,
            gradeLevel: true,
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
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Get all assignments for this section
    const assignments = await prisma.assignment.findMany({
      where: {
        sectionId,
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

    // Get all quizzes for this section
    const quizzes = await prisma.quiz.findMany({
      where: {
        sectionId,
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
        id: section.id,
        name: `${section.template.name} - Section ${section.sectionLabel}`,
        subject: section.template.subject,
        gradeLevel: section.template.gradeLevel,
        tutorName: section.tutor.user.name,
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
