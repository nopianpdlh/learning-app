"use client";

/**
 * DashboardClient Component
 * Client-side component for student dashboard with real-time data
 */

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  ClipboardList,
  Video,
  Clock,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface UpcomingLiveClass {
  id: string;
  title: string;
  tutorName: string;
  time: string;
  countdown: string;
  meetingUrl: string;
  isLive: boolean;
}

interface MyClass {
  id: string;
  name: string;
  subject: string;
  tutorName: string;
  progress: number;
  thumbnail: string | null;
}

interface PendingAssignment {
  id: string;
  title: string;
  className: string;
  dueDate: string;
  urgent: boolean;
}

interface RecentQuiz {
  id: string;
  title: string;
  className: string;
  score: number;
  maxScore: number;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  type: string;
}

interface Stats {
  activeClassCount: number;
  pendingAssignmentCount: number;
  averageScore: number;
  weeklyProgress: number;
}

interface DashboardClientProps {
  studentName: string;
  stats: Stats;
  upcomingLiveClass: UpcomingLiveClass | null;
  myClasses: MyClass[];
  pendingAssignments: PendingAssignment[];
  recentQuizzes: RecentQuiz[];
  upcomingEvents: UpcomingEvent[];
}

export default function DashboardClient({
  studentName,
  stats,
  upcomingLiveClass,
  myClasses,
  pendingAssignments,
  recentQuizzes,
  upcomingEvents,
}: DashboardClientProps) {
  const handleJoinClass = () => {
    if (upcomingLiveClass?.meetingUrl) {
      window.open(upcomingLiveClass.meetingUrl, "_blank");
    }
  };

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
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <span>{getGreeting()},</span>
          <span className="text-primary">{studentName.split(" ")[0]}</span>
          <span>{getEmoji()}</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Ready to continue your learning journey?
        </p>
      </div>

      {/* Live Class Hero Card */}
      {upcomingLiveClass && (
        <Card className="bg-linear-to-r from-primary to-secondary text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                  <Video className="h-6 w-6" />
                </div>
                <div>
                  <Badge
                    variant="secondary"
                    className="bg-accent text-accent-foreground mb-2"
                  >
                    {upcomingLiveClass.isLive
                      ? "🔴 Sedang Berlangsung"
                      : "Live Class Hari Ini"}
                  </Badge>
                  <h3 className="text-xl font-bold">
                    {upcomingLiveClass.title}
                  </h3>
                  <p className="text-white/80 text-sm mt-1">
                    dengan {upcomingLiveClass.tutorName}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-white/90 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {upcomingLiveClass.time}
                  </span>
                </div>
                <p className="text-sm text-white/80">
                  {upcomingLiveClass.countdown}
                </p>
              </div>
            </div>
            <Button
              className="bg-success hover:bg-success/90 text-white"
              onClick={handleJoinClass}
            >
              <Video className="mr-2 h-4 w-4" />
              Gabung Kelas Sekarang
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Kelas Aktif</p>
                <p className="text-2xl font-bold text-dark mt-1">
                  {stats.activeClassCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tugas Pending</p>
                <p className="text-2xl font-bold text-dark mt-1">
                  {stats.pendingAssignmentCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata Nilai</p>
                <p className="text-2xl font-bold text-dark mt-1">
                  {stats.averageScore || "-"}
                </p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Progress Minggu Ini
                </p>
                <p className="text-2xl font-bold text-dark mt-1">
                  {stats.weeklyProgress}%
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Classes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Kelas yang Diikuti</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/student/classes">Lihat Semua</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {myClasses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada kelas yang diikuti</p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href="/student/classes">Jelajahi Kelas</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myClasses.map((classItem) => (
                    <Card
                      key={classItem.id}
                      className="overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="h-32 bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-primary" />
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-dark mb-1">
                          {classItem.name}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {classItem.tutorName}
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span className="font-medium">
                              {classItem.progress}%
                            </span>
                          </div>
                          <Progress
                            value={classItem.progress}
                            className="h-2"
                          />
                        </div>
                        <Button
                          className="w-full mt-4"
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/student/classes/${classItem.id}`}>
                            Buka Kelas
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>Tugas Belum Selesai</CardTitle>
              <CardDescription>
                Jangan lupa selesaikan tugas-tugas berikut
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingAssignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-success" />
                  <p>Semua tugas sudah selesai! 🎉</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingAssignments.map((assignment) => (
                    <Link
                      key={assignment.id}
                      href="/student/assignments"
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-start gap-3">
                          {assignment.urgent ? (
                            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                          ) : (
                            <ClipboardList className="h-5 w-5 text-primary mt-0.5" />
                          )}
                          <div>
                            <h4 className="font-medium text-dark">
                              {assignment.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {assignment.className}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            assignment.urgent ? "destructive" : "secondary"
                          }
                        >
                          {assignment.dueDate}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Quizzes */}
          <Card>
            <CardHeader>
              <CardTitle>Kuis Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              {recentQuizzes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Belum ada kuis yang diselesaikan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentQuizzes.map((quiz) => (
                    <Link
                      key={quiz.id}
                      href={`/student/quizzes/${quiz.id}/result`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <h4 className="font-medium text-dark">
                            {quiz.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {quiz.className}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {quiz.score}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            dari {quiz.maxScore}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Tidak ada event mendatang</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress This Week */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress Minggu Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted stroke-current"
                      strokeWidth="8"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                    />
                    <circle
                      className="text-primary stroke-current"
                      strokeWidth="8"
                      strokeLinecap="round"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 40 * (1 - stats.weeklyProgress / 100)
                      }`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-dark">
                      {stats.weeklyProgress}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  {stats.weeklyProgress >= 100
                    ? "Target tercapai! Luar biasa! 🎉"
                    : stats.weeklyProgress >= 75
                    ? "Hampir tercapai! Pertahankan!"
                    : "Terus semangat belajar!"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
