"use client";

/**
 * QuizzesClient Component
 * Client-side component for student quizzes list with filtering
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  AlertCircle,
  Eye,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  startDate: string | null;
  endDate: string | null;
  passingGrade: number;
  createdAt: string;
  class: {
    id: string;
    name: string;
    subject: string;
  };
  questionCount: number;
  attemptCount: number;
  maxAttempts: number;
  effectiveStatus: string;
  canRetry: boolean;
  bestScore: number | null;
  lastAttemptAt: string | null;
}

interface Stats {
  total: number;
  available: number;
  completed: number;
  missed: number;
  avgScore: number;
}

interface QuizzesClientProps {
  initialQuizzes: Quiz[];
  initialStats: Stats;
}

export default function QuizzesClient({
  initialQuizzes,
  initialStats,
}: QuizzesClientProps) {
  const router = useRouter();
  const [quizzes] = useState<Quiz[]>(initialQuizzes);
  const [stats] = useState<Stats>(initialStats);
  const [filter, setFilter] = useState<string>("all");
  const [startingQuiz, setStartingQuiz] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-700 border-green-500/20"
          >
            Tersedia
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
          >
            Sedang Dikerjakan
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-700 border-blue-500/20"
          >
            Selesai
          </Badge>
        );
      case "MISSED":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-700 border-red-500/20"
          >
            Terlewat
          </Badge>
        );
      case "UPCOMING":
        return (
          <Badge
            variant="outline"
            className="bg-gray-500/10 text-gray-700 border-gray-500/20"
          >
            Akan Datang
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <PlayCircle className="h-5 w-5 text-green-600" />;
      case "IN_PROGRESS":
        return <Timer className="h-5 w-5 text-yellow-600" />;
      case "COMPLETED":
        return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
      case "MISSED":
        return <Clock className="h-5 w-5 text-red-600" />;
      case "UPCOMING":
        return <Calendar className="h-5 w-5 text-gray-600" />;
      default:
        return null;
    }
  };

  const getFilteredQuizzes = () => {
    if (filter === "all") return quizzes;
    if (filter === "available")
      return quizzes.filter(
        (q) =>
          q.effectiveStatus === "AVAILABLE" ||
          q.effectiveStatus === "IN_PROGRESS"
      );
    if (filter === "completed")
      return quizzes.filter((q) => q.effectiveStatus === "COMPLETED");
    if (filter === "missed")
      return quizzes.filter((q) => q.effectiveStatus === "MISSED");
    return quizzes;
  };

  const handleStartQuiz = async (quiz: Quiz) => {
    setStartingQuiz(quiz.id);
    try {
      const response = await fetch(`/api/student/quizzes/${quiz.id}/start`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start quiz");
      }

      const result = await response.json();

      if (result.success) {
        router.push(
          `/student/quizzes/${quiz.id}?attemptId=${result.attempt.id}`
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memulai kuis"
      );
    } finally {
      setStartingQuiz(null);
    }
  };

  const handleViewResult = (quizId: string) => {
    router.push(`/student/quizzes/${quizId}/result`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID");
  };

  const filteredQuizzes = getFilteredQuizzes();

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
          <TabsTrigger value="all">Semua ({stats.total})</TabsTrigger>
          <TabsTrigger value="available">
            Tersedia ({stats.available})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Selesai ({stats.completed})
          </TabsTrigger>
          <TabsTrigger value="missed">Terlewat ({stats.missed})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6 space-y-4">
          {filteredQuizzes.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <FileQuestion className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada kuis</p>
              </CardContent>
            </Card>
          ) : (
            filteredQuizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="shrink-0">
                        {getStatusIcon(quiz.effectiveStatus)}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">
                            {quiz.title}
                          </h3>
                          {getStatusBadge(quiz.effectiveStatus)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {quiz.class.name} • {quiz.class.subject}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <FileQuestion className="h-4 w-4" />
                            <span>{quiz.questionCount} soal</span>
                          </div>
                          {quiz.timeLimit && (
                            <div className="flex items-center gap-1">
                              <Timer className="h-4 w-4" />
                              <span>{quiz.timeLimit} menit</span>
                            </div>
                          )}
                          {quiz.endDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Deadline: {formatDate(quiz.endDate)}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Percobaan: {quiz.attemptCount}/{quiz.maxAttempts}
                        </div>
                        {quiz.bestScore !== null && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Nilai:</span>
                            <Badge
                              className={`${
                                quiz.bestScore >= quiz.passingGrade
                                  ? "bg-green-500/10 text-green-700 border-green-500/20"
                                  : "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                              }`}
                            >
                              {quiz.bestScore}/100
                            </Badge>
                          </div>
                        )}
                        {quiz.lastAttemptAt && (
                          <p className="text-sm text-muted-foreground">
                            Selesai: {formatDate(quiz.lastAttemptAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 lg:shrink-0">
                      {(quiz.effectiveStatus === "AVAILABLE" ||
                        quiz.effectiveStatus === "IN_PROGRESS") && (
                        <Button
                          className="w-full lg:w-auto"
                          onClick={() => handleStartQuiz(quiz)}
                          disabled={startingQuiz === quiz.id}
                        >
                          <PlayCircle className="mr-2 h-4 w-4" />
                          {startingQuiz === quiz.id
                            ? "Memulai..."
                            : quiz.effectiveStatus === "IN_PROGRESS"
                            ? "Lanjutkan"
                            : "Mulai Kuis"}
                        </Button>
                      )}
                      {quiz.effectiveStatus === "COMPLETED" && (
                        <>
                          <Button
                            variant="outline"
                            className="w-full lg:w-auto"
                            onClick={() => handleViewResult(quiz.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Lihat Hasil
                          </Button>
                          {quiz.canRetry && (
                            <Button
                              variant="secondary"
                              className="w-full lg:w-auto"
                              onClick={() => handleStartQuiz(quiz)}
                              disabled={startingQuiz === quiz.id}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Coba Lagi
                            </Button>
                          )}
                        </>
                      )}
                      {quiz.effectiveStatus === "MISSED" && (
                        <Button
                          variant="outline"
                          disabled
                          className="w-full lg:w-auto"
                        >
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Terlewat
                        </Button>
                      )}
                      {quiz.effectiveStatus === "UPCOMING" && (
                        <Button
                          variant="outline"
                          disabled
                          className="w-full lg:w-auto"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Belum Dimulai
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
