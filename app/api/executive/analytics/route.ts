import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/executive/analytics
 * Get comprehensive analytics data for executive dashboard
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is EXECUTIVE
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== "EXECUTIVE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get key metrics
    const [
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      totalStudents,
      thisMonthStudents,
      lastMonthStudents,
      totalSections,
      activeSections,
      totalEnrollments,
      thisMonthEnrollments,
      lastMonthEnrollments,
    ] = await Promise.all([
      // Total revenue (all time)
      db.payment.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
      // This month revenue
      db.payment.aggregate({
        where: { status: "PAID", createdAt: { gte: thisMonthStart } },
        _sum: { amount: true },
      }),
      // Last month revenue
      db.payment.aggregate({
        where: {
          status: "PAID",
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { amount: true },
      }),
      // Total students
      db.user.count({ where: { role: "STUDENT" } }),
      // Students registered this month
      db.user.count({
        where: { role: "STUDENT", createdAt: { gte: thisMonthStart } },
      }),
      // Students registered last month
      db.user.count({
        where: {
          role: "STUDENT",
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
      // Total sections
      db.classSection.count(),
      // Active sections
      db.classSection.count({ where: { status: "ACTIVE" } }),
      // Total enrollments
      db.enrollment.count({ where: { status: "ACTIVE" } }),
      // This month enrollments
      db.enrollment.count({
        where: { enrolledAt: { gte: thisMonthStart } },
      }),
      // Last month enrollments
      db.enrollment.count({
        where: {
          enrolledAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
    ]);

    // Calculate growth rates
    const revenueGrowth = lastMonthRevenue._sum.amount
      ? (((thisMonthRevenue._sum.amount || 0) - lastMonthRevenue._sum.amount) /
          lastMonthRevenue._sum.amount) *
        100
      : 0;

    const studentGrowth = lastMonthStudents
      ? ((thisMonthStudents - lastMonthStudents) / lastMonthStudents) * 100
      : 0;

    const enrollmentGrowth = lastMonthEnrollments
      ? ((thisMonthEnrollments - lastMonthEnrollments) / lastMonthEnrollments) *
        100
      : 0;

    // Get monthly data for charts (last 12 months)
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const [monthRevenue, monthEnrollments] = await Promise.all([
        db.payment.aggregate({
          where: {
            status: "PAID",
            createdAt: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        }),
        db.enrollment.count({
          where: {
            enrolledAt: { gte: monthStart, lte: monthEnd },
          },
        }),
      ]);

      monthlyData.push({
        month: monthStart.toLocaleString("id-ID", {
          month: "short",
          year: "2-digit",
        }),
        revenue: monthRevenue._sum.amount || 0,
        enrollments: monthEnrollments,
      });
    }

    // Get revenue by program
    const revenueByProgram = await db.payment.groupBy({
      by: ["enrollmentId"],
      where: { status: "PAID" },
      _sum: { amount: true },
    });

    // Map to program names
    const enrollmentIds = revenueByProgram.map((r) => r.enrollmentId);
    const enrollments = await db.enrollment.findMany({
      where: { id: { in: enrollmentIds } },
      include: { section: { include: { template: true } } },
    });

    const programRevenueMap: Record<string, number> = {};
    revenueByProgram.forEach((r) => {
      const enrollment = enrollments.find((e) => e.id === r.enrollmentId);
      const programName = enrollment?.section.template.name || "Unknown";
      programRevenueMap[programName] =
        (programRevenueMap[programName] || 0) + (r._sum.amount || 0);
    });

    const revenueByProgramData = Object.entries(programRevenueMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Get tutor performance summary
    const tutorPerformance = await db.tutorProfile.findMany({
      include: {
        user: { select: { name: true, avatar: true } },
        sections: {
          include: {
            enrollments: { where: { status: "ACTIVE" } },
            _count: {
              select: { materials: true, assignments: true, quizzes: true },
            },
          },
        },
      },
    });

    const tutorSummary = tutorPerformance
      .map((tutor) => ({
        id: tutor.id,
        name: tutor.user.name,
        avatar: tutor.user.avatar,
        sections: tutor.sections.length,
        students: tutor.sections.reduce(
          (sum, s) => sum + s.enrollments.length,
          0
        ),
        materials: tutor.sections.reduce(
          (sum, s) => sum + s._count.materials,
          0
        ),
      }))
      .sort((a, b) => b.students - a.students)
      .slice(0, 5);

    return NextResponse.json({
      metrics: {
        totalRevenue: totalRevenue._sum.amount || 0,
        thisMonthRevenue: thisMonthRevenue._sum.amount || 0,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        totalStudents,
        thisMonthStudents,
        studentGrowth: Math.round(studentGrowth * 10) / 10,
        activeSections,
        totalSections,
        activeEnrollments: totalEnrollments,
        thisMonthEnrollments,
        enrollmentGrowth: Math.round(enrollmentGrowth * 10) / 10,
      },
      monthlyData,
      revenueByProgram: revenueByProgramData,
      tutorSummary,
      comparison: {
        lastMonthRevenue: lastMonthRevenue._sum.amount || 0,
        lastMonthStudents,
        lastMonthEnrollments,
      },
    });
  } catch (error) {
    console.error("GET /api/executive/analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
