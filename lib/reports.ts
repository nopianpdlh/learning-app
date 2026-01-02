"use server";

import { prisma } from "@/lib/db";
import { PaymentStatus } from "@prisma/client";

export interface RevenueReportData {
  summary: {
    totalRevenue: number;
    transactionCount: number;
    averageTransaction: number;
  };
  payments: {
    id: string;
    studentName: string;
    studentEmail: string;
    programName: string;
    amount: number;
    date: Date;
    status: PaymentStatus;
    paymentMethod: string;
  }[];
}

export async function getRevenueReportData(
  dateFrom: Date,
  dateTo: Date
): Promise<RevenueReportData> {
  // Ensure dateTo includes the entire day
  const adjustedDateTo = new Date(dateTo);
  adjustedDateTo.setHours(23, 59, 59, 999);

  const payments = await prisma.payment.findMany({
    where: {
      status: "PAID",
      paidAt: {
        gte: dateFrom,
        lte: adjustedDateTo,
      },
    },
    include: {
      enrollment: {
        include: {
          student: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          section: {
            include: {
              template: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      paidAt: "desc",
    },
  });

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const transactionCount = payments.length;
  const averageTransaction =
    transactionCount > 0 ? Math.round(totalRevenue / transactionCount) : 0;

  return {
    summary: {
      totalRevenue,
      transactionCount,
      averageTransaction,
    },
    payments: payments.map((p) => ({
      id: p.id,
      studentName: p.enrollment.student.user.name,
      studentEmail: p.enrollment.student.user.email,
      programName: p.enrollment.section.template.name,
      amount: p.amount,
      date: p.paidAt || p.createdAt,
      status: p.status,
      paymentMethod: p.paymentMethod || "Manual",
    })),
  };
}

// Not used in standard revenue but reused in analytics
import { EnrollmentStatus, MeetingStatus } from "@prisma/client";

export interface EnrollmentReportData {
  summary: {
    totalNewEnrollments: number;
    activeEnrollments: number; // Snapshot of current active
  };
  enrollments: {
    id: string;
    studentName: string;
    studentEmail: string;
    programName: string;
    sectionLabel: string;
    enrolledAt: Date;
    status: EnrollmentStatus;
  }[];
}

export async function getEnrollmentReportData(
  dateFrom: Date,
  dateTo: Date
): Promise<EnrollmentReportData> {
  const adjustedDateTo = new Date(dateTo);
  adjustedDateTo.setHours(23, 59, 59, 999);

  const newEnrollments = await prisma.enrollment.findMany({
    where: {
      enrolledAt: {
        gte: dateFrom,
        lte: adjustedDateTo,
      },
    },
    include: {
      student: {
        include: { user: true },
      },
      section: {
        include: { template: true },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const activeEnrollmentsCount = await prisma.enrollment.count({
    where: { status: "ACTIVE" },
  });

  return {
    summary: {
      totalNewEnrollments: newEnrollments.length,
      activeEnrollments: activeEnrollmentsCount,
    },
    enrollments: newEnrollments.map((e) => ({
      id: e.id,
      studentName: e.student.user.name,
      studentEmail: e.student.user.email,
      programName: e.section.template.name,
      sectionLabel: e.section.sectionLabel,
      enrolledAt: e.enrolledAt,
      status: e.status,
    })),
  };
}

export interface ClassAnalyticsData {
  summary: {
    totalSections: number;
    totalRevenue: number;
  };
  sections: {
    id: string;
    programName: string;
    sectionLabel: string;
    tutorName: string;
    totalStudents: number; // Current total
    newStudents: number; // In period
    revenue: number; // In period
  }[];
}

export async function getClassAnalyticsData(
  dateFrom: Date,
  dateTo: Date
): Promise<ClassAnalyticsData> {
  const adjustedDateTo = new Date(dateTo);
  adjustedDateTo.setHours(23, 59, 59, 999);

  // Get active sections or sections created in range?
  // User likely wants performance of ALL sections during this period.
  // We'll fetch sections that are active or have activity.
  const sections = await prisma.classSection.findMany({
    where: {
      status: { not: "ARCHIVED" }, // Focus on non-archived
    },
    include: {
      template: true,
      tutor: { include: { user: true } },
      enrollments: {
        select: {
          id: true,
          enrolledAt: true,
          payment: {
            select: { amount: true, paidAt: true, status: true },
          },
        },
      },
    },
  });

  const analytics = sections.map((section) => {
    // Calculate metrics for this specific period
    const newStudentsInPeriod = section.enrollments.filter(
      (e) => e.enrolledAt >= dateFrom && e.enrolledAt <= adjustedDateTo
    ).length;

    const revenueInPeriod = section.enrollments.reduce((sum, e) => {
      if (
        e.payment?.status === "PAID" &&
        e.payment.paidAt &&
        e.payment.paidAt >= dateFrom &&
        e.payment.paidAt <= adjustedDateTo
      ) {
        return sum + e.payment.amount;
      }
      return sum;
    }, 0);

    return {
      id: section.id,
      programName: section.template.name,
      sectionLabel: section.sectionLabel,
      tutorName: section.tutor.user.name,
      totalStudents: section.enrollments.length,
      newStudents: newStudentsInPeriod,
      revenue: revenueInPeriod,
    };
  });

  // Filter out sections with 0 activity if list is too long?
  // For now keep all active sections to show "0" if no performance.
  // Sort by revenue desc
  analytics.sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = analytics.reduce((sum, s) => sum + s.revenue, 0);

  return {
    summary: {
      totalSections: analytics.length,
      totalRevenue,
    },
    sections: analytics,
  };
}

export interface MeetingReportData {
  summary: {
    totalScheduled: number;
    totalCompleted: number;
    completionRate: number;
  };
  meetings: {
    id: string;
    title: string;
    programName: string;
    sectionLabel: string;
    scheduledAt: Date;
    status: MeetingStatus;
    attendanceCount: number;
  }[];
}

export async function getMeetingReportData(
  dateFrom: Date,
  dateTo: Date
): Promise<MeetingReportData> {
  const adjustedDateTo = new Date(dateTo);
  adjustedDateTo.setHours(23, 59, 59, 999);

  const meetings = await prisma.scheduledMeeting.findMany({
    where: {
      scheduledAt: {
        gte: dateFrom,
        lte: adjustedDateTo,
      },
    },
    include: {
      section: {
        include: { template: true },
      },
      attendance: {
        where: { status: "PRESENT" },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const totalScheduled = meetings.length;
  const totalCompleted = meetings.filter(
    (m) => m.status === "COMPLETED"
  ).length;
  const completionRate =
    totalScheduled > 0
      ? Math.round((totalCompleted / totalScheduled) * 100)
      : 0;

  return {
    summary: {
      totalScheduled,
      totalCompleted,
      completionRate,
    },
    meetings: meetings.map((m) => ({
      id: m.id,
      title: m.title,
      programName: m.section.template.name,
      sectionLabel: m.section.sectionLabel,
      scheduledAt: m.scheduledAt,
      status: m.status,
      attendanceCount: m.attendance.length,
    })),
  };
}
