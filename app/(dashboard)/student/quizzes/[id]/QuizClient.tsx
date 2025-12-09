"use client";

/**
 * QuizClient Component
 * Quiz taking interface with timer, question navigation, and auto-submit
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Send,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  questionType: string;
  questionText: string;
  options: string[];
  points: number;
  orderIndex: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  class: {
    id: string;
    name: string;
    subject: string;
  };
  questions: Question[];
  questionCount: number;
  totalPoints: number;
}

interface QuizClientProps {
  quiz: Quiz;
  attemptId: string;
  startedAt: string;
}

export default function QuizClient({
  quiz,
  attemptId,
  startedAt,
}: QuizClientProps) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);

  // Initialize timer
  useEffect(() => {
    if (quiz.timeLimit) {
      const startTime = new Date(startedAt).getTime();
      const endTime = startTime + quiz.timeLimit * 60 * 1000;
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
    }
  }, [quiz.timeLimit, startedAt]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Auto-submit when time is up
  useEffect(() => {
    if (timeLeft === 0 && !isSubmitting) {
      setShowTimeUpDialog(true);
    }
  }, [timeLeft, isSubmitting]);

  const handleAutoSubmit = useCallback(async () => {
    setShowTimeUpDialog(false);
    await handleSubmit(true);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    setIsSubmitting(true);
    try {
      const submissionAnswers = quiz.questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || "",
      }));

      const response = await fetch(`/api/student/quizzes/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          answers: submissionAnswers,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit");
      }

      const result = await response.json();

      if (result.success) {
        toast.success(
          isAutoSubmit
            ? "Waktu habis! Kuis telah disubmit otomatis"
            : "Kuis berhasil disubmit!"
        );
        router.push(
          `/student/quizzes/${quiz.id}/result?attemptId=${attemptId}`
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal submit kuis");
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).filter((key) =>
    answers[key]?.trim()
  ).length;

  const question = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;
  const isFirstQuestion = currentQuestion === 0;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{quiz.title}</h1>
            <p className="text-muted-foreground">
              {quiz.class.name} • {quiz.class.subject}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-medium">
                {answeredCount}/{quiz.questionCount}
              </span>
            </div>
            {/* Timer */}
            {timeLeft !== null && (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  timeLeft <= 60
                    ? "bg-red-100 text-red-700"
                    : timeLeft <= 300
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-muted"
                }`}
              >
                <Clock className="h-5 w-5" />
                <span className="font-mono font-bold text-lg">
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Question Navigation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Navigasi Soal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {quiz.questions.map((q, index) => (
                <Button
                  key={q.id}
                  variant={currentQuestion === index ? "default" : "outline"}
                  size="sm"
                  className={`w-10 h-10 ${
                    answers[q.id]?.trim()
                      ? "ring-2 ring-green-500 ring-offset-1"
                      : ""
                  }`}
                  onClick={() => setCurrentQuestion(index)}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Question */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Soal {currentQuestion + 1} dari {quiz.questionCount}
              </CardTitle>
              <Badge variant="outline">{question.points} poin</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg">{question.questionText}</p>

            {question.questionType === "MULTIPLE_CHOICE" && (
              <RadioGroup
                value={answers[question.id] || ""}
                onValueChange={(value) => handleAnswer(question.id, value)}
                className="space-y-3"
              >
                {question.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  >
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {question.questionType === "TRUE_FALSE" && (
              <RadioGroup
                value={answers[question.id] || ""}
                onValueChange={(value) => handleAnswer(question.id, value)}
                className="space-y-3"
              >
                {["Benar", "Salah"].map((option) => (
                  <div
                    key={option}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  >
                    <RadioGroupItem value={option} id={`option-${option}`} />
                    <Label
                      htmlFor={`option-${option}`}
                      className="flex-1 cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {question.questionType === "SHORT_ANSWER" && (
              <Input
                placeholder="Ketik jawaban Anda..."
                value={answers[question.id] || ""}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
                className="text-lg"
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion((prev) => prev - 1)}
            disabled={isFirstQuestion}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Sebelumnya
          </Button>

          <div className="flex gap-2">
            {!isLastQuestion ? (
              <Button onClick={() => setCurrentQuestion((prev) => prev + 1)}>
                Selanjutnya
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Selesai & Kirim
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Submit Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kirim Kuis?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda telah menjawab {answeredCount} dari {quiz.questionCount}{" "}
              soal.
              {answeredCount < quiz.questionCount && (
                <span className="text-orange-600 block mt-2">
                  <AlertTriangle className="inline h-4 w-4 mr-1" />
                  Masih ada {quiz.questionCount - answeredCount} soal yang belum
                  dijawab!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSubmit(false)}>
              Kirim Kuis
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Time Up Dialog */}
      <AlertDialog open={showTimeUpDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              <Clock className="inline h-5 w-5 mr-2" />
              Waktu Habis!
            </AlertDialogTitle>
            <AlertDialogDescription>
              Waktu pengerjaan kuis telah habis. Jawaban Anda akan disubmit
              secara otomatis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleAutoSubmit}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
