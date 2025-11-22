"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Users,
  Calendar,
  Settings,
  Plus,
  Search,
} from "lucide-react";

import Link from "next/link";

const classes = [
  {
    id: 1,
    name: "Matematika XII - Kalkulus",
    code: "MAT-XII-A",
    students: 24,
    schedule: "Senin & Rabu, 09:00-10:30",
    status: "active",
    progress: 65,
  },
  {
    id: 2,
    name: "Fisika XII - Mekanika Kuantum",
    code: "FIS-XII-A",
    students: 18,
    schedule: "Selasa & Kamis, 13:00-14:30",
    status: "active",
    progress: 72,
  },
  {
    id: 3,
    name: "Matematika XI - Trigonometri",
    code: "MAT-XI-B",
    students: 22,
    schedule: "Rabu & Jumat, 10:00-11:30",
    status: "active",
    progress: 58,
  },
  {
    id: 4,
    name: "Fisika XI - Dinamika",
    code: "FIS-XI-C",
    students: 20,
    schedule: "Senin & Kamis, 14:00-15:30",
    status: "active",
    progress: 45,
  },
  {
    id: 5,
    name: "Matematika XII - Statistika",
    code: "MAT-XII-B",
    students: 26,
    schedule: "Selasa & Jumat, 08:00-09:30",
    status: "completed",
    progress: 100,
  },
];

export default function TutorClasses() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeClasses = classes.filter((c) => c.status === "active").length;
  const totalStudents = classes.reduce((acc, c) => acc + c.students, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Kelas yang Diampu
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola semua kelas yang Anda ajarkan
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Buat Kelas Baru
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Kelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kelas Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeClasses}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Siswa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {totalStudents}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari kelas berdasarkan nama atau kode..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Classes Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredClasses.map((cls) => (
          <Card key={cls.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{cls.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{cls.code}</p>
                </div>
                <Badge
                  variant={cls.status === "active" ? "default" : "secondary"}
                >
                  {cls.status === "active" ? "Aktif" : "Selesai"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{cls.students} siswa</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{cls.schedule}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress Materi</span>
                  <span className="font-medium">{cls.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${cls.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/tutor/classes/${cls.id}`}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Lihat Detail
                  </Link>
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
