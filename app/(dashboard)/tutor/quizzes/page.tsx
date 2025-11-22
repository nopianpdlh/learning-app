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
  FileQuestion,
  Timer,
} from "lucide-react";

const quizzes = [
  {
    id: 1,
    title: "Kuis Harian - Integral",
    class: "Matematika XII",
    dueDate: "2024-03-26",
    duration: 30,
    questions: 20,
    status: "active",
    participants: 18,
    total: 24,
    avgScore: 82,
  },
  {
    id: 2,
    title: "Pre-Test Mekanika Kuantum",
    class: "Fisika XII",
    dueDate: "2024-03-29",
    duration: 60,
    questions: 40,
    status: "active",
    participants: 12,
    total: 18,
    avgScore: 0,
  },
  {
    id: 3,
    title: "Quiz Trigonometri - Mid Test",
    class: "Matematika XI",
    dueDate: "2024-03-27",
    duration: 45,
    questions: 30,
    status: "active",
    participants: 8,
    total: 22,
    avgScore: 75,
  },
  {
    id: 4,
    title: "Kuis Dinamika Partikel",
    class: "Fisika XI",
    dueDate: "2024-03-23",
    duration: 40,
    questions: 25,
    status: "completed",
    participants: 20,
    total: 20,
    avgScore: 88,
  },
  {
    id: 5,
    title: "Post-Test Limit Fungsi",
    class: "Matematika XII",
    dueDate: "2024-03-21",
    duration: 35,
    questions: 25,
    status: "completed",
    participants: 24,
    total: 24,
    avgScore: 85,
  },
];

export default function TutorQuizzes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.class.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || quiz.status === filter;
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
        className="bg-blue-500/10 text-blue-700 border-blue-500/20"
      >
        Selesai
      </Badge>
    );
  };

  const activeQuizzes = quizzes.filter((q) => q.status === "active").length;
  const totalParticipants = quizzes.reduce((acc, q) => acc + q.participants, 0);
  const completedQuizzes = quizzes.filter((q) => q.status === "completed");
  const overallAvgScore =
    completedQuizzes.length > 0
      ? Math.round(
          completedQuizzes.reduce((acc, q) => acc + q.avgScore, 0) /
            completedQuizzes.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kuis</h1>
          <p className="text-muted-foreground mt-1">
            Kelola kuis untuk semua kelas
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Buat Kuis Baru
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Kuis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizzes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kuis Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeQuizzes}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Partisipan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalParticipants}
            </div>
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
              {overallAvgScore}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari kuis..."
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
            <TabsTrigger value="completed">Selesai</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Quizzes List */}
      <div className="space-y-4">
        {filteredQuizzes.map((quiz) => (
          <Card key={quiz.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg">{quiz.title}</h3>
                    {getStatusBadge(quiz.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{quiz.class}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileQuestion className="h-4 w-4" />
                      <span>{quiz.questions} soal</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Timer className="h-4 w-4" />
                      <span>{quiz.duration} menit</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Deadline:{" "}
                        {new Date(quiz.dueDate).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>
                        {quiz.participants}/{quiz.total} partisipan
                      </span>
                    </div>
                  </div>
                  {quiz.avgScore > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Rata-rata Nilai:
                      </span>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        {quiz.avgScore}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 lg:shrink-0">
                  <Button variant="outline" size="sm">
                    Lihat Hasil
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
