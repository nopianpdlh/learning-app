/**
 * Quiz Result Page - Server Component
 * Shows quiz result with detailed answer breakdown
 */

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Trophy,
  Target,
  Clock,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attemptId?: string }>;
}

export default async function QuizResultPage({
  params,
  searchParams,
}: PageProps) {
  const { id: quizId } = await params;
  const { attemptId } = await searchParams;

  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get student profile
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });

  if (!studentProfile) {
    redirect("/login");
  }

  // Get quiz with questions
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          subject: true,
        },
      },
      questions: {
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          questionType: true,
          questionText: true,
          options: true,
          correctAnswer: true,
          explanation: true,
          points: true,
          orderIndex: true,
        },
      },
    },
  });

  if (!quiz) {
    notFound();
  }

  // Get attempt
  let attempt;
  if (attemptId) {
    attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { answers: true },
    });
    if (!attempt || attempt.studentId !== studentProfile.id) {
      redirect("/student/quizzes");
    }
  } else {
    // Get best attempt
    attempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        studentId: studentProfile.id,
        submittedAt: { not: null },
      },
      orderBy: { score: "desc" },
      include: { answers: true },
    });
  }

  if (!attempt || !attempt.submittedAt) {
    redirect("/student/quizzes");
  }

  // Build result data
  const questionsWithAnswers = quiz.questions.map((question) => {
    const studentAnswer = attempt.answers.find(
      (a) => a.questionId === question.id
    );
    return {
      ...question,
      studentAnswer: studentAnswer?.answer || null,
      isCorrect: studentAnswer?.isCorrect || false,
      earnedPoints: studentAnswer?.isCorrect ? question.points : 0,
    };
  });

  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
  const earnedPoints = questionsWithAnswers.reduce(
    (sum, q) => sum + q.earnedPoints,
    0
  );
  const correctCount = questionsWithAnswers.filter((q) => q.isCorrect).length;
  const score = attempt.score || 0;
  const passed = score >= (quiz.passingGrade || 70);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/student/quizzes">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hasil Kuis</h1>
          <p className="text-muted-foreground">{quiz.title}</p>
        </div>
      </div>

      {/* Score Card */}
      <Card
        className={`${
          passed
            ? "border-green-500 bg-green-50"
            : "border-yellow-500 bg-yellow-50"
        }`}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className={`p-4 rounded-full ${
                  passed ? "bg-green-100" : "bg-yellow-100"
                }`}
              >
                <Trophy
                  className={`h-8 w-8 ${
                    passed ? "text-green-600" : "text-yellow-600"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nilai Anda</p>
                <p
                  className={`text-4xl font-bold ${
                    passed ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {score}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">Benar</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {correctCount}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">Salah</span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {quiz.questions.length - correctCount}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Target className="h-4 w-4" />
                  <span className="text-sm">Poin</span>
                </div>
                <p className="text-2xl font-bold">
                  {earnedPoints}/{totalPoints}
                </p>
              </div>
            </div>

            <Badge
              className={`text-lg px-4 py-2 ${
                passed
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-yellow-500 hover:bg-yellow-600"
              }`}
            >
              {passed ? "LULUS" : "BELUM LULUS"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Time Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>
          Dikerjakan pada{" "}
          {new Date(attempt.submittedAt).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Review Questions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Review Jawaban</h2>

        {questionsWithAnswers.map((question, index) => (
          <Card
            key={question.id}
            className={`${
              question.isCorrect
                ? "border-l-4 border-l-green-500"
                : "border-l-4 border-l-red-500"
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Soal {index + 1}</CardTitle>
                <div className="flex items-center gap-2">
                  {question.isCorrect ? (
                    <Badge className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Benar
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Salah
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {question.earnedPoints}/{question.points} poin
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{question.questionText}</p>

              {(question.questionType === "MULTIPLE_CHOICE" ||
                question.questionType === "TRUE_FALSE") && (
                <div className="space-y-2">
                  {(question.questionType === "TRUE_FALSE"
                    ? ["Benar", "Salah"]
                    : question.options
                  ).map((option, optIndex) => {
                    const isCorrectAnswer =
                      option.toLowerCase().trim() ===
                      question.correctAnswer.toLowerCase().trim();
                    const isStudentAnswer =
                      option.toLowerCase().trim() ===
                      question.studentAnswer?.toLowerCase().trim();

                    return (
                      <div
                        key={optIndex}
                        className={`p-3 rounded-lg border ${
                          isCorrectAnswer
                            ? "bg-green-50 border-green-300"
                            : isStudentAnswer
                            ? "bg-red-50 border-red-300"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          <div className="flex gap-2">
                            {isCorrectAnswer && (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-700"
                              >
                                Jawaban Benar
                              </Badge>
                            )}
                            {isStudentAnswer && !isCorrectAnswer && (
                              <Badge
                                variant="outline"
                                className="bg-red-100 text-red-700"
                              >
                                Jawaban Anda
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {question.questionType === "SHORT_ANSWER" && (
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">
                      Jawaban Anda:
                    </p>
                    <p className="font-medium">
                      {question.studentAnswer || "(Tidak dijawab)"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 border border-green-300">
                    <p className="text-sm text-muted-foreground">
                      Jawaban Benar:
                    </p>
                    <p className="font-medium text-green-700">
                      {question.correctAnswer}
                    </p>
                  </div>
                </div>
              )}

              {question.explanation && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm font-medium text-blue-700 mb-1">
                    Penjelasan:
                  </p>
                  <p className="text-sm text-blue-600">
                    {question.explanation}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Back Button */}
      <div className="flex justify-center pt-4">
        <Link href="/student/quizzes">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Kuis
          </Button>
        </Link>
      </div>
    </div>
  );
}
