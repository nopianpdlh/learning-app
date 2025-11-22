"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  FileText,
  Calendar,
} from "lucide-react";

const assignments = [
  {
    id: 1,
    title: "Essay tentang Fotosintesis",
    class: "Biologi XII",
    dueDate: "2024-03-25",
    status: "pending",
    description: "Tulis essay minimal 500 kata tentang proses fotosintesis",
    points: 100,
  },
  {
    id: 2,
    title: "Soal Latihan Integral",
    class: "Matematika XII",
    dueDate: "2024-03-22",
    status: "submitted",
    score: 85,
    points: 100,
    submittedDate: "2024-03-20",
  },
  {
    id: 3,
    title: "Presentasi Sejarah Kemerdekaan",
    class: "Sejarah XII",
    dueDate: "2024-03-28",
    status: "pending",
    description:
      "Buat slide presentasi tentang peristiwa menjelang kemerdekaan",
    points: 100,
  },
  {
    id: 4,
    title: "Laporan Praktikum Fisika",
    class: "Fisika XII",
    dueDate: "2024-03-18",
    status: "graded",
    score: 92,
    points: 100,
    submittedDate: "2024-03-17",
    feedback: "Laporan sangat baik, analisis mendalam!",
  },
  {
    id: 5,
    title: "Translation Exercise",
    class: "Bahasa Inggris XII",
    dueDate: "2024-03-15",
    status: "late",
    description: "Translate the given paragraph from English to Indonesian",
    points: 100,
  },
];

export default function Assignments() {
  const [filter, setFilter] = useState<string>("all");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
          >
            Belum Dikerjakan
          </Badge>
        );
      case "submitted":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-700 border-blue-500/20"
          >
            Sudah Submit
          </Badge>
        );
      case "graded":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-700 border-green-500/20"
          >
            Sudah Dinilai
          </Badge>
        );
      case "late":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-700 border-red-500/20"
          >
            Terlambat
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "submitted":
        return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
      case "graded":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "late":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const filteredAssignments =
    filter === "all"
      ? assignments
      : assignments.filter((a) => a.status === filter);

  const stats = {
    total: assignments.length,
    pending: assignments.filter((a) => a.status === "pending").length,
    submitted: assignments.filter((a) => a.status === "submitted").length,
    graded: assignments.filter((a) => a.status === "graded").length,
  };

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tugas</h1>
          <p className="text-muted-foreground mt-1">
            Kelola dan submit tugas Anda
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tugas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Belum Dikerjakan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sudah Submit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.submitted}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sudah Dinilai
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.graded}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Filter */}
        <Tabs defaultValue="all" className="w-full" onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="pending">Belum Dikerjakan</TabsTrigger>
            <TabsTrigger value="submitted">Sudah Submit</TabsTrigger>
            <TabsTrigger value="graded">Sudah Dinilai</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6 space-y-4">
            {filteredAssignments.map((assignment) => (
              <Card
                key={assignment.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(assignment.status)}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">
                            {assignment.title}
                          </h3>
                          {getStatusBadge(assignment.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {assignment.class}
                        </p>
                        {assignment.description && (
                          <p className="text-sm text-foreground/80">
                            {assignment.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Deadline:{" "}
                              {new Date(assignment.dueDate).toLocaleDateString(
                                "id-ID"
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{assignment.points} poin</span>
                          </div>
                        </div>
                        {assignment.submittedDate && (
                          <p className="text-sm text-muted-foreground">
                            Submit:{" "}
                            {new Date(
                              assignment.submittedDate
                            ).toLocaleDateString("id-ID")}
                          </p>
                        )}
                        {assignment.score !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Nilai:</span>
                            <Badge className="bg-primary/10 text-primary border-primary/20">
                              {assignment.score}/{assignment.points}
                            </Badge>
                          </div>
                        )}
                        {assignment.feedback && (
                          <div className="bg-muted/50 p-3 rounded-md">
                            <p className="text-sm font-medium mb-1">
                              Feedback dari Tutor:
                            </p>
                            <p className="text-sm text-foreground/80">
                              {assignment.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 lg:flex-shrink-0">
                      {assignment.status === "pending" && (
                        <Button className="w-full lg:w-auto">
                          <Upload className="mr-2 h-4 w-4" />
                          Submit Tugas
                        </Button>
                      )}
                      {assignment.status === "submitted" && (
                        <Button variant="outline" className="w-full lg:w-auto">
                          Lihat Detail
                        </Button>
                      )}
                      {assignment.status === "graded" && (
                        <Button variant="outline" className="w-full lg:w-auto">
                          Lihat Detail
                        </Button>
                      )}
                      {assignment.status === "late" && (
                        <Button
                          variant="destructive"
                          className="w-full lg:w-auto"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Submit Terlambat
                        </Button>
                      )}
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
