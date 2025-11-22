import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Video,
  Clock,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const liveClasses = [
  {
    id: 1,
    title: "Pembahasan Soal UN Matematika",
    class: "Matematika XII",
    tutor: "Pak Budi Santoso",
    tutorAvatar: "",
    date: "2024-03-25",
    time: "14:00 - 15:30",
    duration: 90,
    status: "upcoming",
    participants: 45,
    maxParticipants: 50,
    description:
      "Live class pembahasan soal-soal UN Matematika tahun sebelumnya",
    meetingLink: "https://meet.example.com/math-session",
  },
  {
    id: 2,
    title: "Diskusi Materi Fisika Kuantum",
    class: "Fisika XII",
    tutor: "Bu Sarah Wijaya",
    tutorAvatar: "",
    date: "2024-03-26",
    time: "10:00 - 11:30",
    duration: 90,
    status: "upcoming",
    participants: 32,
    maxParticipants: 40,
    description:
      "Sesi diskusi interaktif tentang konsep-konsep dasar fisika kuantum",
  },
  {
    id: 3,
    title: "Review Materi Biologi Sel",
    class: "Biologi XII",
    tutor: "Pak Ahmad Fauzi",
    tutorAvatar: "",
    date: "2024-03-22",
    time: "15:00 - 16:00",
    duration: 60,
    status: "completed",
    participants: 38,
    maxParticipants: 40,
    recordingUrl: "https://example.com/recording/bio-cell",
    attended: true,
  },
  {
    id: 4,
    title: "Grammar Practice - English",
    class: "Bahasa Inggris XII",
    tutor: "Ms. Linda Chen",
    tutorAvatar: "",
    date: "2024-03-27",
    time: "13:00 - 14:00",
    duration: 60,
    status: "upcoming",
    participants: 28,
    maxParticipants: 35,
    description: "Interactive grammar practice session with real-life examples",
  },
  {
    id: 5,
    title: "Sejarah Perjuangan Kemerdekaan",
    class: "Sejarah XII",
    tutor: "Pak Dwi Nugroho",
    tutorAvatar: "",
    date: "2024-03-20",
    time: "09:00 - 10:30",
    duration: 90,
    status: "completed",
    participants: 42,
    maxParticipants: 50,
    recordingUrl: "https://example.com/recording/history",
    attended: false,
  },
];

export default function LiveClasses() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-700 border-blue-500/20"
          >
            Akan Datang
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-gray-500/10 text-gray-700 border-gray-500/20"
          >
            Selesai
          </Badge>
        );
      default:
        return null;
    }
  };

  const upcomingClasses = liveClasses.filter((c) => c.status === "upcoming");
  const completedClasses = liveClasses.filter((c) => c.status === "completed");

  const stats = {
    upcoming: upcomingClasses.length,
    completed: completedClasses.length,
    attended: completedClasses.filter((c) => c.attended).length,
    totalHours: Math.round(
      liveClasses.reduce((acc, c) => acc + c.duration, 0) / 60
    ),
  };

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Jadwal Live Class
          </h1>
          <p className="text-muted-foreground mt-1">
            Ikuti sesi live class bersama tutor
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Akan Datang
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.upcoming}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Selesai
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Kehadiran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.attended}/{stats.completed}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Jam
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.totalHours} jam
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList>
            <TabsTrigger value="upcoming">Akan Datang</TabsTrigger>
            <TabsTrigger value="completed">Riwayat</TabsTrigger>
          </TabsList>

          {/* Upcoming Classes */}
          <TabsContent value="upcoming" className="mt-6 space-y-4">
            {upcomingClasses.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Tidak ada live class yang akan datang
                  </p>
                </CardContent>
              </Card>
            ) : (
              upcomingClasses.map((liveClass) => (
                <Card
                  key={liveClass.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-lg">
                                {liveClass.title}
                              </h3>
                              {getStatusBadge(liveClass.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {liveClass.class}
                            </p>
                          </div>
                        </div>

                        {liveClass.description && (
                          <p className="text-sm text-foreground/80">
                            {liveClass.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(liveClass.date).toLocaleDateString(
                                "id-ID",
                                {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {liveClass.time} WIB ({liveClass.duration} menit)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={liveClass.tutorAvatar} />
                              <AvatarFallback>
                                {liveClass.tutor
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {liveClass.tutor}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>
                              {liveClass.participants}/
                              {liveClass.maxParticipants} peserta
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 lg:w-48">
                        <Button className="w-full">
                          <Video className="mr-2 h-4 w-4" />
                          Gabung Sekarang
                        </Button>
                        <Button variant="outline" className="w-full">
                          Tambah ke Kalender
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Completed Classes */}
          <TabsContent value="completed" className="mt-6 space-y-4">
            {completedClasses.map((liveClass) => (
              <Card
                key={liveClass.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">
                              {liveClass.title}
                            </h3>
                            {getStatusBadge(liveClass.status)}
                            {liveClass.attended ? (
                              <Badge
                                variant="outline"
                                className="bg-green-500/10 text-green-700 border-green-500/20"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Hadir
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-red-500/10 text-red-700 border-red-500/20"
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Tidak Hadir
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {liveClass.class}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(liveClass.date).toLocaleDateString(
                              "id-ID",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {liveClass.time} WIB ({liveClass.duration} menit)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={liveClass.tutorAvatar} />
                            <AvatarFallback>
                              {liveClass.tutor
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {liveClass.tutor}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{liveClass.participants} peserta</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:w-48">
                      {liveClass.recordingUrl && (
                        <Button variant="outline" className="w-full">
                          <Video className="mr-2 h-4 w-4" />
                          Lihat Rekaman
                        </Button>
                      )}
                      <Button variant="secondary" className="w-full">
                        Lihat Materi
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    
  );
}
