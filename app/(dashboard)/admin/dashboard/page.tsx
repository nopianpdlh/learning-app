import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  GraduationCap,
  DollarSign,
  TrendingUp,
  Activity,
  UserCheck,
} from "lucide-react";
import {
  RevenueEnrollmentChart,
  ChartDataPoint,
} from "@/components/charts/RevenueEnrollmentChart";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import {
  AdminDashboardHeader,
  AdminDashboardCalendar,
} from "./DashboardWidgets";

async function getAdminStats() {
  // Get counts - using sections instead of legacy classes
  const [totalStudents, totalTutors, totalSections, payments, enrollments] =
    await Promise.all([
      db.user.count({ where: { role: "STUDENT" } }),
      db.user.count({ where: { role: "TUTOR" } }),
      db.classSection.count({ where: { status: "ACTIVE" } }),
      db.payment.findMany({
        where: { status: "PAID" },
        select: { amount: true, createdAt: true },
      }),
      db.enrollment.findMany({
        select: { enrolledAt: true },
        orderBy: { enrolledAt: "asc" },
      }),
    ]);

  // Calculate revenue
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  // Get daily data for last 90 days (for the new chart)
  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Process payments into daily data
  const dailyData: Record<string, { revenue: number; enrollments: number }> =
    {};

  // Initialize all days with 0
  for (let i = 0; i < 90; i++) {
    const date = new Date(ninetyDaysAgo);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split("T")[0];
    dailyData[dateKey] = { revenue: 0, enrollments: 0 };
  }

  // Fill in payment data
  payments
    .filter((p) => p.createdAt >= ninetyDaysAgo)
    .forEach((p) => {
      const dateKey = p.createdAt.toISOString().split("T")[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].revenue += p.amount;
      }
    });

  // Fill in enrollment data
  enrollments
    .filter((e) => e.enrolledAt >= ninetyDaysAgo)
    .forEach((e) => {
      const dateKey = e.enrolledAt.toISOString().split("T")[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].enrollments += 1;
      }
    });

  // Convert to array for chart
  const chartData: ChartDataPoint[] = Object.entries(dailyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      enrollments: data.enrollments,
    }));

  return {
    totalStudents,
    totalTutors,
    totalClasses: totalSections,
    totalRevenue,
    chartData,
  };
}

async function getRecentActivities() {
  const [recentEnrollments, recentPayments, recentSections] = await Promise.all(
    [
      db.enrollment.findMany({
        take: 5,
        orderBy: { enrolledAt: "desc" },
        include: {
          student: { include: { user: true } },
          section: {
            include: {
              template: true,
            },
          },
        },
      }),
      db.payment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          enrollment: {
            include: {
              student: { include: { user: true } },
              section: { include: { template: true } },
            },
          },
        },
      }),
      db.classSection.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          tutor: { include: { user: true } },
          template: true,
        },
      }),
    ]
  );

  const activities = [
    ...recentEnrollments.map((e) => ({
      type: "enrollment",
      user: e.student.user.name,
      action: `enrolled in ${e.section.template.name} - Section ${e.section.sectionLabel}`,
      time: formatDistanceToNow(e.enrolledAt, { addSuffix: true, locale: id }),
      date: e.enrolledAt,
    })),
    ...recentPayments.map((p) => ({
      type: "payment",
      user: p.enrollment.student.user.name,
      action: `paid Rp ${p.amount.toLocaleString("id-ID")} for ${
        p.enrollment.section.template.name
      }`,
      time: formatDistanceToNow(p.createdAt, { addSuffix: true, locale: id }),
      date: p.createdAt,
    })),
    ...recentSections.map((s) => ({
      type: "class",
      user: s.tutor.user.name,
      action: `assigned to section: ${s.template.name} - ${s.sectionLabel}`,
      time: formatDistanceToNow(s.createdAt, { addSuffix: true, locale: id }),
      date: s.createdAt,
    })),
  ];

  return activities
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);
}

// Get upcoming live class
async function getUpcomingLiveClass() {
  const now = new Date();
  const nextMeeting = await db.scheduledMeeting.findFirst({
    where: {
      scheduledAt: {
        gt: now,
      },
    },
    orderBy: {
      scheduledAt: "asc",
    },
    include: {
      section: {
        include: {
          template: true,
          tutor: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!nextMeeting) return null;

  // Calculate end time based on scheduledAt + duration (duration is in minutes)
  const endTime = new Date(
    nextMeeting.scheduledAt.getTime() + nextMeeting.duration * 60000
  );

  return {
    id: nextMeeting.id,
    title: nextMeeting.section.template.name,
    sectionLabel: nextMeeting.section.sectionLabel,
    tutorName: nextMeeting.section.tutor.user.name,
    startTime: nextMeeting.scheduledAt.toISOString(),
    endTime: endTime.toISOString(),
    meetingUrl: nextMeeting.meetingUrl || undefined,
  };
}

// Get current admin user name
async function getAdminUserName() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "Admin";

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true },
  });

  return dbUser?.name || user.email?.split("@")[0] || "Admin";
}

export default async function AdminDashboard() {
  const [stats, activities, upcomingLiveClass, userName] = await Promise.all([
    getAdminStats(),
    getRecentActivities(),
    getUpcomingLiveClass(),
    getAdminUserName(),
  ]);

  const statsCards = [
    {
      title: "Total Students",
      value: stats.totalStudents.toLocaleString(),
      icon: Users,
      change: "+12%",
      trend: "up",
    },
    {
      title: "Total Tutors",
      value: stats.totalTutors.toLocaleString(),
      icon: UserCheck,
      change: "+5%",
      trend: "up",
    },
    {
      title: "Active Sections",
      value: stats.totalClasses.toLocaleString(),
      icon: GraduationCap,
      change: "+8%",
      trend: "up",
    },
    {
      title: "Revenue (Total)",
      value: `Rp ${stats.totalRevenue.toLocaleString("id-ID")}`,
      icon: DollarSign,
      change: "+15%",
      trend: "up",
    },
  ];
  return (
    <div className="space-y-6">
      {/* Welcome Message + LiveClass Banner */}
      <AdminDashboardHeader
        userName={userName}
        upcomingLiveClass={upcomingLiveClass}
        calendarEvents={[]}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" suppressHydrationWarning>
                  {stat.value}
                </div>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Combined Chart */}
      <RevenueEnrollmentChart data={stats.chartData} />

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent activities
            </p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span>{" "}
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
