import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  ClipboardList,
  FileQuestion,
  Calendar,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

const stats = [
  { title: "Total Kelas", value: "8", icon: BookOpen, trend: "+2 bulan ini" },
  { title: "Total Siswa", value: "156", icon: Users, trend: "+12 minggu ini" },
  {
    title: "Tugas Pending",
    value: "23",
    icon: ClipboardList,
    trend: "Perlu dinilai",
  },
  {
    title: "Kuis Aktif",
    value: "5",
    icon: FileQuestion,
    trend: "Sedang berjalan",
  },
];

const upcomingClasses = [
  {
    id: 1,
    title: "Matematika XII - Kalkulus Lanjut",
    time: "09:00 - 10:30",
    date: "Hari ini",
    students: 24,
    type: "Live Class",
  },
  {
    id: 2,
    title: "Fisika XII - Mekanika Kuantum",
    time: "13:00 - 14:30",
    date: "Hari ini",
    students: 18,
    type: "Live Class",
  },
  {
    id: 3,
    title: "Matematika XI - Trigonometri",
    time: "10:00 - 11:30",
    date: "Besok",
    students: 22,
    type: "Live Class",
  },
];

const pendingGrading = [
  {
    id: 1,
    assignment: "Tugas Kalkulus - Integral",
    class: "Matematika XII",
    submitted: 20,
    total: 24,
    deadline: "2024-03-25",
  },
  {
    id: 2,
    assignment: "Quiz Mekanika",
    class: "Fisika XII",
    submitted: 18,
    total: 18,
    deadline: "2024-03-24",
  },
  {
    id: 3,
    assignment: "Tugas Trigonometri",
    class: "Matematika XI",
    submitted: 15,
    total: 22,
    deadline: "2024-03-26",
  },
];

const recentActivity = [
  {
    id: 1,
    student: "Ahmad Rizki",
    action: "Mengumpulkan Tugas Kalkulus",
    class: "Matematika XII",
    time: "10 menit yang lalu",
  },
  {
    id: 2,
    student: "Siti Nurhaliza",
    action: "Bertanya di Forum",
    class: "Fisika XII",
    time: "25 menit yang lalu",
  },
  {
    id: 3,
    student: "Budi Santoso",
    action: "Menyelesaikan Kuis",
    class: "Matematika XI",
    time: "1 jam yang lalu",
  },
];

export default function TutorDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Tutor</h1>
        <p className="text-muted-foreground mt-1">
          Selamat datang kembali, Prof. John Doe
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
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
        {/* Upcoming Classes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Kelas Mendatang</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tutor/live-classes">Lihat Semua</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingClasses.map((cls) => (
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
                    <Badge variant="outline">{cls.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {cls.date} • {cls.time}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {cls.students} siswa terdaftar
                  </p>
                </div>
              </div>
            ))}
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
            {pendingGrading.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-muted/50 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">{item.assignment}</h4>
                    <p className="text-xs text-muted-foreground">
                      {item.class}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {item.submitted}/{item.total}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Deadline:{" "}
                    {new Date(item.deadline).toLocaleDateString("id-ID")}
                  </span>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/tutor/grading">Nilai</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Aktivitas Terbaru</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 pb-4 border-b last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.student}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.action}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {activity.class}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
