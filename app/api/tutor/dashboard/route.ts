import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { addDays } from "date-fns";

/**
 * GET /api/tutor/dashboard
 * Aggregate dashboard overview data for tutor
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
            sections: { select: { id: true } },
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

    const tutorId = dbUser.tutorProfile.id;
    const sectionIds = dbUser.tutorProfile.sections.map((s) => s.id);

    if (sectionIds.length === 0) {
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
      totalSections,
      totalStudents,
      pendingGradingCount,
      activeQuizzes,
      upcomingLiveClasses,
      pendingAssignments,
      recentSubmissions,
      recentQuizAttempts,
      recentForumPosts,
    ] = await Promise.all([
      // Total sections
      db.classSection.count({ where: { tutorId } }),

      // Total students (unique enrollments)
      db.enrollment.count({
        where: {
          sectionId: { in: sectionIds },
          status: { in: ["ACTIVE", "EXPIRED"] },
        },
      }),

      // Pending grading (submitted but not graded)
      db.assignmentSubmission.count({
        where: {
          assignment: { sectionId: { in: sectionIds } },
          status: "SUBMITTED",
        },
      }),

      // Active quizzes
      db.quiz.count({
        where: {
          sectionId: { in: sectionIds },
          status: "PUBLISHED",
        },
      }),

      // Upcoming live classes (next 3)
      db.liveClass.findMany({
        where: {
          sectionId: { in: sectionIds },
          scheduledAt: { gt: new Date() },
        },
        include: {
          section: {
            select: {
              sectionLabel: true,
              template: { select: { name: true } },
              _count: {
                select: {
                  enrollments: {
                    where: { status: { in: ["ACTIVE", "EXPIRED"] } },
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
          sectionId: { in: sectionIds },
          status: "PUBLISHED",
          dueDate: { gte: new Date() },
          submissions: {
            some: { status: "SUBMITTED" },
          },
        },
        include: {
          section: {
            select: {
              sectionLabel: true,
              template: { select: { name: true } },
              _count: {
                select: {
                  enrollments: {
                    where: { status: { in: ["ACTIVE", "EXPIRED"] } },
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
          assignment: { sectionId: { in: sectionIds } },
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
              section: {
                select: {
                  sectionLabel: true,
                  template: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
        take: 5,
      }),

      // Recent quiz attempts (last 5)
      db.quizAttempt.findMany({
        where: {
          quiz: { sectionId: { in: sectionIds } },
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
              section: {
                select: {
                  sectionLabel: true,
                  template: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
        take: 5,
      }),

      // Recent forum posts (last 5)
      db.forumPost.findMany({
        where: {
          thread: { sectionId: { in: sectionIds } },
        },
        include: {
          author: { select: { name: true } },
          thread: {
            select: {
              title: true,
              section: {
                select: {
                  sectionLabel: true,
                  template: { select: { name: true } },
                },
              },
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
      className: `${lc.section.template.name} - ${lc.section.sectionLabel}`,
      enrollmentCount: lc.section._count.enrollments,
    }));

    // Transform pending grading
    const transformedPendingGrading = pendingAssignments.map((assignment) => ({
      id: assignment.id,
      assignmentTitle: assignment.title,
      className: `${assignment.section.template.name} - ${assignment.section.sectionLabel}`,
      submittedCount: assignment._count.submissions,
      totalEnrollment: assignment.section._count.enrollments,
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
        className: `${s.assignment.section.template.name} - ${s.assignment.section.sectionLabel}`,
        timestamp: s.submittedAt,
      })),
      ...recentQuizAttempts.map((a) => ({
        id: `quiz-${a.id}`,
        type: "quiz",
        studentName: a.student.user.name,
        action: `Menyelesaikan ${a.quiz.title}`,
        className: `${a.quiz.section.template.name} - ${a.quiz.section.sectionLabel}`,
        timestamp: a.submittedAt,
      })),
      ...recentForumPosts.map((p) => ({
        id: `forum-${p.id}`,
        type: "forum",
        studentName: p.author.name,
        action: `Bertanya di forum: ${p.thread.title}`,
        className: `${p.thread.section.template.name} - ${p.thread.section.sectionLabel}`,
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
        totalClasses: totalSections,
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
