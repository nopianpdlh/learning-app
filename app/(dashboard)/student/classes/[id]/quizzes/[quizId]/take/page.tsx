"use client";

/**
 * Student Quiz Taking Page
 * /student/classes/[id]/quizzes/[quizId]/take
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Question {
  id: string;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
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
  questions: Question[];
}

interface Answer {
  questionId: string;
  answer: string;
}

export default function TakeQuizPage({
  params,
}: {
  params: { id: string; quizId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Load quiz and start attempt
  useEffect(() => {
    const initQuiz = async () => {
      try {
        // Fetch quiz details
        const quizRes = await fetch(`/api/quizzes/${params.quizId}`);
        if (!quizRes.ok) {
          const data = await quizRes.json();
          throw new Error(data.error || "Failed to load quiz");
        }
        const quizData = await quizRes.json();

        // Check if already has attempt
        if (quizData.myAttempts && quizData.myAttempts.length > 0) {
          const attempt = quizData.myAttempts[0];
          if (attempt.submittedAt) {
            // Already completed, redirect to results
            router.push(
              `/student/classes/${params.id}/quizzes/${params.quizId}/results`
            );
            return;
          }
          // Continue existing attempt
          setAttemptId(attempt.id);
          // Calculate time remaining
          if (quizData.timeLimit) {
            const elapsed = Math.floor(
              (new Date().getTime() - new Date(attempt.startedAt).getTime()) /
                60000
            );
            const remaining = quizData.timeLimit - elapsed;
            setTimeRemaining(remaining > 0 ? remaining : 0);
          }
        } else {
          // Start new attempt
          const attemptRes = await fetch(
            `/api/quizzes/${params.quizId}/attempt`,
            {
              method: "POST",
            }
          );
          if (!attemptRes.ok) {
            const data = await attemptRes.json();
            throw new Error(data.error || "Failed to start quiz");
          }
          const attemptData = await attemptRes.json();
          setAttemptId(attemptData.attemptId);
          if (quizData.timeLimit) {
            setTimeRemaining(quizData.timeLimit);
          }
        }

        setQuiz(quizData);

        // Load saved answers from localStorage
        const savedAnswers = localStorage.getItem(
          `quiz_${params.quizId}_answers`
        );
        if (savedAnswers) {
          setAnswers(JSON.parse(savedAnswers));
        } else {
          // Initialize empty answers
          setAnswers(
            quizData.questions.map((q: Question) => ({
              questionId: q.id,
              answer: "",
            }))
          );
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initQuiz();
  }, [params.id, params.quizId, router]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          // Time's up! Auto-submit
          handleSubmitQuiz(true);
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timeRemaining]);

  // Save answers to localStorage
  useEffect(() => {
    if (answers.length > 0) {
      localStorage.setItem(
        `quiz_${params.quizId}_answers`,
        JSON.stringify(answers)
      );
    }
  }, [answers, params.quizId]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) =>
      prev.map((a) => (a.questionId === questionId ? { ...a, answer } : a))
    );
  };

  const handleSubmitQuiz = async (autoSubmit = false) => {
    if (!attemptId || !quiz) return;

    // Check if all questions answered
    const unansweredCount = answers.filter((a) => !a.answer.trim()).length;
    if (unansweredCount > 0 && !autoSubmit) {
      if (
        !confirm(
          `Anda belum menjawab ${unansweredCount} soal. Apakah yakin ingin submit?`
        )
      ) {
        return;
      }
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/quizzes/${params.quizId}/attempt`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          answers,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit quiz");
      }

      // Clear localStorage
      localStorage.removeItem(`quiz_${params.quizId}_answers`);

      // Redirect to results
      router.push(
        `/student/classes/${params.id}/quizzes/${params.quizId}/results`
      );
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} menit`;
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>Kembali</Button>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const currentAnswer = answers.find(
    (a) => a.questionId === currentQuestion.id
  );
  const answeredCount = answers.filter((a) => a.answer.trim()).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Timer Bar */}
      {timeRemaining !== null && (
        <div
          className={`sticky top-0 z-50 py-4 px-6 shadow-md ${
            timeRemaining <= 5 ? "bg-red-600" : "bg-blue-600"
          }`}
        >
          <div className="container mx-auto max-w-4xl flex items-center justify-between text-white">
            <span className="font-medium">
              ⏱️ Waktu Tersisa: {formatTime(timeRemaining)}
            </span>
            {timeRemaining <= 5 && (
              <span className="animate-pulse font-bold">
                ⚠️ WAKTU HAMPIR HABIS!
              </span>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-4xl py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {quiz.title}
          </h1>
          {quiz.description && (
            <p className="text-gray-600 mb-4">{quiz.description}</p>
          )}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Total Soal: {quiz.questions.length}</span>
            <span>
              Terjawab: {answeredCount} / {quiz.questions.length}
            </span>
          </div>
        </div>

        {/* Question Navigation */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Navigasi Soal:
          </h2>
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((q, index) => {
              const isAnswered = answers
                .find((a) => a.questionId === q.id)
                ?.answer.trim();
              const isCurrent = index === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    isCurrent
                      ? "bg-blue-600 text-white"
                      : isAnswered
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {index + 1}
                  {isAnswered && !isCurrent && " ✓"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Question */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Soal {currentQuestionIndex + 1} dari {quiz.questions.length}
            </h2>
            <span className="text-sm text-gray-600">
              {currentQuestion.points} poin
            </span>
          </div>

          <p className="text-gray-800 mb-6 text-lg leading-relaxed">
            {currentQuestion.questionText}
          </p>

          {/* Answer Input */}
          <div className="space-y-3">
            {currentQuestion.questionType === "MULTIPLE_CHOICE" && (
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      currentAnswer?.answer === option
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={currentAnswer?.answer === option}
                      onChange={(e) =>
                        handleAnswerChange(currentQuestion.id, e.target.value)
                      }
                      className="mt-1"
                    />
                    <span className="flex-1">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.questionType === "TRUE_FALSE" && (
              <div className="space-y-2">
                {["true", "false"].map((value) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      currentAnswer?.answer === value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={value}
                      checked={currentAnswer?.answer === value}
                      onChange={(e) =>
                        handleAnswerChange(currentQuestion.id, e.target.value)
                      }
                    />
                    <span className="flex-1">
                      {value === "true" ? "True (Benar)" : "False (Salah)"}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.questionType === "SHORT_ANSWER" && (
              <Input
                type="text"
                value={currentAnswer?.answer || ""}
                onChange={(e) =>
                  handleAnswerChange(currentQuestion.id, e.target.value)
                }
                placeholder="Tulis jawaban Anda..."
                className="text-lg p-4"
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              disabled={currentQuestionIndex === 0}
            >
              ← Sebelumnya
            </Button>
            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                className="flex-1"
              >
                Selanjutnya →
              </Button>
            ) : (
              <Button
                onClick={() => setShowConfirmModal(true)}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {submitting ? "Mengirim..." : "✓ Submit Kuis"}
              </Button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress:</span>
            <span className="font-medium text-gray-900">
              {answeredCount} / {quiz.questions.length} soal terjawab
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${(answeredCount / quiz.questions.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Konfirmasi Submit Kuis
            </h3>
            <p className="text-gray-600 mb-2">
              Anda yakin ingin submit kuis ini? Jawaban tidak dapat diubah
              setelah submit.
            </p>
            <p className="text-gray-800 font-medium mb-6">
              Soal terjawab: {answeredCount} / {quiz.questions.length}
            </p>
            {answeredCount < quiz.questions.length && (
              <p className="text-red-600 text-sm mb-4">
                ⚠️ Anda belum menjawab {quiz.questions.length - answeredCount}{" "}
                soal
              </p>
            )}
            <div className="flex gap-3">
              <Button
                onClick={() => handleSubmitQuiz()}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {submitting ? "Mengirim..." : "Ya, Submit"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="flex-1"
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
