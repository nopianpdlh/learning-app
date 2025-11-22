"use client";

/**
 * Tutor Quiz Results Page
 * /tutor/classes/[id]/quizzes/[quizId]/results
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface Answer {
  questionId: string;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean | null;
  points: number;
  maxPoints: number;
}

interface Attempt {
  id: string;
  student: Student;
  submittedAt: Date | null;
  score: number | null;
  percentage: number;
  passed: boolean | null;
  answers: Answer[];
}

interface QuizResult {
  quiz: {
    id: string;
    title: string;
    className: string;
    totalPoints: number;
    passingGrade: number | null;
  };
  statistics: {
    totalAttempts: number;
    avgScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number | null;
  };
  attempts: Attempt[];
}

export default function TutorQuizResultsPage({
  params,
}: {
  params: { id: string; quizId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<QuizResult | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Attempt | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "score" | "time">("score");
  const [filterBy, setFilterBy] = useState<"all" | "passed" | "failed">("all");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/quizzes/${params.quizId}/results`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to load results");
        }
        const resultsData = await response.json();
        setData(resultsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [params.quizId]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl py-8 px-4">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto max-w-6xl py-8 px-4">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-red-600 mb-4">
            {error || "Failed to load results"}
          </p>
          <Button onClick={() => router.back()}>Kembali</Button>
        </div>
      </div>
    );
  }

  // Filter attempts
  let filteredAttempts = [...data.attempts];
  if (filterBy === "passed") {
    filteredAttempts = filteredAttempts.filter((a) => a.passed);
  } else if (filterBy === "failed") {
    filteredAttempts = filteredAttempts.filter((a) => a.passed === false);
  }

  // Sort attempts
  filteredAttempts.sort((a, b) => {
    if (sortBy === "name") {
      return a.student.name.localeCompare(b.student.name);
    } else if (sortBy === "score") {
      return (b.score || 0) - (a.score || 0);
    } else {
      return (
        new Date(b.submittedAt || 0).getTime() -
        new Date(a.submittedAt || 0).getTime()
      );
    }
  });

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Score",
      "Percentage",
      "Status",
      "Submitted At",
    ];
    const rows = data.attempts.map((a) => [
      a.student.name,
      a.student.email,
      a.score?.toString() || "0",
      `${a.percentage}%`,
      a.passed === null ? "N/A" : a.passed ? "LULUS" : "TIDAK LULUS",
      a.submittedAt ? new Date(a.submittedAt).toLocaleString("id-ID") : "N/A",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz-${params.quizId}-results.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hasil Kuis: {data.quiz.title}
            </h1>
            <p className="text-gray-600">Kelas: {data.quiz.className}</p>
          </div>
          <Button onClick={() => router.back()} variant="outline">
            ← Kembali
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Attempt</p>
          <p className="text-3xl font-bold text-gray-900">
            {data.statistics.totalAttempts}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Rata-rata Nilai</p>
          <p className="text-3xl font-bold text-blue-600">
            {data.statistics.avgScore}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Nilai Tertinggi</p>
          <p className="text-3xl font-bold text-green-600">
            {data.statistics.highestScore}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Nilai Terendah</p>
          <p className="text-3xl font-bold text-red-600">
            {data.statistics.lowestScore}
          </p>
        </div>
        {data.statistics.passRate !== null && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Tingkat Kelulusan</p>
            <p className="text-3xl font-bold text-purple-600">
              {data.statistics.passRate}%
            </p>
          </div>
        )}
      </div>

      {/* Filters and Export */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            {/* Sort */}
            <div>
              <label className="text-sm text-gray-600 mr-2">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "name" | "score" | "time")
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="score">Nilai (Tertinggi)</option>
                <option value="name">Nama (A-Z)</option>
                <option value="time">Waktu Submit (Terbaru)</option>
              </select>
            </div>

            {/* Filter */}
            {data.quiz.passingGrade && (
              <div>
                <label className="text-sm text-gray-600 mr-2">Filter:</label>
                <select
                  value={filterBy}
                  onChange={(e) =>
                    setFilterBy(e.target.value as "all" | "passed" | "failed")
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua</option>
                  <option value="passed">Lulus</option>
                  <option value="failed">Tidak Lulus</option>
                </select>
              </div>
            )}
          </div>

          {/* Export */}
          <Button onClick={exportToCSV} variant="outline">
            📥 Export CSV
          </Button>
        </div>
      </div>

      {/* Attempts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Siswa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Waktu Submit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nilai
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Persentase
                </th>
                {data.quiz.passingGrade && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAttempts.length === 0 ? (
                <tr>
                  <td
                    colSpan={data.quiz.passingGrade ? 6 : 5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Tidak ada data yang sesuai filter
                  </td>
                </tr>
              ) : (
                filteredAttempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 h-10 w-10">
                          {attempt.student.avatar ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={attempt.student.avatar}
                              alt={attempt.student.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                              {attempt.student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {attempt.student.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {attempt.student.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {attempt.submittedAt
                        ? new Date(attempt.submittedAt).toLocaleString(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {attempt.score} / {data.quiz.totalPoints}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {attempt.percentage}%
                      </div>
                    </td>
                    {data.quiz.passingGrade && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attempt.passed ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            LULUS
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            TIDAK LULUS
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedStudent(attempt)}
                      >
                        Lihat Detail
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Detail Jawaban: {selectedStudent.student.name}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Nilai: {selectedStudent.score} / {data.quiz.totalPoints} (
                    {selectedStudent.percentage}%)
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStudent(null)}
                >
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {selectedStudent.answers.map((answer, index) => (
                <div
                  key={answer.questionId}
                  className={`border-l-4 rounded-lg p-4 ${
                    answer.isCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-medium text-gray-900">
                      #{index + 1}. {answer.questionText}
                    </p>
                    <span
                      className={`text-sm font-medium ${
                        answer.isCorrect ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {answer.points} / {answer.maxPoints} poin
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Jawaban Siswa:</p>
                      <p
                        className={`font-medium ${
                          answer.isCorrect ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {answer.studentAnswer}
                      </p>
                    </div>
                    {!answer.isCorrect && (
                      <div>
                        <p className="text-sm text-gray-600">Jawaban Benar:</p>
                        <p className="font-medium text-green-700">
                          {answer.correctAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
