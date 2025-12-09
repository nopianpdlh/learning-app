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
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    // For server-side, we fetch directly from the database instead of calling API
    const { prisma } = await import("@/lib/db");

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!studentProfile) {
      redirect("/");
    }

    // Get enrolled class IDs
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: studentProfile.id,
        status: { in: ["PAID", "ACTIVE", "COMPLETED"] },
      },
      select: { classId: true },
    });

    const enrolledClassIds = enrollments.map((e) => e.classId);

    // Fetch materials with class info and bookmark status
    const materials = await prisma.material.findMany({
      where: {
        classId: { in: enrolledClassIds },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
        bookmarks: {
          where: { studentId: studentProfile.id },
          select: { id: true },
        },
      },
      orderBy: [{ session: "asc" }, { createdAt: "desc" }],
    });

    // Format materials
    const formattedMaterials = materials.map((material) => ({
      ...material,
      createdAt: material.createdAt,
      updatedAt: material.updatedAt,
      bookmarked: material.bookmarks.length > 0,
      bookmarks: undefined, // Remove from client props
    }));

    // Calculate stats
    const stats = {
      total: materials.length,
      byType: {} as Record<string, number>,
      byClass: {} as Record<string, number>,
    };

    materials.forEach((material) => {
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
