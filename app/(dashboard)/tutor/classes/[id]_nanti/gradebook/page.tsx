/**
 * Tutor Gradebook Page
 * /tutor/classes/[id]/gradebook
 */

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  calculateGradeBreakdown,
  getGradeStatistics,
  formatGrade,
  formatPercentage,
  getGradeColor,
  GradeItem,
} from "@/lib/gradebook";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function TutorGradebookPage({ params }: PageProps) {
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
      tutorProfile: true,
    },
  });

  if (!dbUser || dbUser.role !== "TUTOR") {
    redirect("/");
  }

  // Get class data
  const classData = await prisma.class.findUnique({
    where: { id: params.id },
  });

  if (!classData) {
    redirect("/tutor/dashboard");
  }

  // Verify tutor owns this class
  if (classData.tutorId !== dbUser.tutorProfile?.id) {
    redirect("/tutor/dashboard");
  }

  // Get all enrolled students
  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId: params.id,
      status: { in: ["PAID", "ACTIVE"] },
    },
    include: {
      student: {
        include: {
          user: true,
        },
      },
    },
  });

  // Get all assignments
  const assignments = await prisma.assignment.findMany({
    where: { classId: params.id, status: "PUBLISHED" },
    include: {
      submissions: {
        where: { status: "GRADED" },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  // Build gradebook data
  const gradebookData = enrollments.map((enrollment) => {
    const studentId = enrollment.student.id;

    // Get assignment grades
    const assignmentGrades: GradeItem[] = assignments
      .filter((a) => {
        const submission = a.submissions.find((s) => s.studentId === studentId);
        return submission && submission.score !== null;
      })
      .map((a) => {
        const submission = a.submissions.find(
          (s) => s.studentId === studentId
        )!;
        return {
          id: a.id,
          title: a.title,
          score: submission.score!,
          maxPoints: a.maxPoints,
          type: "assignment" as const,
          gradedAt: submission.gradedAt!,
        };
      });

    // Create a map for easy lookup
    const gradeMap = new Map(assignmentGrades.map((g) => [g.id, g]));

    // Calculate breakdown
    const breakdown = calculateGradeBreakdown(assignmentGrades, []);

    return {
      student: {
        id: enrollment.student.id,
        name: enrollment.student.user.name,
        email: enrollment.student.user.email,
        avatar: enrollment.student.user.avatar,
      },
      grades: assignments.map((a) => {
        const grade = gradeMap.get(a.id);
        return grade ? grade.score : null;
      }),
      breakdown,
    };
  });

  // Sort by overall percentage descending
  gradebookData.sort(
    (a, b) => b.breakdown.overall.percentage - a.breakdown.overall.percentage
  );

  // Calculate statistics
  const allPercentages = gradebookData.map(
    (d) => d.breakdown.overall.percentage
  );
  const statistics = getGradeStatistics(allPercentages);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gradebook</h1>
        <p className="text-gray-600 mt-2">
          Kelas: <span className="font-medium">{classData.name}</span>
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Rata-rata Kelas</p>
          <p className="text-3xl font-bold text-blue-600">
            {formatPercentage(statistics.average)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Nilai Tertinggi</p>
          <p className="text-3xl font-bold text-green-600">
            {formatPercentage(statistics.highest)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Nilai Terendah</p>
          <p className="text-3xl font-bold text-red-600">
            {formatPercentage(statistics.lowest)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Lulus</p>
          <p className="text-3xl font-bold text-green-600">
            {statistics.passingCount}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Tidak Lulus</p>
          <p className="text-3xl font-bold text-red-600">
            {statistics.failingCount}
          </p>
        </div>
      </div>

      {/* Gradebook Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Siswa
              </th>
              {assignments.map((assignment) => (
                <th
                  key={assignment.id}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="min-w-[100px]">
                    <div className="truncate" title={assignment.title}>
                      {assignment.title}
                    </div>
                    <div className="text-gray-400 font-normal mt-1">
                      Max: {assignment.maxPoints}
                    </div>
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10">
                Nilai Akhir
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {gradebookData.map((data) => (
              <tr key={data.student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                  <div className="flex items-center">
                    <div className="shrink-0 h-10 w-10">
                      {data.student.avatar ? (
                        <img
                          src={data.student.avatar}
                          alt={data.student.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                          {data.student.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {data.student.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {data.student.email}
                      </div>
                    </div>
                  </div>
                </td>
                {data.grades.map((score, index) => (
                  <td
                    key={assignments[index].id}
                    className="px-4 py-4 whitespace-nowrap text-center text-sm"
                  >
                    {score !== null ? (
                      <span
                        className={
                          score >= assignments[index].maxPoints * 0.8
                            ? "text-green-600 font-medium"
                            : score >= assignments[index].maxPoints * 0.6
                            ? "text-blue-600"
                            : "text-red-600"
                        }
                      >
                        {formatGrade(score, assignments[index].maxPoints)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-center sticky right-0 bg-white z-10">
                  <div>
                    <span
                      className={`text-lg font-bold ${getGradeColor(
                        data.breakdown.overall.percentage
                      )}`}
                    >
                      {formatPercentage(data.breakdown.overall.percentage)}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({data.breakdown.overall.letter})
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {gradebookData.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Belum ada siswa yang terdaftar di kelas ini
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          <span className="font-medium">Catatan:</span> Nilai akhir dihitung
          dari rata-rata semua tugas yang sudah dinilai. Bobot: Tugas 60%, Quiz
          40% (Quiz akan ditambahkan di fase berikutnya).
        </p>
      </div>
    </div>
  );
}
