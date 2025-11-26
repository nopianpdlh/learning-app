/**
 * Student Grades Page
 * /student/classes/[id]/grades
 */

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  calculateGradeBreakdown,
  formatGrade,
  formatPercentage,
  getGradeColor,
  getGradeBgColor,
  GradeItem,
} from "@/lib/gradebook";
import ClassHeader from "@/components/student/ClassHeader";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StudentGradesPage({ params }: PageProps) {
  const { id: classId } = await params;
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get user from database
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      studentProfile: true,
    },
  });

  if (!dbUser || dbUser.role !== "STUDENT" || !dbUser.studentProfile) {
    redirect("/");
  }

  // Verify student is enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_classId: {
        studentId: dbUser.studentProfile.id,
        classId,
      },
    },
    include: {
      class: true,
    },
  });

  if (!enrollment || !["PAID", "ACTIVE"].includes(enrollment.status)) {
    redirect("/student/classes");
  }

  // Get graded assignments
  const assignments = await prisma.assignment.findMany({
    where: { classId, status: "PUBLISHED" },
    include: {
      submissions: {
        where: {
          studentId: dbUser.studentProfile.id,
          status: "GRADED",
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const assignmentGrades: GradeItem[] = assignments
    .filter((a) => a.submissions.length > 0 && a.submissions[0].score !== null)
    .map((a) => ({
      id: a.id,
      title: a.title,
      score: a.submissions[0].score!,
      maxPoints: a.maxPoints,
      type: "assignment" as const,
      gradedAt: a.submissions[0].gradedAt!,
    }));

  // TODO: Add quiz grades when quiz feature is implemented
  const quizGrades: GradeItem[] = [];

  const breakdown = calculateGradeBreakdown(assignmentGrades, quizGrades);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <ClassHeader
        classId={classId}
        className={enrollment.class.name}
        currentSection="grades"
      />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nilai Saya</h1>
          <p className="text-gray-600 mt-2">
            Kelas: <span className="font-medium">{enrollment.class.name}</span>
          </p>
        </div>

        {/* Overall Grade Card */}
        <div
          className={`rounded-lg border-2 p-8 mb-8 ${getGradeBgColor(
            breakdown.overall.percentage
          )}`}
        >
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-2">Nilai Akhir</p>
            <p
              className={`text-6xl font-bold mb-2 ${getGradeColor(
                breakdown.overall.percentage
              )}`}
            >
              {formatPercentage(breakdown.overall.percentage)}
            </p>
            <p className="text-2xl font-semibold text-gray-700 mb-4">
              Grade: {breakdown.overall.letter}
            </p>
            <p
              className={`text-lg font-medium ${
                breakdown.overall.status === "passing"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {breakdown.overall.status === "passing"
                ? "✓ Lulus"
                : "✗ Belum Lulus"}
            </p>
          </div>
        </div>

        {/* Grade Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Assignments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              📝 Tugas (Bobot: {breakdown.assignments.weight * 100}%)
            </h3>
            {breakdown.assignments.items.length > 0 ? (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Total Score</span>
                    <span className="font-medium">
                      {breakdown.assignments.totalScore}/
                      {breakdown.assignments.totalMaxPoints}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        breakdown.assignments.percentage >= 80
                          ? "bg-green-500"
                          : breakdown.assignments.percentage >= 60
                          ? "bg-blue-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          breakdown.assignments.percentage,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="text-right mt-2">
                    <span
                      className={`text-xl font-bold ${getGradeColor(
                        breakdown.assignments.percentage
                      )}`}
                    >
                      {formatPercentage(breakdown.assignments.percentage)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {breakdown.assignments.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm py-2 border-t border-gray-100"
                    >
                      <span className="text-gray-700">{item.title}</span>
                      <span className="font-medium text-gray-900">
                        {formatGrade(item.score, item.maxPoints)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">
                Belum ada tugas yang dinilai
              </p>
            )}
          </div>

          {/* Quizzes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              📋 Quiz (Bobot: {breakdown.quizzes.weight * 100}%)
            </h3>
            {breakdown.quizzes.items.length > 0 ? (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Total Score</span>
                    <span className="font-medium">
                      {breakdown.quizzes.totalScore}/
                      {breakdown.quizzes.totalMaxPoints}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        breakdown.quizzes.percentage >= 80
                          ? "bg-green-500"
                          : breakdown.quizzes.percentage >= 60
                          ? "bg-blue-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          breakdown.quizzes.percentage,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="text-right mt-2">
                    <span
                      className={`text-xl font-bold ${getGradeColor(
                        breakdown.quizzes.percentage
                      )}`}
                    >
                      {formatPercentage(breakdown.quizzes.percentage)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {breakdown.quizzes.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm py-2 border-t border-gray-100"
                    >
                      <span className="text-gray-700">{item.title}</span>
                      <span className="font-medium text-gray-900">
                        {formatGrade(item.score, item.maxPoints)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">
                Belum ada quiz yang dinilai (fitur akan datang)
              </p>
            )}
          </div>
        </div>

        {/* Recent Grades Table */}
        {assignmentGrades.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                Riwayat Penilaian Terbaru
              </h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tugas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Dinilai
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nilai
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Persentase
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignmentGrades
                  .sort(
                    (a, b) =>
                      new Date(b.gradedAt).getTime() -
                      new Date(a.gradedAt).getTime()
                  )
                  .map((grade) => {
                    const percentage = (grade.score / grade.maxPoints) * 100;
                    return (
                      <tr key={grade.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {grade.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(grade.gradedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {formatGrade(grade.score, grade.maxPoints)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span
                            className={`font-bold ${getGradeColor(percentage)}`}
                          >
                            {formatPercentage(percentage)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Catatan:</span> Nilai akhir dihitung
            dari rata-rata semua tugas dan quiz yang sudah dinilai. Bobot: Tugas
            60%, Quiz 40%. Minimal nilai kelulusan adalah 60%.
          </p>
        </div>
      </div>
    </>
  );
}
