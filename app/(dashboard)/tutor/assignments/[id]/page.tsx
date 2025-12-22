import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";

export default async function TutorAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user from database
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      tutorProfile: true,
    },
  });

  if (!dbUser || dbUser.role !== "TUTOR" || !dbUser.tutorProfile) {
    redirect("/");
  }

  // Get assignment with submissions
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      section: {
        select: {
          id: true,
          sectionLabel: true,
          tutorId: true,
          template: {
            select: {
              name: true,
              subject: true,
            },
          },
          enrollments: {
            where: {
              status: { in: ["ACTIVE", "EXPIRED"] },
            },
            select: {
              id: true,
              student: {
                select: {
                  id: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      submissions: {
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: {
          submittedAt: "desc",
        },
      },
    },
  });

  if (!assignment) {
    notFound();
  }

  // Check if tutor owns this assignment's section
  if (assignment.section.tutorId !== dbUser.tutorProfile.id) {
    redirect("/tutor/assignments");
  }

  const totalStudents = assignment.section.enrollments.length;
  const submittedCount = assignment.submissions.filter(
    (s) => s.status === "SUBMITTED" || s.status === "GRADED"
  ).length;
  const gradedCount = assignment.submissions.filter(
    (s) => s.status === "GRADED"
  ).length;
  const pendingCount = submittedCount - gradedCount;

  // Get students who haven't submitted
  const submittedStudentIds = assignment.submissions.map((s) => s.studentId);
  const notSubmitted = assignment.section.enrollments.filter(
    (e) => !submittedStudentIds.includes(e.student.id)
  );

  const className = `${assignment.section.template.name} - Section ${assignment.section.sectionLabel}`;
  const isPastDue = new Date(assignment.dueDate) < new Date();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/tutor/assignments"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali ke Daftar Tugas
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {assignment.title}
            </h1>
            <p className="text-gray-500 mt-1">{className}</p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              assignment.status === "PUBLISHED"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {assignment.status === "PUBLISHED" ? "Aktif" : "Draft"}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Siswa</p>
              <p className="text-xl font-semibold">{totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Dikumpulkan</p>
              <p className="text-xl font-semibold">
                {submittedCount}/{totalStudents}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Perlu Dinilai</p>
              <p className="text-xl font-semibold">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sudah Dinilai</p>
              <p className="text-xl font-semibold">{gradedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Details */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Detail Tugas</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Deadline:</span>
            <span
              className={`font-medium ${
                isPastDue ? "text-red-600" : "text-gray-900"
              }`}
            >
              {format(new Date(assignment.dueDate), "dd MMMM yyyy, HH:mm", {
                locale: idLocale,
              })}
              {isPastDue && " (Lewat)"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Nilai Maksimal:</span>
            <span className="font-medium">{assignment.maxPoints} poin</span>
          </div>
        </div>

        <div className="prose prose-sm max-w-none">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Instruksi:</h3>
          <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-gray-700">
            {assignment.instructions}
          </div>
        </div>

        {assignment.attachmentUrl && (
          <div className="mt-4">
            <a
              href={assignment.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Download className="w-4 h-4" />
              Download Lampiran
            </a>
          </div>
        )}
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">
            Pengumpulan ({assignment.submissions.length})
          </h2>
        </div>

        {assignment.submissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Belum ada siswa yang mengumpulkan tugas
          </div>
        ) : (
          <div className="divide-y">
            {assignment.submissions.map((submission) => (
              <div
                key={submission.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    {submission.student.user.avatar ? (
                      <img
                        src={submission.student.user.avatar}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-blue-600 font-medium">
                        {submission.student.user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {submission.student.user.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Dikumpulkan{" "}
                      {format(
                        new Date(submission.submittedAt),
                        "dd MMM yyyy, HH:mm",
                        { locale: idLocale }
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {submission.status === "GRADED" ? (
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {submission.score}/{assignment.maxPoints}
                      </p>
                      <p className="text-xs text-gray-500">Dinilai</p>
                    </div>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-sm rounded">
                      Menunggu Nilai
                    </span>
                  )}

                  <Link
                    href={`/tutor/grading?submissionId=${submission.id}`}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    {submission.status === "GRADED" ? "Lihat" : "Nilai"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Not Submitted List */}
      {notSubmitted.length > 0 && (
        <div className="bg-white rounded-lg border mt-6">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-red-600">
              Belum Mengumpulkan ({notSubmitted.length})
            </h2>
          </div>

          <div className="divide-y">
            {notSubmitted.map((enrollment) => (
              <div key={enrollment.id} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  {enrollment.student.user.avatar ? (
                    <img
                      src={enrollment.student.user.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 font-medium">
                      {enrollment.student.user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {enrollment.student.user.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {enrollment.student.user.email}
                  </p>
                </div>
                <XCircle className="w-5 h-5 text-red-400 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
