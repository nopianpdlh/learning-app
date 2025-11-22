"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Calendar,
  Clock,
} from "lucide-react";

const assignments = [
  {
    id: 1,
    title: "Tugas Integral Tak Tentu",
    class: "Matematika XII",
    dueDate: "2024-03-28",
    status: "active",
    submitted: 18,
    total: 24,
    graded: 12,
  },
  {
    id: 2,
    title: "Analisis Gelombang Elektromagnetik",
    class: "Fisika XII",
    dueDate: "2024-03-25",
    status: "active",
    submitted: 15,
    total: 18,
    graded: 10,
  },
  {
    id: 3,
    title: "Soal Trigonometri Lanjutan",
    class: "Matematika XI",
    dueDate: "2024-03-30",
    status: "active",
    submitted: 8,
    total: 22,
    graded: 0,
  },
  {
    id: 4,
    title: "Laporan Praktikum Dinamika",
    class: "Fisika XI",
    dueDate: "2024-03-24",
    status: "closed",
    submitted: 20,
    total: 20,
    graded: 20,
  },
  {
    id: 5,
    title: "Tugas Limit Fungsi",
    class: "Matematika XII",
    dueDate: "2024-03-22",
    status: "closed",
    submitted: 24,
    total: 24,
    graded: 24,
  },
];

export default function TutorAssignments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.class.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || assignment.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge
        variant="outline"
        className="bg-green-500/10 text-green-700 border-green-500/20"
      >
        Aktif
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-gray-500/10 text-gray-700 border-gray-500/20"
      >
        Ditutup
      </Badge>
    );
  };

  const activeAssignments = assignments.filter(
    (a) => a.status === "active"
  ).length;
  const totalSubmissions = assignments.reduce((acc, a) => acc + a.submitted, 0);
  const needsGrading = assignments.reduce(
    (acc, a) => acc + (a.submitted - a.graded),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tugas</h1>
          <p className="text-muted-foreground mt-1">
            Kelola tugas untuk semua kelas
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Buat Tugas Baru
        </Button>
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
            <div className="text-2xl font-bold">{assignments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tugas Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeAssignments}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalSubmissions}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Perlu Dinilai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {needsGrading}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari tugas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs
          value={filter}
          onValueChange={setFilter}
          className="w-full sm:w-auto"
        >
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="active">Aktif</TabsTrigger>
            <TabsTrigger value="closed">Ditutup</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.map((assignment) => (
          <Card
            key={assignment.id}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg">
                      {assignment.title}
                    </h3>
                    {getStatusBadge(assignment.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {assignment.class}
                  </p>
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
                      <Users className="h-4 w-4" />
                      <span>
                        {assignment.submitted}/{assignment.total} dikumpulkan
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {assignment.graded}/{assignment.submitted} dinilai
                      </span>
                    </div>
                  </div>
                  {assignment.submitted > assignment.graded && (
                    <Badge
                      variant="outline"
                      className="bg-orange-500/10 text-orange-700 border-orange-500/20 w-fit"
                    >
                      {assignment.submitted - assignment.graded} perlu dinilai
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2 lg:shrink-0">
                  <Button variant="outline" size="sm">
                    Lihat Detail
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
