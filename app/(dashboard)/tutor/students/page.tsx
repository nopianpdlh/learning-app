"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Award,
  FileText,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const students = [
  {
    id: 1,
    name: "Ahmad Rizki",
    class: "Matematika XII",
    avgScore: 88,
    attendance: 95,
    assignments: { completed: 8, total: 10 },
    quizzes: { completed: 5, total: 5 },
    trend: "up",
    lastActive: "2 jam yang lalu",
  },
  {
    id: 2,
    name: "Siti Nurhaliza",
    class: "Fisika XII",
    avgScore: 92,
    attendance: 100,
    assignments: { completed: 10, total: 10 },
    quizzes: { completed: 4, total: 4 },
    trend: "up",
    lastActive: "1 hari yang lalu",
  },
  {
    id: 3,
    name: "Budi Santoso",
    class: "Matematika XI",
    avgScore: 75,
    attendance: 85,
    assignments: { completed: 6, total: 9 },
    quizzes: { completed: 3, total: 4 },
    trend: "down",
    lastActive: "3 jam yang lalu",
  },
  {
    id: 4,
    name: "Dewi Lestari",
    class: "Fisika XI",
    avgScore: 85,
    attendance: 90,
    assignments: { completed: 7, total: 8 },
    quizzes: { completed: 3, total: 3 },
    trend: "up",
    lastActive: "5 jam yang lalu",
  },
  {
    id: 5,
    name: "Eko Prasetyo",
    class: "Matematika XII",
    avgScore: 90,
    attendance: 92,
    assignments: { completed: 9, total: 10 },
    quizzes: { completed: 5, total: 5 },
    trend: "up",
    lastActive: "1 jam yang lalu",
  },
];

export default function TutorStudents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgClassScore = Math.round(
    students.reduce((acc, s) => acc + s.avgScore, 0) / students.length
  );
  const avgAttendance = Math.round(
    students.reduce((acc, s) => acc + s.attendance, 0) / students.length
  );
  const totalAssignments = students.reduce(
    (acc, s) => acc + s.assignments.completed,
    0
  );

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
            <div className="text-2xl font-bold">{students.length}</div>
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
              {avgClassScore}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rata-rata Kehadiran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {avgAttendance}%
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
              {totalAssignments}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari siswa berdasarkan nama atau kelas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Students Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Daftar Siswa</h3>
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                selectedStudent === student.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedStudent(student.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{student.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {student.class}
                        </p>
                      </div>
                      {student.trend === "up" ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        Nilai: {student.avgScore}
                      </Badge>
                      <Badge variant="outline">
                        Kehadiran: {student.attendance}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Aktif terakhir: {student.lastActive}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Student Detail */}
        <Card className="h-fit sticky top-6">
          <CardHeader>
            <CardTitle>Detail Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedStudent ? (
              <>
                <div className="flex items-start gap-3 pb-4 border-b">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>
                      {students
                        .find((s) => s.id === selectedStudent)
                        ?.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {students.find((s) => s.id === selectedStudent)?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {students.find((s) => s.id === selectedStudent)?.class}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Aktif:{" "}
                      {
                        students.find((s) => s.id === selectedStudent)
                          ?.lastActive
                      }
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
                      <span className="text-2xl font-bold text-primary">
                        {
                          students.find((s) => s.id === selectedStudent)
                            ?.avgScore
                        }
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Kehadiran</span>
                      <span>
                        {
                          students.find((s) => s.id === selectedStudent)
                            ?.attendance
                        }
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        students.find((s) => s.id === selectedStudent)
                          ?.attendance
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Tugas Selesai</span>
                      <span>
                        {
                          students.find((s) => s.id === selectedStudent)
                            ?.assignments.completed
                        }
                        /
                        {
                          students.find((s) => s.id === selectedStudent)
                            ?.assignments.total
                        }
                      </span>
                    </div>
                    <Progress
                      value={
                        ((students.find((s) => s.id === selectedStudent)
                          ?.assignments.completed || 0) /
                          (students.find((s) => s.id === selectedStudent)
                            ?.assignments.total || 1)) *
                        100
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Kuis Selesai</span>
                      <span>
                        {
                          students.find((s) => s.id === selectedStudent)
                            ?.quizzes.completed
                        }
                        /
                        {
                          students.find((s) => s.id === selectedStudent)
                            ?.quizzes.total
                        }
                      </span>
                    </div>
                    <Progress
                      value={
                        ((students.find((s) => s.id === selectedStudent)
                          ?.quizzes.completed || 0) /
                          (students.find((s) => s.id === selectedStudent)
                            ?.quizzes.total || 1)) *
                        100
                      }
                    />
                  </div>
                </div>

                <Button className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Lihat Detail Lengkap
                </Button>
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
