"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  CheckCircle2,
  PlayCircle,
  FileQuestion,
  Calendar,
  Timer,
} from "lucide-react";

const quizzes = [
  {
    id: 1,
    title: "Kuis Harian Biologi - Sel",
    class: "Biologi XII",
    dueDate: "2024-03-26",
    duration: 30,
    questions: 20,
    status: "available",
    attempts: 0,
    maxAttempts: 1,
    passingScore: 75,
  },
  {
    id: 2,
    title: "Kuis Mingguan Matematika",
    class: "Matematika XII",
    dueDate: "2024-03-24",
    duration: 45,
    questions: 30,
    status: "completed",
    score: 88,
    totalScore: 100,
    attempts: 1,
    maxAttempts: 2,
    completedDate: "2024-03-21",
  },
  {
    id: 3,
    title: "Pre-Test Fisika Kuantum",
    class: "Fisika XII",
    dueDate: "2024-03-29",
    duration: 60,
    questions: 40,
    status: "available",
    attempts: 0,
    maxAttempts: 1,
    passingScore: 70,
  },
  {
    id: 4,
    title: "Kuis Bahasa Inggris - Tenses",
    class: "Bahasa Inggris XII",
    dueDate: "2024-03-20",
    duration: 25,
    questions: 25,
    status: "completed",
    score: 92,
    totalScore: 100,
    attempts: 1,
    maxAttempts: 2,
    completedDate: "2024-03-19",
    feedback: "Excellent work! Perfect understanding of tenses.",
  },
  {
    id: 5,
    title: "Kuis Sejarah Indonesia",
    class: "Sejarah XII",
    dueDate: "2024-03-23",
    duration: 40,
    questions: 30,
    status: "missed",
    attempts: 0,
    maxAttempts: 1,
  },
];

export default function Quizzes() {
  const [filter, setFilter] = useState<string>("all");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-700 border-green-500/20"
          >
            Tersedia
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-700 border-blue-500/20"
          >
            Selesai
          </Badge>
        );
      case "missed":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-700 border-red-500/20"
          >
            Terlewat
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <PlayCircle className="h-5 w-5 text-green-600" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
      case "missed":
        return <Clock className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const filteredQuizzes =
    filter === "all" ? quizzes : quizzes.filter((q) => q.status === filter);

  const stats = {
    total: quizzes.length,
    available: quizzes.filter((q) => q.status === "available").length,
    completed: quizzes.filter((q) => q.status === "completed").length,
    avgScore: Math.round(
      quizzes
        .filter((q) => q.score)
        .reduce((acc, q) => acc + (q.score || 0), 0) /
        quizzes.filter((q) => q.score).length
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Kuis</h1>
        <p className="text-muted-foreground mt-1">
          Ikuti kuis dan uji pemahaman Anda
        </p>
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
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tersedia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.available}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Selesai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.completed}
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
              {stats.avgScore || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Filter */}
      <Tabs defaultValue="all" className="w-full" onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="available">Tersedia</TabsTrigger>
          <TabsTrigger value="completed">Selesai</TabsTrigger>
          <TabsTrigger value="missed">Terlewat</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6 space-y-4">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(quiz.status)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{quiz.title}</h3>
                        {getStatusBadge(quiz.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {quiz.class}
                      </p>
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
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Percobaan: {quiz.attempts}/{quiz.maxAttempts}
                      </div>
                      {quiz.score !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Nilai:</span>
                          <Badge
                            className={`${
                              quiz.score >= (quiz.passingScore || 75)
                                ? "bg-green-500/10 text-green-700 border-green-500/20"
                                : "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                            }`}
                          >
                            {quiz.score}/{quiz.totalScore}
                          </Badge>
                        </div>
                      )}
                      {quiz.completedDate && (
                        <p className="text-sm text-muted-foreground">
                          Selesai:{" "}
                          {new Date(quiz.completedDate).toLocaleDateString(
                            "id-ID"
                          )}
                        </p>
                      )}
                      {quiz.feedback && (
                        <div className="bg-muted/50 p-3 rounded-md">
                          <p className="text-sm font-medium mb-1">Feedback:</p>
                          <p className="text-sm text-foreground/80">
                            {quiz.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 lg:flex-shrink-0">
                    {quiz.status === "available" && (
                      <Button className="w-full lg:w-auto">
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Mulai Kuis
                      </Button>
                    )}
                    {quiz.status === "completed" && (
                      <>
                        <Button variant="outline" className="w-full lg:w-auto">
                          Lihat Hasil
                        </Button>
                        {quiz.attempts < quiz.maxAttempts && (
                          <Button
                            variant="secondary"
                            className="w-full lg:w-auto"
                          >
                            Coba Lagi
                          </Button>
                        )}
                      </>
                    )}
                    {quiz.status === "missed" && (
                      <Button
                        variant="outline"
                        disabled
                        className="w-full lg:w-auto"
                      >
                        Terlewat
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
