import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/student/classes
 * Fetch all classes enrolled by the student with progress tracking
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

    // Get all enrollments for student
    const enrollments = await db.enrollment.findMany({
      where: {
        studentId,
        status: { in: ["PAID", "ACTIVE", "COMPLETED"] }, // Exclude PENDING
      },
      include: {
        class: {
          include: {
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
                    status: { in: ["PAID", "ACTIVE"] },
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

    // Get class IDs
    const classIds = enrollments.map((e) => e.classId);

    // Get all assignments and quizzes for enrolled classes
    const [assignments, quizzes] = await Promise.all([
      db.assignment.findMany({
        where: {
          classId: { in: classIds },
          status: "PUBLISHED",
        },
        select: {
          id: true,
          classId: true,
        },
      }),
      db.quiz.findMany({
        where: {
          classId: { in: classIds },
          status: "PUBLISHED",
        },
        select: {
          id: true,
          classId: true,
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
          submittedAt: { not: null }, // Only completed attempts
        },
        select: {
          quizId: true,
        },
      }),
    ]);

    // Create maps for quick lookup
    const assignmentsByClass = new Map<string, string[]>();
    const quizzesByClass = new Map<string, string[]>();
    const submissionsByAssignment = new Set(
      submissions.map((s) => s.assignmentId)
    );
    const attemptsByQuiz = new Set(attempts.map((a) => a.quizId));

    assignments.forEach((a) => {
      if (!assignmentsByClass.has(a.classId)) {
        assignmentsByClass.set(a.classId, []);
      }
      assignmentsByClass.get(a.classId)!.push(a.id);
    });

    quizzes.forEach((q) => {
      if (!quizzesByClass.has(q.classId)) {
        quizzesByClass.set(q.classId, []);
      }
      quizzesByClass.get(q.classId)!.push(q.id);
    });

    // Transform enrollments to classes with progress
    const classes = enrollments.map((enrollment) => {
      const classId = enrollment.classId;

      // Get assignments and quizzes for this class
      const classAssignments = assignmentsByClass.get(classId) || [];
      const classQuizzes = quizzesByClass.get(classId) || [];

      // Count completed items
      const completedAssignments = classAssignments.filter((id) =>
        submissionsByAssignment.has(id)
      ).length;
      const completedQuizzes = classQuizzes.filter((id) =>
        attemptsByQuiz.has(id)
      ).length;

      // Calculate progress
      const totalItems = classAssignments.length + classQuizzes.length;
      const completedItems = completedAssignments + completedQuizzes;
      const progress =
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      // Determine status
      const status = enrollment.status === "COMPLETED" ? "completed" : "active";

      return {
        id: enrollment.id,
        classId: enrollment.classId,
        title: enrollment.class.name,
        subject: enrollment.class.subject,
        gradeLevel: enrollment.class.gradeLevel,
        tutorName: enrollment.class.tutor.user.name,
        schedule: enrollment.class.schedule,
        thumbnail: enrollment.class.thumbnail,
        studentsCount: enrollment.class._count.enrollments,
        status,
        progress,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        completedAt: enrollment.completedAt?.toISOString() || null,
        // Enhancement 1: Progress details
        progressDetails: {
          assignments: {
            completed: completedAssignments,
            total: classAssignments.length,
          },
          quizzes: {
            completed: completedQuizzes,
            total: classQuizzes.length,
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
