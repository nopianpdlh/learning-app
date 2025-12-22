import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/student/classes/[id]/overview
 * Get overview data for a specific section dashboard
 * Uses section-based system (id = sectionId)
 */
export async function GET(
  req: NextRequest,
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

    // Check enrollment
    const enrollment = await db.enrollment.findFirst({
      where: {
        studentId,
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

    // Get section data with tutor info
    const section = await db.classSection.findUnique({
      where: { id: sectionId },
      include: {
        template: true,
        tutor: {
          include: {
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

    // Parallel queries for efficiency
    const [
      assignments,
      quizzes,
      materials,
      forumThreads,
      submissions,
      quizAttempts,
      nextLiveClass,
      recentSubmissions,
      recentQuizAttempts,
      recentForumPosts,
    ] = await Promise.all([
      // Get all assignments
      db.assignment.findMany({
        where: { sectionId, status: "PUBLISHED" },
        select: { id: true },
      }),

      // Get all quizzes
      db.quiz.findMany({
        where: { sectionId, status: "PUBLISHED" },
        select: { id: true },
      }),

      // Get materials count
      db.material.count({ where: { sectionId } }),

      // Get forum threads count
      db.forumThread.count({ where: { sectionId } }),

      // Get student's submissions
      db.assignmentSubmission.findMany({
        where: {
          studentId,
          assignment: { sectionId },
        },
        select: { id: true, assignmentId: true, status: true, score: true },
      }),

      // Get student's quiz attempts
      db.quizAttempt.findMany({
        where: {
          studentId,
          quiz: { sectionId },
          submittedAt: { not: null },
        },
        select: { id: true, quizId: true, score: true },
      }),

      // Get next scheduled meeting
      db.scheduledMeeting.findFirst({
        where: {
          sectionId,
          scheduledAt: { gt: new Date() },
          status: { not: "CANCELLED" },
        },
        orderBy: { scheduledAt: "asc" },
        select: {
          id: true,
          title: true,
          scheduledAt: true,
          meetingUrl: true,
        },
      }),

      // Recent submissions (for activities)
      db.assignmentSubmission.findMany({
        where: {
          studentId,
          assignment: { sectionId },
        },
        include: {
          assignment: {
            select: { title: true },
          },
        },
        orderBy: { submittedAt: "desc" },
        take: 3,
      }),

      // Recent quiz attempts (for activities)
      db.quizAttempt.findMany({
        where: {
          studentId,
          quiz: { sectionId },
          submittedAt: { not: null },
        },
        include: {
          quiz: {
            select: { title: true },
          },
        },
        orderBy: { submittedAt: "desc" },
        take: 3,
      }),

      // Recent forum posts (for activities)
      db.forumPost.findMany({
        where: {
          authorId: user.id,
          thread: { sectionId },
        },
        include: {
          thread: {
            select: { title: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);

    // Calculate progress
    const totalAssignments = assignments.length;
    const totalQuizzes = quizzes.length;
    const completedAssignments = submissions.length;
    const completedQuizzes = quizAttempts.length;

    const totalItems = totalAssignments + totalQuizzes;
    const completedItems = completedAssignments + completedQuizzes;
    const overallProgress =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Calculate pending assignments
    const submittedAssignmentIds = new Set(
      submissions.map((s) => s.assignmentId)
    );
    const pendingAssignments = assignments.filter(
      (a) => !submittedAssignmentIds.has(a.id)
    ).length;

    // Available quizzes (not attempted yet)
    const attemptedQuizIds = new Set(quizAttempts.map((a) => a.quizId));
    const availableQuizzes = quizzes.filter(
      (q) => !attemptedQuizIds.has(q.id)
    ).length;

    // Calculate average score
    const allScores = [
      ...submissions.filter((s) => s.score !== null).map((s) => s.score!),
      ...quizAttempts.filter((a) => a.score !== null).map((a) => a.score!),
    ];
    const avgScore =
      allScores.length > 0
        ? Math.round(
            allScores.reduce((sum, s) => sum + s, 0) / allScores.length
          )
        : null;

    // Combine recent activities
    const activities = [
      ...recentSubmissions.map((s) => ({
        id: `sub-${s.id}`,
        type: "submission" as const,
        action: `Mengumpulkan tugas: ${s.assignment.title}`,
        timestamp: s.submittedAt,
      })),
      ...recentQuizAttempts.map((a) => ({
        id: `quiz-${a.id}`,
        type: "quiz" as const,
        action: `Menyelesaikan kuis: ${a.quiz.title}`,
        timestamp: a.submittedAt,
      })),
      ...recentForumPosts.map((p) => ({
        id: `forum-${p.id}`,
        type: "forum" as const,
        action: `Posting di forum: ${p.thread.title}`,
        timestamp: p.createdAt,
      })),
    ]
      .sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 5)
      .map((activity) => ({
        ...activity,
        timestamp: activity.timestamp
          ? activity.timestamp.toISOString()
          : new Date().toISOString(),
      }));

    return NextResponse.json({
      class: {
        id: section.id,
        name: `${section.template.name} - Section ${section.sectionLabel}`,
        subject: section.template.subject,
        gradeLevel: section.template.gradeLevel,
        tutorName: section.tutor.user.name,
        schedule: null,
        thumbnail: section.template.thumbnail,
      },
      progress: {
        overall: overallProgress,
        assignments: {
          completed: completedAssignments,
          total: totalAssignments,
        },
        quizzes: {
          completed: completedQuizzes,
          total: totalQuizzes,
        },
      },
      stats: {
        materialsCount: materials,
        pendingAssignments,
        availableQuizzes,
        activeThreads: forumThreads,
        avgScore,
      },
      nextLiveClass: nextLiveClass
        ? {
            id: nextLiveClass.id,
            title: nextLiveClass.title,
            scheduledAt: nextLiveClass.scheduledAt.toISOString(),
            meetingUrl: nextLiveClass.meetingUrl,
          }
        : null,
      recentActivities: activities,
    });
  } catch (error) {
    console.error("GET /api/student/classes/[id]/overview error:", error);
    return NextResponse.json(
      { error: "Failed to fetch class overview" },
      { status: 500 }
    );
  }
}
