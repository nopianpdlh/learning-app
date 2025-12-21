import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/tutor/students
 * Fetch all students enrolled in tutor's sections with progress metrics
 * Uses section-based system
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

    // Get user from database with sections
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        tutorProfile: {
          include: {
            sections: {
              select: {
                id: true,
                sectionLabel: true,
                template: { select: { name: true, subject: true } },
              },
            },
          },
        },
      },
    });

    if (!dbUser || dbUser.role !== "TUTOR" || !dbUser.tutorProfile) {
      return NextResponse.json(
        { error: "Forbidden: Tutor only" },
        { status: 403 }
      );
    }

    const tutorSections = dbUser.tutorProfile.sections;

    if (tutorSections.length === 0) {
      return NextResponse.json({
        students: [],
        stats: {
          totalStudents: 0,
          avgClassScore: 0,
          avgCompletionRate: 0,
          totalAssignmentsCompleted: 0,
        },
        classes: [],
      });
    }

    const sectionIds = tutorSections.map((s) => s.id);

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const sectionFilter =
      searchParams.get("classId") || searchParams.get("sectionId");

    // Build where clause for enrollments
    const enrollmentWhere: any = {
      sectionId: sectionFilter || { in: sectionIds },
      status: { in: ["ACTIVE", "EXPIRED"] },
    };

    // Fetch all enrollments for tutor's sections
    const enrollments = await db.enrollment.findMany({
      where: enrollmentWhere,
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        section: {
          select: {
            id: true,
            sectionLabel: true,
            template: { select: { name: true, subject: true } },
          },
        },
      },
    });

    // Transform sections for client compatibility
    const classes = tutorSections.map((s) => ({
      id: s.id,
      name: `${s.template.name} - ${s.sectionLabel}`,
      subject: s.template.subject,
    }));

    if (enrollments.length === 0) {
      return NextResponse.json({
        students: [],
        stats: {
          totalStudents: 0,
          avgClassScore: 0,
          avgCompletionRate: 0,
          totalAssignmentsCompleted: 0,
        },
        classes,
      });
    }

    // Get all assignments for the sections
    const assignments = await db.assignment.findMany({
      where: {
        sectionId: { in: sectionIds },
        status: "PUBLISHED",
      },
      select: {
        id: true,
        sectionId: true,
        maxPoints: true,
      },
    });

    // Get all quizzes for the sections
    const quizzes = await db.quiz.findMany({
      where: {
        sectionId: { in: sectionIds },
        status: "PUBLISHED",
      },
      select: {
        id: true,
        sectionId: true,
      },
    });

    // Get all assignment submissions
    const studentIds = enrollments.map((e) => e.studentId);
    const submissions = await db.assignmentSubmission.findMany({
      where: {
        studentId: { in: studentIds },
      },
      select: {
        id: true,
        studentId: true,
        assignmentId: true,
        score: true,
        status: true,
        submittedAt: true,
      },
    });

    // Get all quiz attempts
    const attempts = await db.quizAttempt.findMany({
      where: {
        studentId: { in: studentIds },
      },
      select: {
        id: true,
        studentId: true,
        quizId: true,
        score: true,
        submittedAt: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    // Create maps for quick lookup
    const assignmentMap = new Map(assignments.map((a) => [a.id, a]));
    const submissionsByStudent = new Map<string, typeof submissions>();
    const attemptsByStudent = new Map<string, typeof attempts>();

    submissions.forEach((sub) => {
      if (!submissionsByStudent.has(sub.studentId)) {
        submissionsByStudent.set(sub.studentId, []);
      }
      submissionsByStudent.get(sub.studentId)!.push(sub);
    });

    attempts.forEach((att) => {
      if (!attemptsByStudent.has(att.studentId)) {
        attemptsByStudent.set(att.studentId, []);
      }
      attemptsByStudent.get(att.studentId)!.push(att);
    });

    // Process each enrollment to calculate metrics
    const studentsData = enrollments.map((enrollment) => {
      const studentId = enrollment.studentId;
      const sectionId = enrollment.sectionId;

      // Get assignments and quizzes for this section
      const sectionAssignments = assignments.filter(
        (a) => a.sectionId === sectionId
      );
      const sectionQuizzes = quizzes.filter((q) => q.sectionId === sectionId);

      // Get student's submissions and attempts
      const studentSubmissions = submissionsByStudent.get(studentId) || [];
      const studentAttempts = attemptsByStudent.get(studentId) || [];

      // Filter submissions for this section
      const sectionSubmissions = studentSubmissions.filter((sub) =>
        sectionAssignments.some((a) => a.id === sub.assignmentId)
      );

      // Filter attempts for this section
      const sectionAttempts = studentAttempts.filter((att) =>
        sectionQuizzes.some((q) => q.id === att.quizId)
      );

      // Calculate average score
      const gradedSubmissions = sectionSubmissions.filter(
        (sub) => sub.score !== null && sub.status === "GRADED"
      );

      const scores: number[] = [];

      // Add assignment scores (convert to percentage)
      gradedSubmissions.forEach((sub) => {
        const assignment = assignmentMap.get(sub.assignmentId);
        if (assignment && sub.score !== null) {
          const percentage = (sub.score / assignment.maxPoints) * 100;
          scores.push(percentage);
        }
      });

      // Add quiz scores (already 0-100)
      sectionAttempts.forEach((att) => {
        if (att.score !== null) {
          scores.push(att.score);
        }
      });

      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null;

      // Calculate completion rate
      const totalItems = sectionAssignments.length + sectionQuizzes.length;
      const completedItems =
        sectionSubmissions.filter(
          (sub) => sub.status === "SUBMITTED" || sub.status === "GRADED"
        ).length + sectionAttempts.length;

      const completionRate =
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      // Find latest activity
      const allActivities = [
        ...sectionSubmissions.map((s) => s.submittedAt),
        ...sectionAttempts
          .map((a) => a.submittedAt)
          .filter((d): d is Date => d !== null),
      ].sort((a, b) => b.getTime() - a.getTime());

      const latestActivity = allActivities.length > 0 ? allActivities[0] : null;

      return {
        id: studentId,
        name: enrollment.student.user.name,
        avatar: enrollment.student.user.avatar,
        email: enrollment.student.user.email,
        classId: enrollment.sectionId,
        className: `${enrollment.section.template.name} - ${enrollment.section.sectionLabel}`,
        classSubject: enrollment.section.template.subject,
        avgScore,
        completionRate,
        assignments: {
          total: sectionAssignments.length,
          completed: sectionSubmissions.filter(
            (sub) => sub.status === "SUBMITTED" || sub.status === "GRADED"
          ).length,
          avgScore:
            gradedSubmissions.length > 0
              ? Math.round(
                  gradedSubmissions.reduce((sum, sub) => {
                    const assignment = assignmentMap.get(sub.assignmentId);
                    return assignment && sub.score !== null
                      ? sum + (sub.score / assignment.maxPoints) * 100
                      : sum;
                  }, 0) / gradedSubmissions.length
                )
              : null,
        },
        quizzes: {
          total: sectionQuizzes.length,
          attempted: sectionAttempts.length,
          avgScore:
            sectionAttempts.length > 0 &&
            sectionAttempts.some((a) => a.score !== null)
              ? Math.round(
                  sectionAttempts
                    .filter((a) => a.score !== null)
                    .reduce((sum, att) => sum + (att.score || 0), 0) /
                    sectionAttempts.filter((a) => a.score !== null).length
                )
              : null,
        },
        latestActivity: latestActivity ? latestActivity.toISOString() : null,
        enrolledAt: enrollment.enrolledAt.toISOString(),
      };
    });

    // Calculate aggregate statistics
    const validScores = studentsData.filter((s) => s.avgScore !== null);
    const avgClassScore =
      validScores.length > 0
        ? Math.round(
            validScores.reduce((sum, s) => sum + (s.avgScore || 0), 0) /
              validScores.length
          )
        : 0;

    const avgCompletionRate =
      studentsData.length > 0
        ? Math.round(
            studentsData.reduce((sum, s) => sum + s.completionRate, 0) /
              studentsData.length
          )
        : 0;

    const totalAssignmentsCompleted = studentsData.reduce(
      (sum, s) => sum + s.assignments.completed,
      0
    );

    const stats = {
      totalStudents: studentsData.length,
      avgClassScore,
      avgCompletionRate,
      totalAssignmentsCompleted,
    };

    return NextResponse.json({
      students: studentsData,
      stats,
      classes,
    });
  } catch (error) {
    console.error("GET /api/tutor/students error:", error);
    return NextResponse.json(
      { error: "Failed to fetch students data" },
      { status: 500 }
    );
  }
}
