/**
 * Student Quiz Results Page
 * /student/classes/[id]/quizzes/[quizId]/results
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: {
    id: string;
    quizId: string;
  };
}

export default async function StudentQuizResultsPage({ params }: PageProps) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user role
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!profile || profile.role !== "STUDENT") {
    redirect("/");
  }

  // Verify enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      classId: params.id,
      studentId: user.id,
      status: { in: ["PAID", "ACTIVE"] },
    },
  });

  if (!enrollment) {
    redirect("/student/dashboard");
  }

  // Fetch quiz with attempt
  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
      },
      attempts: {
        where: {
          studentId: user.id,
          submittedAt: { not: null },
        },
        include: {
          answers: true,
        },
        orderBy: { submittedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!quiz || quiz.attempts.length === 0) {
    redirect(`/student/classes/${params.id}/quizzes`);
  }

  const attempt = quiz.attempts[0];
  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
  const score = attempt.score || 0;
  const percentage = Math.round((score / totalPoints) * 100);

  // Calculate letter grade
  let letterGrade = "F";
  if (percentage >= 90) letterGrade = "A";
  else if (percentage >= 80) letterGrade = "B";
  else if (percentage >= 70) letterGrade = "C";
  else if (percentage >= 60) letterGrade = "D";

  const passed = quiz.passingGrade
    ? percentage >= quiz.passingGrade
    : percentage >= 60;

  // Count correct/incorrect
  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
  const incorrectCount = quiz.questions.length - correctCount;

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hasil Kuis</h1>
        <p className="text-gray-600">{quiz.title}</p>
      </div>

      {/* Score Card */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-blue-700 text-white text-4xl font-bold mb-4">
            {letterGrade}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {score} / {totalPoints}
          </h2>
          <p className="text-xl text-gray-600 mb-4">{percentage}%</p>
          {passed ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>LULUS ✓</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full font-medium">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>TIDAK LULUS</span>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {quiz.questions.length}
            </p>
            <p className="text-sm text-gray-600">Total Soal</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{correctCount}</p>
            <p className="text-sm text-gray-600">Benar</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{incorrectCount}</p>
            <p className="text-sm text-gray-600">Salah</p>
          </div>
        </div>
      </div>

      {/* Question Breakdown */}
      <div className="space-y-4 mb-8">
        <h2 className="text-xl font-bold text-gray-900">Detail Jawaban</h2>
        {quiz.questions.map((question, index) => {
          const answer = attempt.answers.find(
            (a) => a.questionId === question.id
          );
          const isCorrect = answer?.isCorrect || false;

          return (
            <div
              key={question.id}
              className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                isCorrect ? "border-green-500" : "border-red-500"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      Soal #{index + 1}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        isCorrect
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {isCorrect ? "✓ Benar" : "✗ Salah"}
                    </span>
                    <span className="text-sm text-gray-600">
                      {isCorrect ? question.points : 0} / {question.points} poin
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {question.questionText}
                  </p>
                </div>
              </div>

              {/* Answer Details */}
              <div className="space-y-3">
                {/* Student's Answer */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Jawaban Anda:</p>
                  <p
                    className={`font-medium ${
                      isCorrect ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {answer?.answer || "(Tidak dijawab)"}
                  </p>
                </div>

                {/* Correct Answer (if wrong) */}
                {!isCorrect && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Jawaban yang Benar:
                    </p>
                    <p className="font-medium text-green-600">
                      {question.correctAnswer}
                    </p>
                  </div>
                )}

                {/* Explanation */}
                {question.explanation && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Penjelasan:</p>
                    <p className="text-gray-800">{question.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href={`/student/classes/${params.id}/quizzes`} className="flex-1">
          <Button variant="outline" className="w-full">
            ← Kembali ke Daftar Kuis
          </Button>
        </Link>
        <Link
          href={`/student/classes/${params.id}/dashboard`}
          className="flex-1"
        >
          <Button className="w-full">Ke Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
