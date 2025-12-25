"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertBanner, Alert } from "@/components/ui/alert-banner";
import {
  BookOpen,
  Users,
  ClipboardList,
  FileQuestion,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format, formatDistanceToNow, addMinutes } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Stats {
  totalClasses: number;
  totalStudents: number;
  pendingGrading: number;
  activeQuizzes: number;
}

interface UpcomingLiveClass {
  id: string;
  title: string;
  scheduledAt: string;
  duration: number;
  className: string;
  enrollmentCount: number;
}

interface PendingGrading {
  id: string;
  assignmentTitle: string;
  className: string;
  submittedCount: number;
  totalEnrollment: number;
  deadline: string;
  isUrgent: boolean;
}

interface RecentActivity {
  id: string;
  type: "submission" | "quiz" | "forum";
  studentName: string;
  action: string;
  className: string;
  timestamp: string;
}

interface DashboardData {
  tutorName: string;
  stats: Stats;
  upcomingLiveClasses: UpcomingLiveClass[];
  pendingGrading: PendingGrading[];
  recentActivity: RecentActivity[];
}

interface TutorDashboardClientProps {
  alerts: Alert[];
}

export default function TutorDashboardClient({
  alerts,
}: TutorDashboardClientProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tutor/dashboard");
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        toast.error(result.error || "Failed to load dashboard");
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const tomorrowOnly = new Date(
      tomorrow.getFullYear(),
      tomorrow.getMonth(),
      tomorrow.getDate()
    );

    if (dateOnly.getTime() === todayOnly.getTime()) return "Today";
    if (dateOnly.getTime() === tomorrowOnly.getTime()) return "Tomorrow";
    return format(date, "MMM dd", { locale: localeId });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Failed to load dashboard data</p>
        <Button onClick={fetchDashboardData}>Try Again</Button>
      </div>
    );
  }

  const statsConfig = [
    {
      title: "Total Classes",
      value: data.stats.totalClasses.toString(),
      icon: BookOpen,
      trend: `${data.stats.totalClasses} active classes`,
    },
    {
      title: "Total Students",
      value: data.stats.totalStudents.toString(),
      icon: Users,
      trend: `Actively enrolled`,
    },
    {
      title: "Pending Grading",
      value: data.stats.pendingGrading.toString(),
      icon: ClipboardList,
      trend: "Needs grading",
    },
    {
      title: "Active Quizzes",
      value: data.stats.activeQuizzes.toString(),
      icon: FileQuestion,
      trend: "Currently running",
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Good night";
  };

  const getEmoji = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "☀️";
    if (hour >= 12 && hour < 17) return "🌤️";
    if (hour >= 17 && hour < 21) return "🌆";
    return "🌙";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <span>{getGreeting()},</span>
          <span className="text-primary">{data.tutorName.split(" ")[0]}</span>
          <span>{getEmoji()}</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your classes and help your students succeed
        </p>
      </div>

      {/* Alert Banners */}
      <AlertBanner alerts={alerts} storageKey="tutor_alerts" />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsConfig.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Live Classes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Kelas Mendatang</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tutor/liveClasses">Lihat Semua</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.upcomingLiveClasses.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Tidak ada live class yang dijadwalkan
              </p>
            ) : (
              data.upcomingLiveClasses.map((cls) => {
                const scheduledAt = new Date(cls.scheduledAt);
                const endTime = addMinutes(scheduledAt, cls.duration);

                return (
                  <div
                    key={cls.id}
                    className="flex items-start gap-4 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">{cls.title}</h4>
                        <Badge variant="outline">Live Class</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getDateLabel(cls.scheduledAt)} •{" "}
                        {format(scheduledAt, "HH:mm")} -{" "}
                        {format(endTime, "HH:mm")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cls.enrollmentCount} siswa terdaftar
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Pending Grading */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Perlu Dinilai</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tutor/grading">Lihat Semua</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.pendingGrading.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Semua tugas sudah dinilai! 🎉
              </p>
            ) : (
              data.pendingGrading.map((item) => {
                const completionRate =
                  item.totalEnrollment > 0
                    ? (item.submittedCount / item.totalEnrollment) * 100
                    : 0;

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-muted/50 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">
                            {item.assignmentTitle}
                          </h4>
                          {/* Enhancement 1: Urgent Badge */}
                          {item.isUrgent && (
                            <Badge variant="destructive" className="text-xs">
                              Urgent
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.className}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {item.submittedCount}/{item.totalEnrollment}
                      </Badge>
                    </div>

                    {/* Enhancement 2: Progress Bar */}
                    <div className="space-y-1">
                      <Progress value={completionRate} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {Math.round(completionRate)}% siswa sudah mengumpulkan
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Deadline:{" "}
                        {format(new Date(item.deadline), "dd MMM yyyy", {
                          locale: localeId,
                        })}
                      </span>
                      {/* Enhancement 3: Quick Action Button */}
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/tutor/grading?highlight=${item.id}`}>
                          Nilai Sekarang
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aktivitas Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada aktivitas terbaru
            </p>
          ) : (
            <div className="space-y-4">
              {data.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 pb-4 border-b last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {activity.studentName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.action}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {activity.className}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                          locale: localeId,
                        })}
                      </span>
                    </div>
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
