"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  FileText,
  ClipboardList,
  Video,
  MessageSquare,
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import {
  formatRupiah,
  calculateEnrollmentRate,
  getStatusColor,
  getStatusLabel,
} from "@/lib/class-helpers";

interface ClassDetailClientProps {
  classData: {
    id: string;
    name: string;
    description: string;
    code: string;
    subject: string;
    gradeLevel: string;
    schedule: string;
    price: number;
    capacity: number;
    thumbnail: string | null;
    published: boolean;
    status: "active" | "completed" | "draft";
    progress: number;
    stats: {
      students: number;
      materials: number;
      assignments: number;
      quizzes: number;
      liveClasses: number;
      forumThreads: number;
    };
    upcomingLiveClasses: Array<{
      id: string;
      title: string;
      scheduledAt: string;
      duration: number;
    }>;
  };
}

export default function ClassDetailClient({
  classData,
}: ClassDetailClientProps) {
  const enrollmentRate = calculateEnrollmentRate(
    classData.stats.students,
    classData.capacity
  );

  return (
    <div className="space-y-6 ">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/tutor/classes" className="hover:text-foreground">
          Kelas
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{classData.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">
              {classData.name}
            </h1>
            <Badge variant={getStatusColor(classData.status)}>
              {getStatusLabel(classData.status)}
            </Badge>
          </div>
          <p className="text-muted-foreground">{classData.code}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Siswa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {classData.stats.students}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {enrollmentRate}% dari kapasitas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Materi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classData.stats.materials}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Materi pembelajaran
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tugas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classData.stats.assignments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tugas dipublikasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Kuis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classData.stats.quizzes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Kuis dipublikasi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Class Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Kelas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Mata Pelajaran</p>
                  <p className="text-sm text-muted-foreground">
                    {classData.subject}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Tingkat</p>
                  <p className="text-sm text-muted-foreground">
                    Kelas {classData.gradeLevel}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Jadwal</p>
                  <p className="text-sm text-muted-foreground">
                    {classData.schedule}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Harga</p>
                  <p className="text-sm text-muted-foreground">
                    {formatRupiah(classData.price)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Kapasitas</p>
                  <p className="text-sm text-muted-foreground">
                    {classData.capacity} siswa
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Progress Materi</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${classData.progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {classData.progress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Deskripsi</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {classData.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
