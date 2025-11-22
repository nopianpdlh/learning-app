/**
 * Tutor Assignment Submissions Page
 * /tutor/classes/[id]/assignments/[assignmentId]/submissions
 */

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import GradeSubmissionModal from "./GradeSubmissionModal";

interface PageProps {
  params: {
    id: string;
    assignmentId: string;
  };
}

export default async function AssignmentSubmissionsPage({ params }: PageProps) {
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

  // Get assignment data
  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    include: {
      class: true,
    },
  });

  if (!assignment || assignment.classId !== params.id) {
    redirect(`/tutor/classes/${params.id}/assignments`);
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

  // Get all submissions for this assignment
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignmentId: params.assignmentId },
    include: {
      student: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  // Create a map of submissions by student ID
  const submissionMap = new Map(submissions.map((sub) => [sub.studentId, sub]));

  // Merge enrolled students with their submissions
  const studentsWithSubmissions = enrollments.map((enrollment) => ({
    studentId: enrollment.student.id,
    studentName: enrollment.student.user.name,
    studentEmail: enrollment.student.user.email,
    studentAvatar: enrollment.student.user.avatar,
    submission: submissionMap.get(enrollment.student.id) || null,
  }));

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (submission: any, dueDate: Date) => {
    if (!submission) {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          Belum Dikumpulkan
        </span>
      );
    }

    if (submission.status === "GRADED") {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          Sudah Dinilai
        </span>
      );
    }

    if (submission.status === "LATE") {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          Terlambat
        </span>
      );
    }

    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
        Menunggu Penilaian
      </span>
    );
  };

  const submittedCount = submissions.length;
  const gradedCount = submissions.filter((s) => s.status === "GRADED").length;
  const totalStudents = enrollments.length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/tutor/classes/${params.id}/assignments`}
          className="text-blue-600 hover:underline mb-2 inline-block"
        >
          ← Kembali ke Daftar Tugas
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
        <p className="text-gray-600 mt-2">
          Kelas: <span className="font-medium">{classData.name}</span>
        </p>
        <div className="flex gap-4 mt-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Deadline:</span>{" "}
            {formatDate(assignment.dueDate)}
          </div>
          <div>
            <span className="font-medium">Max Points:</span>{" "}
            {assignment.maxPoints}
          </div>
          <div>
            <span className="font-medium">Dikumpulkan:</span> {submittedCount}/
            {totalStudents}
          </div>
          <div>
            <span className="font-medium">Sudah Dinilai:</span> {gradedCount}/
            {submittedCount}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Siswa</p>
          <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Sudah Mengumpulkan</p>
          <p className="text-3xl font-bold text-blue-600">{submittedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Sudah Dinilai</p>
          <p className="text-3xl font-bold text-green-600">{gradedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Menunggu Penilaian</p>
          <p className="text-3xl font-bold text-orange-600">
            {submittedCount - gradedCount}
          </p>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Siswa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Waktu Pengumpulan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nilai
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {studentsWithSubmissions.map((student) => (
              <tr key={student.studentId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="shrink-0 h-10 w-10">
                      {student.studentAvatar ? (
                        <img
                          src={student.studentAvatar}
                          alt={student.studentName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                          {student.studentName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {student.studentName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.studentEmail}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(student.submission, assignment.dueDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.submission
                    ? formatDate(student.submission.submittedAt)
                    : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {student.submission?.score !== null &&
                  student.submission?.score !== undefined ? (
                    <span className="text-sm font-medium text-gray-900">
                      {student.submission.score}/{assignment.maxPoints}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {student.submission ? (
                    <GradeSubmissionModal
                      submission={student.submission}
                      assignment={assignment}
                      studentName={student.studentName}
                      classId={params.id}
                    />
                  ) : (
                    <span className="text-gray-400">Belum ada pengumpulan</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {studentsWithSubmissions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Belum ada siswa yang terdaftar di kelas ini
          </div>
        )}
      </div>
    </div>
  );
}
