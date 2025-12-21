/**
 * Tutor Materials Page - Server Component
 * Fetches materials data from database and passes to client component
 * Uses section-based content system
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
          sections: {
            select: {
              id: true,
              sectionLabel: true,
              template: { select: { name: true, subject: true } },
            },
          },
        },
      },
    },
  });

  if (!dbUser || !dbUser.tutorProfile) {
    redirect("/login");
  }

  const sectionIds = dbUser.tutorProfile.sections.map((s) => s.id);

  // Transform sections for client (compatibility with existing component)
  const classes = dbUser.tutorProfile.sections.map((s) => ({
    id: s.id,
    name: `${s.template.name} - Section ${s.sectionLabel}`,
  }));

  // Get all materials for tutor's sections
  const materials = await prisma.material.findMany({
    where: {
      sectionId: { in: sectionIds },
    },
    include: {
      section: {
        select: {
          id: true,
          sectionLabel: true,
          template: { select: { name: true } },
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

  // Serialize and transform for client component
  const serializedMaterials = materials.map((material) => ({
    ...material,
    classId: material.sectionId, // Compatibility mapping
    class: material.section
      ? {
          id: material.section.id,
          name: `${material.section.template.name} - Section ${material.section.sectionLabel}`,
        }
      : null,
    createdAt: material.createdAt.toISOString(),
    updatedAt: material.updatedAt.toISOString(),
  }));

  return (
    <TutorMaterialsClient
      materials={
        serializedMaterials as Parameters<
          typeof TutorMaterialsClient
        >[0]["materials"]
      }
      classes={classes}
      stats={stats}
    />
  );
}
