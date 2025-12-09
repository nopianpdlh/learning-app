"use client";

/**
 * LiveClassesClient Component
 * Client-side component for student live classes with join and calendar actions
 */

import { useState } from "react";
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
  ExternalLink,
  CalendarPlus,
  Play,
} from "lucide-react";

interface LiveClass {
  id: string;
  title: string;
  description: string | null;
  meetingUrl: string;
  scheduledAt: string;
  duration: number;
  maxParticipants: number | null;
  recordingUrl: string | null;
  status: string;
  effectiveStatus: string;
  class: {
    id: string;
    name: string;
    subject: string;
  };
  tutor: {
    name: string;
    avatarUrl: string | null;
  };
  participantCount: number;
  attended: boolean;
}

interface Stats {
  upcoming: number;
  completed: number;
  attended: number;
  totalHours: number;
}

interface LiveClassesClientProps {
  initialLiveClasses: LiveClass[];
  initialStats: Stats;
}

export default function LiveClassesClient({
  initialLiveClasses,
  initialStats,
}: LiveClassesClientProps) {
  const [liveClasses] = useState<LiveClass[]>(initialLiveClasses);
  const [stats] = useState<Stats>(initialStats);

  const upcomingClasses = liveClasses.filter(
    (lc) => lc.effectiveStatus === "UPCOMING" || lc.effectiveStatus === "LIVE"
  );
  const completedClasses = liveClasses.filter(
    (lc) => lc.effectiveStatus === "COMPLETED"
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-700 border-blue-500/20"
          >
            Akan Datang
          </Badge>
        );
      case "LIVE":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-700 border-green-500/20 animate-pulse"
          >
            <Play className="h-3 w-3 mr-1" />
            Sedang Berlangsung
          </Badge>
        );
      case "COMPLETED":
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

  const handleJoin = (meetingUrl: string) => {
    window.open(meetingUrl, "_blank");
  };

  const handleAddToCalendar = (liveClass: LiveClass) => {
    const startDate = new Date(liveClass.scheduledAt);
    const endDate = new Date(
      startDate.getTime() + liveClass.duration * 60 * 1000
    );
    const formatDate = (date: Date) =>
      date.toISOString().replace(/-|:|\.\d{3}/g, "");

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      liveClass.title
    )}&dates=${formatDate(startDate)}/${formatDate(
      endDate
    )}&details=${encodeURIComponent(
      `Live Class: ${liveClass.class.name}\nTutor: ${liveClass.tutor.name}\nLink: ${liveClass.meetingUrl}`
    )}&location=${encodeURIComponent(liveClass.meetingUrl)}`;

    window.open(googleCalendarUrl, "_blank");
  };

  const formatLongDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
          <TabsTrigger value="upcoming">
            Akan Datang ({upcomingClasses.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Riwayat ({completedClasses.length})
          </TabsTrigger>
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
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">
                            {liveClass.title}
                          </h3>
                          {getStatusBadge(liveClass.effectiveStatus)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {liveClass.class.name} • {liveClass.class.subject}
                        </p>
                      </div>

                      {liveClass.description && (
                        <p className="text-sm text-foreground/80">
                          {liveClass.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatLongDate(liveClass.scheduledAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatTime(liveClass.scheduledAt)} WIB (
                            {liveClass.duration} menit)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={liveClass.tutor.avatarUrl || ""}
                            />
                            <AvatarFallback>
                              {getInitials(liveClass.tutor.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {liveClass.tutor.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>
                            {liveClass.participantCount}
                            {liveClass.maxParticipants &&
                              `/${liveClass.maxParticipants}`}{" "}
                            peserta
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:w-48">
                      <Button
                        className="w-full"
                        onClick={() => handleJoin(liveClass.meetingUrl)}
                      >
                        <Video className="mr-2 h-4 w-4" />
                        {liveClass.effectiveStatus === "LIVE"
                          ? "Gabung Sekarang"
                          : "Gabung"}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleAddToCalendar(liveClass)}
                      >
                        <CalendarPlus className="mr-2 h-4 w-4" />
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
          {completedClasses.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Belum ada riwayat live class
                </p>
              </CardContent>
            </Card>
          ) : (
            completedClasses.map((liveClass) => (
              <Card
                key={liveClass.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">
                            {liveClass.title}
                          </h3>
                          {getStatusBadge(liveClass.effectiveStatus)}
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
                          {liveClass.class.name} • {liveClass.class.subject}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatLongDate(liveClass.scheduledAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatTime(liveClass.scheduledAt)} WIB (
                            {liveClass.duration} menit)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={liveClass.tutor.avatarUrl || ""}
                            />
                            <AvatarFallback>
                              {getInitials(liveClass.tutor.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {liveClass.tutor.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{liveClass.participantCount} peserta</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:w-48">
                      {liveClass.recordingUrl && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            window.open(liveClass.recordingUrl!, "_blank")
                          }
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Lihat Rekaman
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
