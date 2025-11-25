/**
 * Tutor Materials Page - Server Component
 * Fetches materials data from database and passes to client component
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import TutorMaterialsClient from "@/components/features/tutor/TutorMaterialsClient";

export default async function TutorMaterialsPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get user from database with tutor profile
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      tutorProfile: {
        include: {
          classes: {
            select: {
              id: true,
              name: true,
            },
            orderBy: {
              name: "asc",
            },
          },
        },
      },
    },
  });

  if (!dbUser || !dbUser.tutorProfile) {
    redirect("/login");
  }

  // Get all materials for tutor's classes
  const materials = await prisma.material.findMany({
    where: {
      classId: {
        in: dbUser.tutorProfile.classes.map((c) => c.id),
      },
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ session: "asc" }, { createdAt: "desc" }],
  });

  // Calculate statistics
  const stats = {
    total: materials.length,
    byFileType: {
      PDF: materials.filter((m) => m.fileType === "PDF").length,
      VIDEO: materials.filter((m) => m.fileType === "VIDEO").length,
      LINK: materials.filter((m) => m.fileType === "LINK").length,
      DOCUMENT: materials.filter((m) => m.fileType === "DOCUMENT").length,
      IMAGE: materials.filter((m) => m.fileType === "IMAGE").length,
    },
    totalViews: materials.reduce((sum, m) => sum + m.viewCount, 0),
    totalDownloads: materials.reduce((sum, m) => sum + m.downloadCount, 0),
  };

  // Serialize dates for client component
  const serializedMaterials = materials.map((material) => ({
    ...material,
    createdAt: material.createdAt.toISOString(),
    updatedAt: material.updatedAt.toISOString(),
  }));

  return (
    <TutorMaterialsClient
      materials={serializedMaterials}
      classes={dbUser.tutorProfile.classes}
      stats={stats}
    />
  );
}
