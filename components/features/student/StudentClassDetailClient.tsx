"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  ClipboardList,
  FileQuestion,
  MessageSquare,
  Video,
  Trophy,
  Loader2,
  ArrowLeft,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface ClassOverview {
  class: {
    id: string;
    name: string;
    subject: string;
    gradeLevel: string;
    tutorName: string;
    schedule: string;
    thumbnail: string | null;
  };
  progress: {
    overall: number;
    assignments: {
      completed: number;
      total: number;
    };
    quizzes: {
      completed: number;
      total: number;
    };
  };
  stats: {
    materialsCount: number;
    pendingAssignments: number;
    availableQuizzes: number;
    activeThreads: number;
    avgScore: number | null;
  };
  nextLiveClass: {
    id: string;
    title: string;
    scheduledAt: string;
    meetingUrl: string;
  } | null;
  recentActivities: Array<{
    id: string;
    type: "submission" | "quiz" | "forum";
    action: string;
    timestamp: string;
  }>;
}

interface StudentClassDetailClientProps {
  classId: string;
}

export default function StudentClassDetailClient({
  classId,
}: StudentClassDetailClientProps) {
  const router = useRouter();
  const [data, setData] = useState<ClassOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, [classId]);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/student/classes/${classId}/overview`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        toast.error(result.error || "Gagal memuat data kelas");
      }
    } catch (error) {
      console.error("Error fetching class overview:", error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
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
        <p className="text-muted-foreground">Gagal memuat data kelas</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
      </div>
    );
  }

  const quickAccessCards = [
    {
      icon: BookOpen,
      title: "Materi",
      value: data.stats.materialsCount,
      unit: "tersedia",
      href: `/student/classes/${classId}/materials`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: ClipboardList,
      title: "Tugas",
      value: data.stats.pendingAssignments,
      unit: "pending",
      href: `/student/classes/${classId}/assignments`,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      badge:
        data.stats.pendingAssignments > 0 ? (
          <Badge variant="destructive" className="text-xs">
            {data.stats.pendingAssignments} baru
          </Badge>
        ) : null,
    },
    {
      icon: FileQuestion,
      title: "Kuis",
      value: data.stats.availableQuizzes,
      unit: "tersedia",
      href: `/student/classes/${classId}/quizzes`,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: MessageSquare,
      title: "Forum",
      value: data.stats.activeThreads,
      unit: "diskusi",
      href: `/student/classes/${classId}/forum`,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Video,
      title: "Live Class",
      value: data.nextLiveClass ? "Upcoming" : "Tidak ada",
      unit: data.nextLiveClass
        ? format(new Date(data.nextLiveClass.scheduledAt), "dd MMM, HH:mm", {
            locale: localeId,
          })
        : "jadwal",
      href: data.nextLiveClass
        ? data.nextLiveClass.meetingUrl
        : `/student/classes/${classId}/live-classes`,
      color: "text-red-600",
      bgColor: "bg-red-50",
      isExternal: !!data.nextLiveClass,
    },
    {
      icon: Trophy,
      title: "Nilai",
      value: data.stats.avgScore ?? "-",
      unit: "rata-rata",
      href: `/student/classes/${classId}/grades`,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            {data.class.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            dengan {data.class.tutorName}
          </p>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary">
              {data.class.subject} - {data.class.gradeLevel}
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progress Kelas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Keseluruhan</span>
              <span className="font-bold text-primary">
                {data.progress.overall}%
              </span>
            </div>
            <Progress value={data.progress.overall} className="h-3" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm pt-2">
            <div className="space-y-1">
              <p className="text-muted-foreground">Tugas</p>
              <p className="font-semibold text-lg">
                {data.progress.assignments.completed}/
                {data.progress.assignments.total}
              </p>
              <p className="text-xs text-muted-foreground">selesai</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Kuis</p>
              <p className="font-semibold text-lg">
                {data.progress.quizzes.completed}/{data.progress.quizzes.total}
              </p>
              <p className="text-xs text-muted-foreground">selesai</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickAccessCards.map((card, index) => {
            const Icon = card.icon;
            const CardWrapper = card.isExternal ? "a" : Link;

            return (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <CardContent className="p-6">
                  <CardWrapper
                    href={card.href}
                    {...(card.isExternal
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="block"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${card.bgColor}`}>
                        <Icon className={`h-6 w-6 ${card.color}`} />
                      </div>
                      {card.badge}
                    </div>

                    <h3 className="font-semibold text-lg mb-1">{card.title}</h3>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{card.value}</span>
                      <span className="text-sm text-muted-foreground">
                        {card.unit}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center text-sm text-primary group-hover:translate-x-1 transition-transform">
                      <span className="font-medium">
                        {card.isExternal ? "Join Meeting" : "Lihat Detail"}
                      </span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardWrapper>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aktivitas Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentActivities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada aktivitas
            </p>
          ) : (
            <div className="space-y-4">
              {data.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-3 border-b last:border-0"
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                        locale: localeId,
                      })}
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
