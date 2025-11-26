"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Users,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface ProgressDetails {
  assignments: {
    completed: number;
    total: number;
  };
  quizzes: {
    completed: number;
    total: number;
  };
}

interface ClassData {
  id: string;
  classId: string;
  title: string;
  subject: string;
  gradeLevel: string;
  tutorName: string;
  schedule: string;
  thumbnail: string | null;
  studentsCount: number;
  status: "active" | "completed";
  progress: number;
  enrolledAt: string;
  completedAt: string | null;
  progressDetails: ProgressDetails;
}

interface Stats {
  total: number;
  active: number;
  completed: number;
}

export default function StudentClassesClient() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [classes, statusFilter, subjectFilter]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/student/classes");
      const data = await response.json();

      if (response.ok) {
        setClasses(data.classes);
        setStats(data.stats);
        setSubjects(data.subjects);
      } else {
        toast.error(data.error || "Gagal memuat kelas");
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...classes];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Subject filter
    if (subjectFilter !== "all") {
      filtered = filtered.filter((c) => c.subject === subjectFilter);
    }

    setFilteredClasses(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark">Kelas Saya</h1>
          <p className="text-muted-foreground mt-1">
            Kelola dan akses semua kelas yang Anda ikuti
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
            </SelectContent>
          </Select>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Mata Pelajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Pelajaran</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Kelas</p>
                <p className="text-3xl font-bold text-dark mt-1">
                  {stats.total}
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
                <p className="text-sm text-muted-foreground">Kelas Aktif</p>
                <p className="text-3xl font-bold text-dark mt-1">
                  {stats.active}
                </p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Kelas Selesai</p>
                <p className="text-3xl font-bold text-dark mt-1">
                  {stats.completed}
                </p>
              </div>
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Grid */}
      {filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {classes.length === 0
                ? "Anda belum terdaftar di kelas manapun"
                : "Tidak ada kelas yang sesuai dengan filter"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classItem) => (
            <Card
              key={classItem.id}
              className="overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              {/* Thumbnail */}
              <div className="h-40 bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative">
                {classItem.thumbnail ? (
                  <img
                    src={classItem.thumbnail}
                    alt={classItem.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="h-16 w-16 text-primary" />
                )}
                {classItem.status === "completed" && (
                  <Badge className="absolute top-3 right-3 bg-success">
                    Selesai
                  </Badge>
                )}
                {classItem.status === "active" && (
                  <Badge className="absolute top-3 right-3 bg-primary">
                    Aktif
                  </Badge>
                )}
              </div>

              <CardContent className="p-5">
                {/* Subject Badge */}
                <Badge variant="secondary" className="mb-3">
                  {classItem.subject} - {classItem.gradeLevel}
                </Badge>

                {/* Title */}
                <h3 className="font-bold text-lg text-dark mb-2 line-clamp-2">
                  {classItem.title}
                </h3>

                {/* Tutor */}
                <p className="text-sm text-muted-foreground mb-4">
                  dengan {classItem.tutorName}
                </p>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{classItem.studentsCount} siswa</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs truncate">
                      {classItem.schedule}
                    </span>
                  </div>
                </div>

                {/* Enhancement 1: Progress Details */}
                {classItem.status === "active" && (
                  <div className="space-y-3 mb-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress Keseluruhan</span>
                        <span className="font-medium text-dark">
                          {classItem.progress}%
                        </span>
                      </div>
                      <Progress value={classItem.progress} className="h-2" />
                    </div>

                    <div className="flex gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-blue-600" />
                        <span className="text-muted-foreground">
                          {classItem.progressDetails.assignments.completed}/
                          {classItem.progressDetails.assignments.total} tugas
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-muted-foreground">
                          {classItem.progressDetails.quizzes.completed}/
                          {classItem.progressDetails.quizzes.total} kuis
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhancement 2: Quick Action Button */}
                <Button
                  className="w-full"
                  variant={
                    classItem.status === "completed" ? "outline" : "default"
                  }
                  asChild
                >
                  <Link href={`/student/classes/${classItem.classId}`}>
                    {classItem.status === "completed"
                      ? "Lihat Kelas"
                      : "Buka Kelas"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
