"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  FileText,
  ClipboardList,
  HelpCircle,
  Video,
  Users,
  ChevronLeft,
  Clock,
  Calendar,
  Plus,
  ExternalLink,
} from "lucide-react";

interface Props {
  section: {
    id: string;
    label: string;
    status: string;
    template: {
      id: string;
      name: string;
      description: string;
      subject: string;
      gradeLevel: string;
      thumbnail: string | null;
      pricePerMonth: number;
      maxStudentsPerSection: number;
    };
  };
  students: {
    enrollmentId: string;
    status: string;
    startDate: string | null;
    expiryDate: string | null;
    student: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    };
  }[];
  materials: {
    id: string;
    title: string;
    session: number;
    fileType: string;
    createdAt: string;
  }[];
  assignments: {
    id: string;
    title: string;
    dueDate: string;
    status: string;
    submissionCount: number;
  }[];
  quizzes: {
    id: string;
    title: string;
    status: string;
    questionsCount: number;
    attemptsCount: number;
  }[];
  meetings: {
    id: string;
    title: string;
    scheduledAt: string;
    duration: number;
    status: string;
    meetingUrl: string | null;
  }[];
}

export default function TutorSectionDetailClient({
  section,
  students,
  materials,
  assignments,
  quizzes,
  meetings,
}: Props) {
  const [activeTab, setActiveTab] = useState("students");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-600">Aktif</Badge>;
      case "EXPIRED":
        return <Badge variant="destructive">Expired</Badge>;
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>;
      case "PUBLISHED":
        return <Badge className="bg-green-600">Published</Badge>;
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "SCHEDULED":
        return <Badge variant="outline">Terjadwal</Badge>;
      case "COMPLETED":
        return <Badge variant="secondary">Selesai</Badge>;
      case "LIVE":
        return (
          <Badge variant="destructive" className="animate-pulse">
            LIVE
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/tutor/sections"
          className="hover:text-primary flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Section Saya
        </Link>
        <span>/</span>
        <span>
          {section.template.name} - Section {section.label}
        </span>
      </div>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-6">
            {section.template.thumbnail && (
              <div className="w-32 h-32 rounded-lg overflow-hidden shrink-0">
                <img
                  src={section.template.thumbnail}
                  alt={section.template.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[#0A2647]">
                  {section.template.name}
                </h1>
                <Badge
                  variant={
                    section.status === "ACTIVE" ? "default" : "secondary"
                  }
                >
                  {section.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Section {section.label} • {section.template.subject} •{" "}
                {section.template.gradeLevel}
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {students.length}/{section.template.maxStudentsPerSection}{" "}
                    siswa
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{materials.length} materi</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  <span>{assignments.length} tugas</span>
                </div>
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  <span>{quizzes.length} quiz</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="students" className="gap-2">
            <Users className="h-4 w-4" />
            Siswa ({students.length})
          </TabsTrigger>
          <TabsTrigger value="materials" className="gap-2">
            <FileText className="h-4 w-4" />
            Materi ({materials.length})
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Tugas ({assignments.length})
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Quiz ({quizzes.length})
          </TabsTrigger>
          <TabsTrigger value="meetings" className="gap-2">
            <Video className="h-4 w-4" />
            Jadwal ({meetings.length})
          </TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daftar Siswa</CardTitle>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada siswa terdaftar
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mulai</TableHead>
                      <TableHead>Berakhir</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s) => (
                      <TableRow key={s.enrollmentId}>
                        <TableCell className="font-medium">
                          {s.student.name}
                        </TableCell>
                        <TableCell>{s.student.email}</TableCell>
                        <TableCell>{getStatusBadge(s.status)}</TableCell>
                        <TableCell>
                          {s.startDate ? formatDate(s.startDate) : "-"}
                        </TableCell>
                        <TableCell>
                          {s.expiryDate ? formatDate(s.expiryDate) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daftar Materi</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Tambah Materi
              </Button>
            </CardHeader>
            <CardContent>
              {materials.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada materi
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pertemuan</TableHead>
                      <TableHead>Judul</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Dibuat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.session}</TableCell>
                        <TableCell className="font-medium">{m.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{m.fileType}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(m.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daftar Tugas</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Tambah Tugas
              </Button>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada tugas
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Judul</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Dikumpulkan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.title}</TableCell>
                        <TableCell>{formatDateTime(a.dueDate)}</TableCell>
                        <TableCell>{getStatusBadge(a.status)}</TableCell>
                        <TableCell>
                          {a.submissionCount}/{students.length}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daftar Quiz</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Tambah Quiz
              </Button>
            </CardHeader>
            <CardContent>
              {quizzes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada quiz
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Judul</TableHead>
                      <TableHead>Soal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Dikerjakan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizzes.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="font-medium">{q.title}</TableCell>
                        <TableCell>{q.questionsCount} soal</TableCell>
                        <TableCell>{getStatusBadge(q.status)}</TableCell>
                        <TableCell>{q.attemptsCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meetings Tab */}
        <TabsContent value="meetings" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Jadwal Pertemuan</CardTitle>
            </CardHeader>
            <CardContent>
              {meetings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada jadwal pertemuan
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Judul</TableHead>
                      <TableHead>Jadwal</TableHead>
                      <TableHead>Durasi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meetings.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.title}</TableCell>
                        <TableCell>{formatDateTime(m.scheduledAt)}</TableCell>
                        <TableCell>{m.duration} menit</TableCell>
                        <TableCell>{getStatusBadge(m.status)}</TableCell>
                        <TableCell>
                          {m.meetingUrl && (
                            <Button size="sm" variant="ghost" asChild>
                              <a
                                href={m.meetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
