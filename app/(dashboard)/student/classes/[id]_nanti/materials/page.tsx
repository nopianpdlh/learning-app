/**
 * Student Materials View Page
 * /student/classes/[id]/materials
 */

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import StudentMaterialList from "./StudentMaterialList";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function StudentMaterialsPage({ params }: PageProps) {
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

  if (!dbUser || dbUser.role !== "STUDENT") {
    redirect("/");
  }

  // Get class data
  const classData = await prisma.class.findUnique({
    where: { id: params.id },
    include: {
      tutor: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!classData) {
    redirect("/student/dashboard");
  }

  // Check enrollment status
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      classId: params.id,
      studentId: dbUser.studentProfile?.id,
    },
  });

  if (!enrollment) {
    redirect("/student/classes");
  }

  // Check if enrollment is active
  if (enrollment.status !== "PAID" && enrollment.status !== "ACTIVE") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-900 mb-2">
            Pembayaran Belum Selesai
          </h2>
          <p className="text-yellow-700">
            Anda harus menyelesaikan pembayaran terlebih dahulu untuk mengakses
            materi pembelajaran.
          </p>
        </div>
      </div>
    );
  }

  // Get materials for this class
  const materials = await prisma.material.findMany({
    where: { classId: params.id },
    orderBy: [{ session: "asc" }, { createdAt: "desc" }],
  });

  // Group materials by session
  const materialsBySession = materials.reduce((acc, material) => {
    const session = material.session;
    if (!acc[session]) {
      acc[session] = [];
    }
    acc[session].push(material);
    return acc;
  }, {} as Record<number, typeof materials>);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Materi Pembelajaran
        </h1>
        <p className="text-gray-600 mt-2">
          Kelas: <span className="font-medium">{classData.name}</span>
        </p>
        <p className="text-gray-600">
          Tutor:{" "}
          <span className="font-medium">{classData.tutor.user.name}</span>
        </p>
      </div>

      {/* Materials by Session */}
      {Object.keys(materialsBySession).length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">
            Belum ada materi yang tersedia. Tutor akan menambahkan materi
            segera.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(materialsBySession)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([session, sessionMaterials]) => (
              <div key={session} className="bg-white rounded-lg shadow">
                <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
                  <h3 className="text-xl font-bold">Pertemuan {session}</h3>
                  <p className="text-blue-100 text-sm">
                    {sessionMaterials.length} materi tersedia
                  </p>
                </div>
                <div className="p-6">
                  <StudentMaterialList materials={sessionMaterials} />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
