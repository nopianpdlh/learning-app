/**
 * Tutor Materials Management Page
 * /tutor/classes/[id]/materials
 */

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import MaterialUploadForm from "./MaterialUploadForm";
import MaterialList from "./MaterialList";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function TutorMaterialsPage({ params }: PageProps) {
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
    redirect("/tutor/dashboard");
  }

  // Verify tutor owns this class
  if (classData.tutorId !== dbUser.tutorProfile?.id) {
    redirect("/tutor/dashboard");
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
      </div>

      {/* Upload Form */}
      <div className="mb-8">
        <MaterialUploadForm classId={params.id} />
      </div>

      {/* Materials List */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Daftar Materi</h2>
        {Object.keys(materialsBySession).length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">
              Belum ada materi. Silakan upload materi menggunakan form di atas.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(materialsBySession)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([session, sessionMaterials]) => (
                <div key={session} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Pertemuan {session}
                  </h3>
                  <MaterialList
                    materials={sessionMaterials}
                    classId={params.id}
                  />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
