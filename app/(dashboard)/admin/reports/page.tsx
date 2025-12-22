import { prisma } from "@/lib/db";
import ReportsClient from "@/components/features/admin/ReportsClient";

async function getReportStats() {
  // Total Revenue (Paid payments)
  const totalRevenueResult = await prisma.payment.aggregate({
    where: { status: "PAID" },
    _sum: { amount: true },
  });

  // Active Students
  const activeStudents = await prisma.enrollment.count({
    where: { status: "ACTIVE" },
  });

  // Active Sections
  const activeSections = await prisma.classSection.count({
    where: { status: "ACTIVE" },
  });

  // Completed Meetings
  const completedMeetings = await prisma.scheduledMeeting.count({
    where: { status: "COMPLETED" },
  });

  // Pending Payments
  const pendingPayments = await prisma.payment.count({
    where: { status: "PENDING" },
  });

  // Enrollments by Program
  const enrollmentsByProgram = await prisma.classTemplate.findMany({
    where: { published: true },
    select: {
      name: true,
      _count: {
        select: {
          sections: {
            where: {
              enrollments: {
                some: { status: "ACTIVE" },
              },
            },
          },
        },
      },
    },
    orderBy: {
      sections: {
        _count: "desc",
      },
    },
    take: 10,
  });

  // Count active enrollments per program
  const programEnrollments = await prisma.classTemplate.findMany({
    where: { published: true },
    include: {
      sections: {
        include: {
          _count: {
            select: {
              enrollments: {
                where: { status: "ACTIVE" },
              },
            },
          },
        },
      },
    },
  });

  const enrollmentCounts = programEnrollments
    .map((program) => ({
      name: program.name,
      count: program.sections.reduce(
        (sum, section) => sum + section._count.enrollments,
        0
      ),
    }))
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count);

  // Recent Payments
  const recentPayments = await prisma.payment.findMany({
    where: { status: "PAID" },
    orderBy: { paidAt: "desc" },
    take: 10,
    include: {
      enrollment: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
          section: {
            include: {
              template: true,
            },
          },
        },
      },
    },
  });

  // Monthly Revenue (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyPayments = await prisma.payment.findMany({
    where: {
      status: "PAID",
      paidAt: {
        gte: sixMonthsAgo,
      },
    },
    select: {
      amount: true,
      paidAt: true,
    },
  });

  // Group by month
  const monthlyRevenueMap = new Map<string, number>();
  monthlyPayments.forEach((payment) => {
    if (payment.paidAt) {
      const monthKey = `${payment.paidAt.getFullYear()}-${String(
        payment.paidAt.getMonth() + 1
      ).padStart(2, "0")}`;
      const current = monthlyRevenueMap.get(monthKey) || 0;
      monthlyRevenueMap.set(monthKey, current + payment.amount);
    }
  });

  const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalRevenue: totalRevenueResult._sum.amount || 0,
    activeStudents,
    activeSections,
    completedMeetings,
    pendingPayments,
    monthlyRevenue,
    enrollmentsByProgram: enrollmentCounts,
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      amount: p.amount,
      studentName: p.enrollment.student.user.name,
      programName: p.enrollment.section.template.name,
      paidAt: p.paidAt?.toISOString() || p.createdAt.toISOString(),
    })),
  };
}

export default async function AdminReports() {
  const stats = await getReportStats();

  return <ReportsClient stats={stats} />;
}
