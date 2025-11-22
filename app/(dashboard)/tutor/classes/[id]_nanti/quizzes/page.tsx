/**
 * Tutor Quizzes Page
 * /tutor/classes/[id]/quizzes
 */

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function TutorQuizzesPage({ params }: PageProps) {
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

  // Get quizzes for this class
  const quizzes = await prisma.quiz.findMany({
    where: { classId: params.id },
    include: {
      _count: {
        select: {
          questions: true,
          attempts: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "CLOSED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kuis Online</h1>
          <p className="text-gray-600 mt-2">
            Kelas: <span className="font-medium">{classData.name}</span>
          </p>
        </div>
        <Link href={`/tutor/classes/${params.id}/quizzes/create`}>
          <Button>+ Buat Kuis Baru</Button>
        </Link>
      </div>

      {/* Quizzes List */}
      {quizzes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">
            Belum ada kuis. Buat kuis pertama untuk siswa Anda!
          </p>
          <Link href={`/tutor/classes/${params.id}/quizzes/create`}>
            <Button>Buat Kuis Pertama</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {quiz.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        quiz.status
                      )}`}
                    >
                      {quiz.status === "PUBLISHED"
                        ? "Published"
                        : quiz.status === "DRAFT"
                        ? "Draft"
                        : "Closed"}
                    </span>
                  </div>

                  {quiz.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {quiz.description}
                    </p>
                  )}

                  <div className="flex gap-6 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Questions:</span>{" "}
                      {quiz._count.questions}
                    </div>
                    <div>
                      <span className="font-medium">Attempts:</span>{" "}
                      {quiz._count.attempts}
                    </div>
                    {quiz.timeLimit && (
                      <div>
                        <span className="font-medium">Time Limit:</span>{" "}
                        {quiz.timeLimit} minutes
                      </div>
                    )}
                    {quiz.passingGrade && (
                      <div>
                        <span className="font-medium">Passing Grade:</span>{" "}
                        {quiz.passingGrade}%
                      </div>
                    )}
                  </div>

                  {(quiz.startDate || quiz.endDate) && (
                    <div className="flex gap-6 text-sm text-gray-500 mt-2">
                      {quiz.startDate && (
                        <div>
                          <span className="font-medium">Start:</span>{" "}
                          {formatDate(quiz.startDate)}
                        </div>
                      )}
                      {quiz.endDate && (
                        <div>
                          <span className="font-medium">End:</span>{" "}
                          {formatDate(quiz.endDate)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/tutor/classes/${params.id}/quizzes/${quiz.id}/results`}
                  >
                    <Button variant="outline" size="sm">
                      Lihat Hasil ({quiz._count.attempts})
                    </Button>
                  </Link>
                  <Link
                    href={`/tutor/classes/${params.id}/quizzes/${quiz.id}/edit`}
                  >
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
