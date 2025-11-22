/**
 * Tutor Assignments Page
 * /tutor/classes/[id]/assignments
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

export default async function TutorAssignmentsPage({ params }: PageProps) {
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

  // Get assignments for this class
  const assignments = await prisma.assignment.findMany({
    where: { classId: params.id },
    include: {
      _count: {
        select: {
          submissions: true,
        },
      },
    },
    orderBy: { dueDate: "asc" },
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

  const isOverdue = (date: Date) => {
    return new Date() > date;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tugas & Penilaian
          </h1>
          <p className="text-gray-600 mt-2">
            Kelas: <span className="font-medium">{classData.name}</span>
          </p>
        </div>
        <Link href={`/tutor/classes/${params.id}/assignments/create`}>
          <Button>+ Buat Tugas Baru</Button>
        </Link>
      </div>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">
            Belum ada tugas. Buat tugas pertama untuk siswa Anda!
          </p>
          <Link href={`/tutor/classes/${params.id}/assignments/create`}>
            <Button>Buat Tugas Pertama</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {assignment.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        assignment.status === "PUBLISHED"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {assignment.status === "PUBLISHED"
                        ? "Published"
                        : "Draft"}
                    </span>
                    {isOverdue(assignment.dueDate) && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        Overdue
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {assignment.instructions}
                  </p>

                  <div className="flex gap-6 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Deadline:</span>{" "}
                      <span
                        className={
                          isOverdue(assignment.dueDate) ? "text-red-600" : ""
                        }
                      >
                        {formatDate(assignment.dueDate)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Max Points:</span>{" "}
                      {assignment.maxPoints}
                    </div>
                    <div>
                      <span className="font-medium">Submissions:</span>{" "}
                      {assignment._count.submissions}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/tutor/classes/${params.id}/assignments/${assignment.id}/submissions`}
                  >
                    <Button variant="outline" size="sm">
                      Lihat Pengumpulan ({assignment._count.submissions})
                    </Button>
                  </Link>
                  <Link
                    href={`/tutor/classes/${params.id}/assignments/${assignment.id}/edit`}
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
