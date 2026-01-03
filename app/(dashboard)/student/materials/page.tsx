import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MaterialsClient from "./MaterialsClient";

export default async function StudentMaterialsPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch materials from API (server-side)
  try {
    const { prisma } = await import("@/lib/db");

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!studentProfile) {
      redirect("/");
    }

    // Get enrolled section IDs
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: studentProfile.id,
        status: { in: ["ACTIVE", "EXPIRED"] },
      },
      select: { sectionId: true },
    });

    const enrolledSectionIds = enrollments.map((e) => e.sectionId);

    // Handle no enrollments
    if (enrolledSectionIds.length === 0) {
      return (
        <MaterialsClient
          initialMaterials={[]}
          initialStats={{ total: 0, byType: {}, byClass: {} }}
        />
      );
    }

    // Fetch materials with section info and bookmark status
    const materials = await prisma.material.findMany({
      where: {
        sectionId: { in: enrolledSectionIds },
      },
      include: {
        section: {
          select: {
            id: true,
            sectionLabel: true,
            template: {
              select: {
                name: true,
                subject: true,
              },
            },
          },
        },
        bookmarks: {
          where: { studentId: studentProfile.id },
          select: { id: true },
        },
      },
      orderBy: [{ session: "asc" }, { createdAt: "desc" }],
    });

    // Generate thumbnails for materials
    const generateThumbnail = async (material: (typeof materials)[0]) => {
      // For IMAGE type - generate signed URL for thumbnail
      if (material.fileType === "IMAGE" && material.fileUrl) {
        try {
          const { data } = await supabase.storage
            .from("materials")
            .createSignedUrl(material.fileUrl, 3600); // 1 hour
          return data?.signedUrl || null;
        } catch {
          return null;
        }
      }

      // For VIDEO type - extract YouTube thumbnail
      if (
        (material.fileType === "VIDEO" || material.fileType === "LINK") &&
        material.videoUrl
      ) {
        try {
          const url = material.videoUrl;
          if (url.includes("youtube.com/watch")) {
            const videoId = new URL(url).searchParams.get("v");
            if (videoId)
              return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          }
          if (url.includes("youtu.be/")) {
            const videoId = url.split("youtu.be/")[1]?.split("?")[0];
            if (videoId)
              return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          }
        } catch {
          return null;
        }
      }

      return material.thumbnail || null;
    };

    // Format materials with generated thumbnails
    const formattedMaterials = await Promise.all(
      materials.map(async (material) => ({
        ...material,
        thumbnail: await generateThumbnail(material),
        class: {
          id: material.section.id,
          name: `${material.section.template.name} - Section ${material.section.sectionLabel}`,
          subject: material.section.template.subject,
        },
        createdAt: material.createdAt,
        updatedAt: material.updatedAt,
        bookmarked: material.bookmarks.length > 0,
        bookmarks: undefined,
        section: undefined,
      }))
    );

    // Calculate stats
    const stats = {
      total: materials.length,
      byType: {} as Record<string, number>,
      byClass: {} as Record<string, number>,
    };

    formattedMaterials.forEach((material) => {
      stats.byType[material.fileType] =
        (stats.byType[material.fileType] || 0) + 1;
      stats.byClass[material.class.name] =
        (stats.byClass[material.class.name] || 0) + 1;
    });

    return (
      <MaterialsClient
        initialMaterials={formattedMaterials}
        initialStats={stats}
      />
    );
  } catch (error) {
    console.error("Failed to fetch materials:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Failed to load materials</h1>
          <p className="text-muted-foreground">
            Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }
}
