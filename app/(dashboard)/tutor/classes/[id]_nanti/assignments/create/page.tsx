/**
 * Create Assignment Page
 * /tutor/classes/[id]/assignments/create
 */

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import AssignmentForm from "./AssignmentForm";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function CreateAssignmentPage({ params }: PageProps) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Buat Tugas Baru
        </h1>
        <p className="text-gray-600 mb-8">
          Kelas: <span className="font-medium">{classData.name}</span>
        </p>

        <div className="bg-white rounded-lg shadow p-6">
          <AssignmentForm classId={params.id} />
        </div>
      </div>
    </div>
  );
}
