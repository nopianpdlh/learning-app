import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  GraduationCap,
  DollarSign,
  TrendingUp,
  Activity,
  UserCheck,
} from "lucide-react";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { EnrollmentChart } from "@/components/charts/EnrollmentChart";
import { db } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

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

  // Get revenue by month (last 6 months)
  const now = new Date();
  const monthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const revenueByMonth = payments
    .filter((p) => p.createdAt >= monthsAgo)
    .reduce((acc, p) => {
      const month = p.createdAt.toLocaleDateString("en-US", { month: "short" });
      acc[month] = (acc[month] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

  const revenueData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const month = date.toLocaleDateString("en-US", { month: "short" });
    return { month, revenue: revenueByMonth[month] || 0 };
  });

  // Get enrollment by month (last 6 months)
  const enrollmentByMonth = enrollments
    .filter((e) => e.enrolledAt >= monthsAgo)
    .reduce((acc, e) => {
      const month = e.enrolledAt.toLocaleDateString("en-US", {
        month: "short",
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const enrollmentData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const month = date.toLocaleDateString("en-US", { month: "short" });
    return { month, students: enrollmentByMonth[month] || 0 };
  });

  return {
    totalStudents,
    totalTutors,
    totalClasses: totalSections,
    totalRevenue,
    revenueData,
    enrollmentData,
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

export default async function AdminDashboard() {
  const stats = await getAdminStats();
  const activities = await getRecentActivities();

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor platform performance and key metrics
        </p>
      </div>

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

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={stats.revenueData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Enrollment (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <EnrollmentChart data={stats.enrollmentData} />
          </CardContent>
        </Card>
      </div>

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
