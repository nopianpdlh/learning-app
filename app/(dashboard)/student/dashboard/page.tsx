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

const Dashboard = () => {
  // Mock data
  const upcomingLiveClass = {
    title: "Matematika - Trigonometri Lanjutan",
    tutor: "Dr. Ahmad Wijaya",
    time: "14:00 - 16:00",
    countdown: "2 jam 30 menit lagi",
  };

  const myClasses = [
    {
      id: 1,
      title: "Matematika SMA Kelas 11",
      tutor: "Dr. Ahmad Wijaya",
      progress: 65,
      thumbnail: "math",
    },
    {
      id: 2,
      title: "Fisika SMA Kelas 11",
      tutor: "Prof. Siti Nurjanah",
      progress: 45,
      thumbnail: "physics",
    },
    {
      id: 3,
      title: "Kimia SMA Kelas 11",
      tutor: "Drs. Budi Santoso",
      progress: 80,
      thumbnail: "chemistry",
    },
    {
      id: 4,
      title: "Bahasa Inggris SMA Kelas 11",
      tutor: "Ms. Linda Chen",
      progress: 55,
      thumbnail: "english",
    },
  ];

  const pendingAssignments = [
    {
      id: 1,
      title: "Tugas Trigonometri - Soal Latihan",
      class: "Matematika SMA Kelas 11",
      dueDate: "2 hari lagi",
      urgent: false,
    },
    {
      id: 2,
      title: "Essay: Newton's Laws of Motion",
      class: "Fisika SMA Kelas 11",
      dueDate: "1 hari lagi",
      urgent: true,
    },
    {
      id: 3,
      title: "Lab Report: Chemical Reactions",
      class: "Kimia SMA Kelas 11",
      dueDate: "5 hari lagi",
      urgent: false,
    },
  ];

  const recentQuizzes = [
    {
      id: 1,
      title: "Kuis Fungsi Trigonometri",
      class: "Matematika SMA Kelas 11",
      score: 85,
      maxScore: 100,
    },
    {
      id: 2,
      title: "Kuis Momentum dan Impuls",
      class: "Fisika SMA Kelas 11",
      score: 92,
      maxScore: 100,
    },
  ];

  const upcomingEvents = [
    { date: "Senin, 14:00", title: "Live Class Matematika", type: "live" },
    { date: "Rabu, 15:00", title: "Live Class Fisika", type: "live" },
    { date: "Jumat, 16:00", title: "Live Class Kimia", type: "live" },
  ];

  return (
    
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-dark mb-2">Halo, John! 👋</h1>
          <p className="text-muted-foreground">
            Selamat datang kembali. Mari lanjutkan pembelajaran Anda hari ini.
          </p>
        </div>

        {/* Live Class Hero Card */}
        {upcomingLiveClass && (
          <Card className="bg-gradient-to-r from-primary to-secondary text-white border-0 shadow-lg">
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
                      Live Class Hari Ini
                    </Badge>
                    <h3 className="text-xl font-bold">
                      {upcomingLiveClass.title}
                    </h3>
                    <p className="text-white/80 text-sm mt-1">
                      dengan {upcomingLiveClass.tutor}
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
              <Button className="bg-success hover:bg-success/90 text-white">
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
                  <p className="text-2xl font-bold text-dark mt-1">4</p>
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
                  <p className="text-2xl font-bold text-dark mt-1">3</p>
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
                  <p className="text-sm text-muted-foreground">
                    Rata-rata Nilai
                  </p>
                  <p className="text-2xl font-bold text-dark mt-1">87.5</p>
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
                  <p className="text-2xl font-bold text-dark mt-1">75%</p>
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
                  <Button variant="ghost" size="sm">
                    Lihat Semua
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myClasses.slice(0, 4).map((classItem) => (
                    <Card
                      key={classItem.id}
                      className="overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-primary" />
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-dark mb-1">
                          {classItem.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {classItem.tutor}
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
                        >
                          Buka Kelas
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
                <div className="space-y-3">
                  {pendingAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
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
                            {assignment.class}
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
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Quizzes */}
            <Card>
              <CardHeader>
                <CardTitle>Kuis Terbaru</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentQuizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-dark">{quiz.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {quiz.class}
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
                  ))}
                </div>
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
                <div className="space-y-3">
                  {upcomingEvents.map((event, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
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
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.75)}`}
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-dark">75%</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Kamu sudah menyelesaikan 75% target belajar minggu ini.
                    Pertahankan!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    
  );
};

export default Dashboard;
