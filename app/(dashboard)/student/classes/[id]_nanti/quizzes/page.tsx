/**
 * Student Quiz List Page
 * /student/classes/[id]/quizzes
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function StudentQuizzesPage({ params }: PageProps) {
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

  // Verify student is enrolled
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      classId: params.id,
      studentId: user.id,
      status: { in: ["PAID", "ACTIVE"] },
    },
    select: {
      id: true,
      class: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!enrollment) {
    redirect("/student/dashboard");
  }

  // Fetch published quizzes with student attempts
  const quizzes = await prisma.quiz.findMany({
    where: {
      classId: params.id,
      status: "PUBLISHED",
    },
    include: {
      _count: {
        select: { questions: true },
      },
      attempts: {
        where: { studentId: user.id },
        orderBy: { startedAt: "desc" },
        select: {
          id: true,
          startedAt: true,
          submittedAt: true,
          score: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Kuis Online</h1>
        <p className="text-gray-600 mt-2">
          Kelas: <span className="font-medium">{enrollment.class.name}</span>
        </p>
      </div>

      {/* Quiz List */}
      {quizzes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 text-lg mb-4">
            Belum ada kuis yang tersedia.
          </p>
          <p className="text-gray-500">
            Tutor belum membuat kuis untuk kelas ini.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {quizzes.map((quiz) => {
            const myAttempt = quiz.attempts[0];
            const isCompleted = myAttempt?.submittedAt;
            const isInProgress = myAttempt && !myAttempt.submittedAt;
            const isAvailable =
              (!quiz.startDate || new Date(quiz.startDate) <= new Date()) &&
              (!quiz.endDate || new Date(quiz.endDate) >= new Date());

            // Calculate total points
            const totalPoints = quiz._count.questions * 10; // Assuming 10 points per question default

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Title and Status */}
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="text-xl font-bold text-gray-900">
                        {quiz.title}
                      </h2>
                      {isCompleted && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                          ✓ Selesai
                        </span>
                      )}
                      {isInProgress && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                          ⏳ Sedang Dikerjakan
                        </span>
                      )}
                      {!myAttempt && !isAvailable && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                          🔒 Belum Tersedia
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {quiz.description && (
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {quiz.description}
                      </p>
                    )}

                    {/* Quiz Details */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{quiz._count.questions} Soal</span>
                      </div>

                      {quiz.timeLimit && (
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{quiz.timeLimit} Menit</span>
                        </div>
                      )}

                      {quiz.passingGrade && (
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          <span>Nilai Kelulusan: {quiz.passingGrade}%</span>
                        </div>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      {quiz.startDate && (
                        <span>
                          Mulai: {formatDate(new Date(quiz.startDate))}
                        </span>
                      )}
                      {quiz.endDate && (
                        <span>
                          Berakhir: {formatDate(new Date(quiz.endDate))}
                        </span>
                      )}
                    </div>

                    {/* Score (if completed) */}
                    {isCompleted && myAttempt.score !== null && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-green-600">
                            Nilai: {myAttempt.score} / {totalPoints}
                          </span>
                          <span className="text-gray-600">
                            ({Math.round((myAttempt.score / totalPoints) * 100)}
                            %)
                          </span>
                          {quiz.passingGrade &&
                            (myAttempt.score / totalPoints) * 100 >=
                              quiz.passingGrade && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                LULUS ✓
                              </span>
                            )}
                          {quiz.passingGrade &&
                            (myAttempt.score / totalPoints) * 100 <
                              quiz.passingGrade && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                                TIDAK LULUS
                              </span>
                            )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="ml-6">
                    {isCompleted ? (
                      <Link
                        href={`/student/classes/${params.id}/quizzes/${quiz.id}/results`}
                      >
                        <Button>Lihat Hasil</Button>
                      </Link>
                    ) : isInProgress ? (
                      <Link
                        href={`/student/classes/${params.id}/quizzes/${quiz.id}/take`}
                      >
                        <Button variant="outline">Lanjutkan</Button>
                      </Link>
                    ) : isAvailable ? (
                      <Link
                        href={`/student/classes/${params.id}/quizzes/${quiz.id}/take`}
                      >
                        <Button>Mulai Kuis</Button>
                      </Link>
                    ) : (
                      <Button disabled>Belum Tersedia</Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
