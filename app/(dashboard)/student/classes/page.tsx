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
import { BookOpen, Users, Clock, Star } from "lucide-react";

const Classes = () => {
  const classes = [
    {
      id: 1,
      title: "Matematika SMA Kelas 11 - Intensif",
      subject: "Matematika",
      grade: "SMA 11",
      tutor: "Dr. Ahmad Wijaya",
      progress: 65,
      students: 32,
      status: "active",
      rating: 4.9,
      schedule: "Senin & Rabu, 19:00-21:00",
    },
    {
      id: 2,
      title: "Fisika SMA Kelas 11 - Mekanika",
      subject: "Fisika",
      grade: "SMA 11",
      tutor: "Prof. Siti Nurjanah",
      progress: 45,
      students: 28,
      status: "active",
      rating: 4.8,
      schedule: "Selasa & Kamis, 19:00-21:00",
    },
    {
      id: 3,
      title: "Kimia SMA Kelas 11 - Stoikiometri",
      subject: "Kimia",
      grade: "SMA 11",
      tutor: "Drs. Budi Santoso",
      progress: 80,
      students: 30,
      status: "active",
      rating: 4.9,
      schedule: "Rabu & Jumat, 19:00-21:00",
    },
    {
      id: 4,
      title: "Bahasa Inggris SMA Kelas 11",
      subject: "Bahasa Inggris",
      grade: "SMA 11",
      tutor: "Ms. Linda Chen",
      progress: 55,
      students: 35,
      status: "active",
      rating: 4.7,
      schedule: "Kamis & Sabtu, 16:00-18:00",
    },
    {
      id: 5,
      title: "Matematika SMA Kelas 10 - Dasar",
      subject: "Matematika",
      grade: "SMA 10",
      tutor: "Dr. Ahmad Wijaya",
      progress: 100,
      students: 40,
      status: "completed",
      rating: 4.9,
      schedule: "Selesai",
    },
  ];

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
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Mata Pelajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Pelajaran</SelectItem>
              <SelectItem value="matematika">Matematika</SelectItem>
              <SelectItem value="fisika">Fisika</SelectItem>
              <SelectItem value="kimia">Kimia</SelectItem>
              <SelectItem value="english">Bahasa Inggris</SelectItem>
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
                <p className="text-3xl font-bold text-dark mt-1">5</p>
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
                <p className="text-3xl font-bold text-dark mt-1">4</p>
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
                <p className="text-3xl font-bold text-dark mt-1">1</p>
              </div>
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem) => (
          <Card
            key={classItem.id}
            className="overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            {/* Thumbnail */}
            <div className="h-40 bg-linear-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative">
              <BookOpen className="h-16 w-16 text-primary" />
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
                {classItem.subject} - {classItem.grade}
              </Badge>

              {/* Title */}
              <h3 className="font-bold text-lg text-dark mb-2 line-clamp-2">
                {classItem.title}
              </h3>

              {/* Tutor */}
              <p className="text-sm text-muted-foreground mb-4">
                dengan {classItem.tutor}
              </p>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{classItem.students} siswa</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="font-medium text-dark">
                    {classItem.rating}
                  </span>
                </div>
              </div>

              {/* Schedule */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Clock className="h-4 w-4" />
                <span>{classItem.schedule}</span>
              </div>

              {/* Progress */}
              {classItem.status === "active" && (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span className="font-medium text-dark">
                      {classItem.progress}%
                    </span>
                  </div>
                  <Progress value={classItem.progress} className="h-2" />
                </div>
              )}

              {/* Action Button */}
              <Button
                className="w-full"
                variant={
                  classItem.status === "completed" ? "outline" : "default"
                }
              >
                {classItem.status === "completed"
                  ? "Lihat Sertifikat"
                  : "Buka Kelas"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Classes;
