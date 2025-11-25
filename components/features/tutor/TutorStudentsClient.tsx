"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Award, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Student {
  id: string;
  name: string;
  avatar: string | null;
  email: string;
  classId: string;
  className: string;
  classSubject: string;
  avgScore: number | null;
  completionRate: number;
  assignments: {
    total: number;
    completed: number;
    avgScore: number | null;
  };
  quizzes: {
    total: number;
    attempted: number;
    avgScore: number | null;
  };
  latestActivity: string | null;
  enrolledAt: string;
}

interface ClassInfo {
  id: string;
  name: string;
  subject: string;
}

interface Stats {
  totalStudents: number;
  avgClassScore: number;
  avgCompletionRate: number;
  totalAssignmentsCompleted: number;
}

export default function TutorStudentsClient() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    avgClassScore: 0,
    avgCompletionRate: 0,
    totalAssignmentsCompleted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");

  // Fetch students
  useEffect(() => {
    fetchStudents();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [students, searchQuery, classFilter]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tutor/students");
      const data = await response.json();

      if (response.ok) {
        setStudents(data.students);
        setStats(data.stats);
        setClasses(data.classes);
      } else {
        toast.error(data.error || "Gagal memuat data siswa");
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...students];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.className.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query)
      );
    }

    // Class filter
    if (classFilter !== "all") {
      filtered = filtered.filter((s) => s.classId === classFilter);
    }

    setFilteredStudents(filtered);

    // Reset selection if current selection is not in filtered list
    if (selectedStudent) {
      const stillExists = filtered.some(
        (s) => `${s.id}-${s.classId}` === selectedStudent
      );
      if (!stillExists) {
        setSelectedStudent(null);
      }
    }
  };

  const getScoreIndicatorColor = (score: number | null) => {
    if (score === null) return "text-gray-600";
    if (score >= 75) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeClass = (score: number | null) => {
    if (score === null)
      return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    if (score >= 75)
      return "bg-green-500/10 text-green-700 border-green-500/20";
    if (score >= 60)
      return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
    return "bg-red-500/10 text-red-700 border-red-500/20";
  };

  const selectedStudentData = students.find(
    (s) => `${s.id}-${s.classId}` === selectedStudent
  );

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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Progress Siswa</h1>
        <p className="text-muted-foreground mt-1">
          Monitor perkembangan dan performa siswa
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Siswa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rata-rata Nilai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.avgClassScore}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rata-rata Penyelesaian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.avgCompletionRate}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tugas Selesai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalAssignmentsCompleted}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari siswa berdasarkan nama atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Semua Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Students Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Daftar Siswa</h3>
          {filteredStudents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>Tidak ada siswa ditemukan</p>
              </CardContent>
            </Card>
          ) : (
            filteredStudents.map((student) => (
              <Card
                key={`${student.id}-${student.classId}`}
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  selectedStudent === `${student.id}-${student.classId}`
                    ? "ring-2 ring-primary"
                    : ""
                }`}
                onClick={() =>
                  setSelectedStudent(`${student.id}-${student.classId}`)
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={student.avatar || undefined} />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{student.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {student.className}
                          </p>
                        </div>
                        <div
                          className={getScoreIndicatorColor(student.avgScore)}
                        >
                          {student.avgScore !== null ? (
                            <Award className="h-5 w-5" />
                          ) : (
                            <div className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={getScoreBadgeClass(student.avgScore)}
                        >
                          Nilai: {student.avgScore ?? "-"}
                        </Badge>
                        <Badge variant="outline">
                          Penyelesaian: {student.completionRate}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {student.latestActivity
                          ? `Latest: ${format(
                              new Date(student.latestActivity),
                              "dd MMM yyyy",
                              { locale: localeId }
                            )}`
                          : "Belum ada aktivitas"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Student Detail */}
        <Card className="h-fit sticky top-6">
          <CardHeader>
            <CardTitle>Detail Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedStudentData ? (
              <>
                <div className="flex items-start gap-3 pb-4 border-b">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={selectedStudentData.avatar || undefined}
                    />
                    <AvatarFallback>
                      {selectedStudentData.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {selectedStudentData.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedStudentData.className}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Bergabung:{" "}
                      {format(
                        new Date(selectedStudentData.enrolledAt),
                        "dd MMM yyyy",
                        { locale: localeId }
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Rata-rata Nilai
                      </span>
                      <span
                        className={`text-2xl font-bold ${getScoreIndicatorColor(
                          selectedStudentData.avgScore
                        )}`}
                      >
                        {selectedStudentData.avgScore ?? "-"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Tingkat Penyelesaian</span>
                      <span>{selectedStudentData.completionRate}%</span>
                    </div>
                    <Progress value={selectedStudentData.completionRate} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Tugas Selesai</span>
                      <span>
                        {selectedStudentData.assignments.completed}/
                        {selectedStudentData.assignments.total}
                      </span>
                    </div>
                    <Progress
                      value={
                        selectedStudentData.assignments.total > 0
                          ? (selectedStudentData.assignments.completed /
                              selectedStudentData.assignments.total) *
                            100
                          : 0
                      }
                    />
                    {selectedStudentData.assignments.avgScore !== null && (
                      <p className="text-xs text-muted-foreground">
                        Rata-rata: {selectedStudentData.assignments.avgScore}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Kuis Selesai</span>
                      <span>
                        {selectedStudentData.quizzes.attempted}/
                        {selectedStudentData.quizzes.total}
                      </span>
                    </div>
                    <Progress
                      value={
                        selectedStudentData.quizzes.total > 0
                          ? (selectedStudentData.quizzes.attempted /
                              selectedStudentData.quizzes.total) *
                            100
                          : 0
                      }
                    />
                    {selectedStudentData.quizzes.avgScore !== null && (
                      <p className="text-xs text-muted-foreground">
                        Rata-rata: {selectedStudentData.quizzes.avgScore}
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Avatar className="h-16 w-16 mx-auto mb-2 opacity-50">
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <p>Pilih siswa untuk melihat detail progress</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
