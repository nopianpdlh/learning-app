/**
 * Gradebook API
 * GET /api/classes/[id]/gradebook - Get gradebook for a section
 * Updated to use section-based system
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { calculateGradeBreakdown, GradeItem } from "@/lib/gradebook";

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

    // Verify access to this section
    const sectionData = await prisma.classSection.findUnique({
      where: { id: sectionId },
      include: {
        template: true,
      },
    });

    if (!sectionData) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Check permissions
    const isTutor =
      dbUser.role === "TUTOR" &&
      dbUser.tutorProfile?.id === sectionData.tutorId;
    const isAdmin = dbUser.role === "ADMIN";
    const isStudent = dbUser.role === "STUDENT";

    if (!isTutor && !isAdmin && !isStudent) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If student, only return their own grades
    if (isStudent) {
      if (!dbUser.studentProfile) {
        return NextResponse.json(
          { error: "Student profile not found" },
          { status: 404 }
        );
      }

      // Verify student is enrolled
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: dbUser.studentProfile.id,
          sectionId: sectionId,
          status: { in: ["ACTIVE", "EXPIRED"] },
        },
      });

      if (!enrollment) {
        return NextResponse.json(
          { error: "Not enrolled in this section" },
          { status: 403 }
        );
      }

      // Get student's graded assignments
      const assignments = await prisma.assignment.findMany({
        where: { sectionId: sectionId, status: "PUBLISHED" },
        include: {
          submissions: {
            where: {
              studentId: dbUser.studentProfile.id,
              status: "GRADED",
            },
          },
        },
      });

      const assignmentGrades: GradeItem[] = assignments
        .filter(
          (a) => a.submissions.length > 0 && a.submissions[0].score !== null
        )
        .map((a) => ({
          id: a.id,
          title: a.title,
          score: a.submissions[0].score!,
          maxPoints: a.maxPoints,
          type: "assignment" as const,
          gradedAt: a.submissions[0].gradedAt!,
        }));

      // Get student's completed quizzes
      const quizzes = await prisma.quiz.findMany({
        where: { sectionId: sectionId, status: "PUBLISHED" },
        include: {
          attempts: {
            where: {
              studentId: dbUser.studentProfile.id,
              submittedAt: { not: null },
            },
          },
          questions: {
            select: {
              points: true,
            },
          },
        },
      });

      const quizGrades: GradeItem[] = quizzes
        .filter((q) => q.attempts.length > 0 && q.attempts[0].score !== null)
        .map((q) => {
          const totalPoints = q.questions.reduce(
            (sum, question) => sum + question.points,
            0
          );
          return {
            id: q.id,
            title: q.title,
            score: q.attempts[0].score!,
            maxPoints: totalPoints,
            type: "quiz" as const,
            gradedAt: q.attempts[0].submittedAt!,
          };
        });

      const breakdown = calculateGradeBreakdown(assignmentGrades, quizGrades);

      return NextResponse.json({
        student: {
          id: dbUser.studentProfile.id,
          name: dbUser.name,
          email: dbUser.email,
          avatar: dbUser.avatar,
        },
        breakdown,
      });
    }

    // Tutor/Admin: Get gradebook for all students
    const enrollments = await prisma.enrollment.findMany({
      where: {
        sectionId: sectionId,
        status: { in: ["ACTIVE", "EXPIRED"] },
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    // Get all assignments for this section
    const assignments = await prisma.assignment.findMany({
      where: { sectionId: sectionId, status: "PUBLISHED" },
      include: {
        submissions: {
          where: { status: "GRADED" },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    // Get all quizzes for this section
    const quizzes = await prisma.quiz.findMany({
      where: { sectionId: sectionId, status: "PUBLISHED" },
      include: {
        attempts: {
          where: { submittedAt: { not: null } },
        },
        questions: {
          select: {
            points: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Build gradebook for each student
    const gradebook = await Promise.all(
      enrollments.map(async (enrollment) => {
        const studentId = enrollment.student.id;

        // Get student's graded assignments
        const assignmentGrades: GradeItem[] = assignments
          .filter((a) => {
            const submission = a.submissions.find(
              (s) => s.studentId === studentId
            );
            return submission && submission.score !== null;
          })
          .map((a) => {
            const submission = a.submissions.find(
              (s) => s.studentId === studentId
            )!;
            return {
              id: a.id,
              title: a.title,
              score: submission.score!,
              maxPoints: a.maxPoints,
              type: "assignment" as const,
              gradedAt: submission.gradedAt!,
            };
          });

        // Get student's completed quizzes
        const quizGrades: GradeItem[] = quizzes
          .filter((q) => {
            const attempt = q.attempts.find((a) => a.studentId === studentId);
            return attempt && attempt.score !== null;
          })
          .map((q) => {
            const attempt = q.attempts.find((a) => a.studentId === studentId)!;
            const totalPoints = q.questions.reduce(
              (sum, question) => sum + question.points,
              0
            );
            return {
              id: q.id,
              title: q.title,
              score: attempt.score!,
              maxPoints: totalPoints,
              type: "quiz" as const,
              gradedAt: attempt.submittedAt!,
            };
          });

        const breakdown = calculateGradeBreakdown(assignmentGrades, quizGrades);

        return {
          student: {
            id: enrollment.student.id,
            name: enrollment.student.user.name,
            email: enrollment.student.user.email,
            avatar: enrollment.student.user.avatar,
          },
          breakdown,
        };
      })
    );

    // Sort by overall percentage descending
    gradebook.sort(
      (a, b) => b.breakdown.overall.percentage - a.breakdown.overall.percentage
    );

    return NextResponse.json({
      class: {
        id: sectionData.id,
        name: `${sectionData.template.name} - Section ${sectionData.sectionLabel}`,
      },
      assignments: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        maxPoints: a.maxPoints,
        dueDate: a.dueDate,
      })),
      quizzes: quizzes.map((q) => {
        const totalPoints = q.questions.reduce(
          (sum, question) => sum + question.points,
          0
        );
        return {
          id: q.id,
          title: q.title,
          maxPoints: totalPoints,
          createdAt: q.createdAt,
        };
      }),
      students: gradebook,
    });
  } catch (error: any) {
    console.error("Error fetching gradebook:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
