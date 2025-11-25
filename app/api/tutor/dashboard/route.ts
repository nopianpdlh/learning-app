import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { addDays } from "date-fns";

/**
 * GET /api/tutor/dashboard
 * Aggregate dashboard overview data for tutor
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
        tutorProfile: true,
      },
    });

    if (!dbUser || dbUser.role !== "TUTOR" || !dbUser.tutorProfile) {
      return NextResponse.json(
        { error: "Forbidden: Tutor only" },
        { status: 403 }
      );
    }

    const tutorId = dbUser.tutorProfile.id;

    // Get all tutor's classes
    const tutorClasses = await db.class.findMany({
      where: { tutorId },
      select: { id: true },
    });

    const classIds = tutorClasses.map((c) => c.id);

    if (classIds.length === 0) {
      return NextResponse.json({
        tutorName: dbUser.name,
        stats: {
          totalClasses: 0,
          totalStudents: 0,
          pendingGrading: 0,
          activeQuizzes: 0,
        },
        upcomingLiveClasses: [],
        pendingGrading: [],
        recentActivity: [],
      });
    }

    // Parallel queries for stats
    const [
      totalClasses,
      totalStudents,
      pendingGradingCount,
      activeQuizzes,
      upcomingLiveClasses,
      pendingAssignments,
      recentSubmissions,
      recentQuizAttempts,
      recentForumPosts,
    ] = await Promise.all([
      // Total classes
      db.class.count({ where: { tutorId } }),

      // Total students (unique enrollments)
      db.enrollment.count({
        where: {
          classId: { in: classIds },
          status: { in: ["PAID", "ACTIVE"] },
        },
      }),

      // Pending grading (submitted but not graded)
      db.assignmentSubmission.count({
        where: {
          assignment: { classId: { in: classIds } },
          status: "SUBMITTED",
        },
      }),

      // Active quizzes
      db.quiz.count({
        where: {
          classId: { in: classIds },
          status: "PUBLISHED",
        },
      }),

      // Upcoming live classes (next 3)
      db.liveClass.findMany({
        where: {
          classId: { in: classIds },
          scheduledAt: { gt: new Date() },
        },
        include: {
          class: {
            select: {
              name: true,
              _count: {
                select: {
                  enrollments: {
                    where: { status: { in: ["PAID", "ACTIVE"] } },
                  },
                },
              },
            },
          },
        },
        orderBy: { scheduledAt: "asc" },
        take: 3,
      }),

      // Assignments with pending submissions (top 3 by dueDate)
      db.assignment.findMany({
        where: {
          classId: { in: classIds },
          status: "PUBLISHED",
          dueDate: { gte: new Date() },
          submissions: {
            some: { status: "SUBMITTED" },
          },
        },
        include: {
          class: {
            select: {
              name: true,
              _count: {
                select: {
                  enrollments: {
                    where: { status: { in: ["PAID", "ACTIVE"] } },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              submissions: {
                where: { status: "SUBMITTED" },
              },
            },
          },
        },
        orderBy: { dueDate: "asc" },
        take: 3,
      }),

      // Recent submissions (last 5)
      db.assignmentSubmission.findMany({
        where: {
          assignment: { classId: { in: classIds } },
        },
        include: {
          student: {
            include: {
              user: { select: { name: true } },
            },
          },
          assignment: {
            select: {
              title: true,
              class: { select: { name: true } },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
        take: 5,
      }),

      // Recent quiz attempts (last 5)
      db.quizAttempt.findMany({
        where: {
          quiz: { classId: { in: classIds } },
          submittedAt: { not: null },
        },
        include: {
          student: {
            include: {
              user: { select: { name: true } },
            },
          },
          quiz: {
            select: {
              title: true,
              class: { select: { name: true } },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
        take: 5,
      }),

      // Recent forum posts (last 5)
      db.forumPost.findMany({
        where: {
          thread: { classId: { in: classIds } },
        },
        include: {
          author: { select: { name: true } },
          thread: {
            select: {
              title: true,
              class: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // Transform upcoming live classes
    const transformedLiveClasses = upcomingLiveClasses.map((lc) => ({
      id: lc.id,
      title: lc.title,
      scheduledAt: lc.scheduledAt.toISOString(),
      duration: lc.duration,
      className: lc.class.name,
      enrollmentCount: lc.class._count.enrollments,
    }));

    // Transform pending grading
    const transformedPendingGrading = pendingAssignments.map((assignment) => ({
      id: assignment.id,
      assignmentTitle: assignment.title,
      className: assignment.class.name,
      submittedCount: assignment._count.submissions,
      totalEnrollment: assignment.class._count.enrollments,
      deadline: assignment.dueDate.toISOString(),
      isUrgent: assignment.dueDate < addDays(new Date(), 2), // Less than 2 days
    }));

    // Combine and sort recent activities
    const activities: any[] = [
      ...recentSubmissions.map((s) => ({
        id: `sub-${s.id}`,
        type: "submission",
        studentName: s.student.user.name,
        action: `Mengumpulkan ${s.assignment.title}`,
        className: s.assignment.class.name,
        timestamp: s.submittedAt,
      })),
      ...recentQuizAttempts.map((a) => ({
        id: `quiz-${a.id}`,
        type: "quiz",
        studentName: a.student.user.name,
        action: `Menyelesaikan ${a.quiz.title}`,
        className: a.quiz.class.name,
        timestamp: a.submittedAt,
      })),
      ...recentForumPosts.map((p) => ({
        id: `forum-${p.id}`,
        type: "forum",
        studentName: p.author.name,
        action: `Bertanya di forum: ${p.thread.title}`,
        className: p.thread.class.name,
        timestamp: p.createdAt,
      })),
    ];

    // Sort by timestamp and take top 10
    const recentActivity = activities
      .sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 10)
      .map((activity) => ({
        ...activity,
        timestamp: activity.timestamp
          ? activity.timestamp.toISOString()
          : new Date().toISOString(),
      }));

    return NextResponse.json({
      tutorName: dbUser.name,
      stats: {
        totalClasses,
        totalStudents,
        pendingGrading: pendingGradingCount,
        activeQuizzes,
      },
      upcomingLiveClasses: transformedLiveClasses,
      pendingGrading: transformedPendingGrading,
      recentActivity,
    });
  } catch (error) {
    console.error("GET /api/tutor/dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
