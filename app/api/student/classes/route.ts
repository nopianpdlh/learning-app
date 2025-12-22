import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/student/classes
 * Fetch all sections enrolled by the student with progress tracking
 * Updated to use section-based system
 */
export async function GET(req: NextRequest) {
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
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        studentProfile: true,
      },
    });

    if (!dbUser || dbUser.role !== "STUDENT" || !dbUser.studentProfile) {
      return NextResponse.json(
        { error: "Forbidden: Student only" },
        { status: 403 }
      );
    }

    const studentId = dbUser.studentProfile.id;

    // Get all enrollments for student with section data
    const enrollments = await db.enrollment.findMany({
      where: {
        studentId,
        status: { in: ["ACTIVE", "EXPIRED"] },
      },
      include: {
        section: {
          include: {
            template: {
              select: {
                name: true,
                subject: true,
                gradeLevel: true,
              },
            },
            tutor: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            _count: {
              select: {
                enrollments: {
                  where: {
                    status: { in: ["ACTIVE"] },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: "desc",
      },
    });

    if (enrollments.length === 0) {
      return NextResponse.json({
        classes: [],
        stats: {
          total: 0,
          active: 0,
          completed: 0,
        },
        subjects: [],
      });
    }

    // Get section IDs
    const sectionIds = enrollments.map((e) => e.sectionId);

    // Get all assignments and quizzes for enrolled sections
    const [assignments, quizzes] = await Promise.all([
      db.assignment.findMany({
        where: {
          sectionId: { in: sectionIds },
          status: "PUBLISHED",
        },
        select: {
          id: true,
          sectionId: true,
        },
      }),
      db.quiz.findMany({
        where: {
          sectionId: { in: sectionIds },
          status: "PUBLISHED",
        },
        select: {
          id: true,
          sectionId: true,
        },
      }),
    ]);

    // Get student's submissions and quiz attempts
    const assignmentIds = assignments.map((a) => a.id);
    const quizIds = quizzes.map((q) => q.id);

    const [submissions, attempts] = await Promise.all([
      db.assignmentSubmission.findMany({
        where: {
          studentId,
          assignmentId: { in: assignmentIds },
        },
        select: {
          assignmentId: true,
        },
      }),
      db.quizAttempt.findMany({
        where: {
          studentId,
          quizId: { in: quizIds },
          submittedAt: { not: null },
        },
        select: {
          quizId: true,
        },
      }),
    ]);

    // Create maps for quick lookup
    const assignmentsBySection = new Map<string, string[]>();
    const quizzesBySection = new Map<string, string[]>();
    const submissionsByAssignment = new Set(
      submissions.map((s) => s.assignmentId)
    );
    const attemptsByQuiz = new Set(attempts.map((a) => a.quizId));

    assignments.forEach((a) => {
      if (!assignmentsBySection.has(a.sectionId)) {
        assignmentsBySection.set(a.sectionId, []);
      }
      assignmentsBySection.get(a.sectionId)!.push(a.id);
    });

    quizzes.forEach((q) => {
      if (!quizzesBySection.has(q.sectionId)) {
        quizzesBySection.set(q.sectionId, []);
      }
      quizzesBySection.get(q.sectionId)!.push(q.id);
    });

    // Transform enrollments to classes with progress
    const classes = enrollments.map((enrollment) => {
      const sectionId = enrollment.sectionId;

      // Get assignments and quizzes for this section
      const sectionAssignments = assignmentsBySection.get(sectionId) || [];
      const sectionQuizzes = quizzesBySection.get(sectionId) || [];

      // Count completed items
      const completedAssignments = sectionAssignments.filter((id) =>
        submissionsByAssignment.has(id)
      ).length;
      const completedQuizzes = sectionQuizzes.filter((id) =>
        attemptsByQuiz.has(id)
      ).length;

      // Calculate progress
      const totalItems = sectionAssignments.length + sectionQuizzes.length;
      const completedItems = completedAssignments + completedQuizzes;
      const progress =
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      // Determine status
      const status = enrollment.status === "EXPIRED" ? "completed" : "active";

      return {
        id: enrollment.id,
        classId: enrollment.sectionId,
        title: `${enrollment.section.template.name} - Section ${enrollment.section.sectionLabel}`,
        subject: enrollment.section.template.subject,
        gradeLevel: enrollment.section.template.gradeLevel,
        tutorName: enrollment.section.tutor.user.name,
        schedule: null, // Schedule handled differently now
        thumbnail: null,
        studentsCount: enrollment.section._count.enrollments,
        status,
        progress,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        completedAt: null,
        progressDetails: {
          assignments: {
            completed: completedAssignments,
            total: sectionAssignments.length,
          },
          quizzes: {
            completed: completedQuizzes,
            total: sectionQuizzes.length,
          },
        },
      };
    });

    // Calculate stats
    const stats = {
      total: classes.length,
      active: classes.filter((c) => c.status === "active").length,
      completed: classes.filter((c) => c.status === "completed").length,
    };

    // Extract unique subjects
    const subjects = [...new Set(classes.map((c) => c.subject))].sort();

    return NextResponse.json({
      classes,
      stats,
      subjects,
    });
  } catch (error) {
    console.error("GET /api/student/classes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}
