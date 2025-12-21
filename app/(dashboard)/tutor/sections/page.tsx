import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TutorSectionsClient from "./TutorSectionsClient";

export default async function TutorSectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get tutor profile
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      tutorProfile: true,
    },
  });

  if (!dbUser?.tutorProfile) {
    redirect("/login");
  }

  // Fetch tutor's sections with all data
  const sections = await prisma.classSection.findMany({
    where: {
      tutorId: dbUser.tutorProfile.id,
    },
    include: {
      template: true,
      enrollments: {
        where: {
          status: { in: ["ACTIVE", "EXPIRED"] },
        },
        select: { id: true },
      },
      _count: {
        select: {
          materials: true,
          assignments: true,
          quizzes: true,
          meetings: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Transform for client
  const sectionsData = sections.map((section: (typeof sections)[0]) => ({
    id: section.id,
    label: section.sectionLabel,
    status: section.status,
    currentEnrollments: section.enrollments.length,
    maxEnrollments: section.template.maxStudentsPerSection,
    template: {
      id: section.template.id,
      name: section.template.name,
      subject: section.template.subject,
      gradeLevel: section.template.gradeLevel,
      thumbnail: section.template.thumbnail,
      pricePerMonth: section.template.pricePerMonth,
      classType: section.template.classType,
    },
    counts: section._count,
    createdAt: section.createdAt.toISOString(),
  }));

  // Calculate stats
  const stats = {
    totalSections: sections.length,
    activeSections: sections.filter(
      (s: (typeof sections)[0]) => s.status === "ACTIVE"
    ).length,
    totalStudents: sections.reduce(
      (sum: number, s: (typeof sections)[0]) => sum + s.enrollments.length,
      0
    ),
    totalMaterials: sections.reduce(
      (sum: number, s: (typeof sections)[0]) => sum + s._count.materials,
      0
    ),
  };

  return <TutorSectionsClient sections={sectionsData} stats={stats} />;
}
