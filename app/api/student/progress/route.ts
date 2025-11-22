/**
 * Student Progress API
 * GET /api/student/progress - Get comprehensive progress data for student
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

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

    // Get student profile
    const student = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Get all enrollments with related data
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: student.id,
        status: { in: ["PAID", "ACTIVE", "COMPLETED"] },
      },
      include: {
        class: {
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
        },
      },
    });

    const classIds = enrollments.map((e) => e.classId);

    // Get all assignments for enrolled classes
    const assignments = await prisma.assignment.findMany({
      where: {
        classId: { in: classIds },
        status: "PUBLISHED",
      },
      include: {
        submissions: {
          where: {
            studentId: student.id,
          },
        },
      },
    });

    // Get all quizzes for enrolled classes
    const quizzes = await prisma.quiz.findMany({
      where: {
        classId: { in: classIds },
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
          take: 1, // Latest attempt only
        },
      },
    });

    // Get all live classes
    const liveClasses = await prisma.liveClass.findMany({
      where: {
        classId: { in: classIds },
      },
      orderBy: {
        scheduledAt: "desc",
      },
    });

    // Calculate progress metrics
    const progressData = {
      overview: {
        totalClasses: enrollments.length,
        completedClasses: enrollments.filter((e) => e.status === "COMPLETED")
          .length,
        activeClasses: enrollments.filter((e) => e.status === "ACTIVE").length,
      },
      assignments: {
        total: assignments.length,
        submitted: assignments.filter((a) => a.submissions.length > 0).length,
        graded: assignments.filter(
          (a) =>
            a.submissions.length > 0 && a.submissions[0].status === "GRADED"
        ).length,
        pending: assignments.filter((a) => a.submissions.length === 0).length,
        averageScore: calculateAverageScore(
          assignments
            .filter(
              (a) => a.submissions.length > 0 && a.submissions[0].score !== null
            )
            .map((a) => ({
              score: a.submissions[0].score!,
              maxPoints: a.maxPoints,
            }))
        ),
      },
      quizzes: {
        total: quizzes.length,
        attempted: quizzes.filter((q) => q.attempts.length > 0).length,
        notAttempted: quizzes.filter((q) => q.attempts.length === 0).length,
        averageScore: calculateQuizAverageScore(
          quizzes
            .filter(
              (q) => q.attempts.length > 0 && q.attempts[0].score !== null
            )
            .map((q) => q.attempts[0].score!)
        ),
      },
      liveClasses: {
        total: liveClasses.length,
        upcoming: liveClasses.filter(
          (lc) => new Date(lc.scheduledAt) > new Date()
        ).length,
        past: liveClasses.filter((lc) => new Date(lc.scheduledAt) <= new Date())
          .length,
      },
      classSummaries: enrollments.map((enrollment) => {
        const classAssignments = assignments.filter(
          (a) => a.classId === enrollment.classId
        );
        const classQuizzes = quizzes.filter(
          (q) => q.classId === enrollment.classId
        );

        return {
          classId: enrollment.classId,
          className: enrollment.class.name,
          subject: enrollment.class.subject,
          gradeLevel: enrollment.class.gradeLevel,
          tutorName: enrollment.class.tutor.user.name,
          enrollmentStatus: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          assignments: {
            total: classAssignments.length,
            submitted: classAssignments.filter((a) => a.submissions.length > 0)
              .length,
            averageScore: calculateAverageScore(
              classAssignments
                .filter(
                  (a) =>
                    a.submissions.length > 0 && a.submissions[0].score !== null
                )
                .map((a) => ({
                  score: a.submissions[0].score!,
                  maxPoints: a.maxPoints,
                }))
            ),
          },
          quizzes: {
            total: classQuizzes.length,
            attempted: classQuizzes.filter((q) => q.attempts.length > 0).length,
            averageScore: calculateQuizAverageScore(
              classQuizzes
                .filter(
                  (q) => q.attempts.length > 0 && q.attempts[0].score !== null
                )
                .map((q) => q.attempts[0].score!)
            ),
          },
        };
      }),
      recentActivity: await getRecentActivity(student.id, classIds),
    };

    return NextResponse.json(progressData);
  } catch (error: any) {
    console.error("Error fetching student progress:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to calculate average score
function calculateAverageScore(
  scores: { score: number; maxPoints: number }[]
): number | null {
  if (scores.length === 0) return null;

  const totalPercentage = scores.reduce((sum, item) => {
    const percentage = (item.score / item.maxPoints) * 100;
    return sum + percentage;
  }, 0);

  return Math.round(totalPercentage / scores.length);
}

// Helper function to calculate quiz average
function calculateQuizAverageScore(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round(sum / scores.length);
}

// Helper function to get recent activity
async function getRecentActivity(studentId: string, classIds: string[]) {
  // Get recent submissions
  const recentSubmissions = await prisma.assignmentSubmission.findMany({
    where: {
      studentId,
    },
    include: {
      assignment: {
        select: {
          title: true,
          class: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      submittedAt: "desc",
    },
    take: 5,
  });

  // Get recent quiz attempts
  const recentAttempts = await prisma.quizAttempt.findMany({
    where: {
      studentId,
    },
    include: {
      quiz: {
        select: {
          title: true,
          class: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      submittedAt: "desc",
    },
    take: 5,
  });

  // Combine and sort by date
  const activities = [
    ...recentSubmissions.map((sub) => ({
      type: "assignment" as const,
      title: sub.assignment.title,
      className: sub.assignment.class.name,
      date: sub.submittedAt,
      status: sub.status,
      score: sub.score,
    })),
    ...recentAttempts.map((att) => ({
      type: "quiz" as const,
      title: att.quiz.title,
      className: att.quiz.class.name,
      date: att.submittedAt || att.startedAt,
      score: att.score,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  return activities;
}
