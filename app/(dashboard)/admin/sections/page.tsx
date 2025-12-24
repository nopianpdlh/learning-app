import { prisma } from "@/lib/db";
import SectionManagementClient from "@/components/features/admin/SectionManagementClient";

export default async function AdminSectionsPage() {
  // Fetch all programs with their sections
  const programs = await prisma.classTemplate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sections: {
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
          _count: {
            select: {
              enrollments: {
                where: {
                  status: { in: ["ACTIVE", "PENDING"] },
                },
              },
            },
          },
        },
        orderBy: { sectionLabel: "asc" },
      },
      _count: {
        select: {
          sections: true,
          waitingList: true,
        },
      },
    },
  });

  // Transform programs to include currentEnrollments in sections
  const transformedPrograms = programs.map((program) => ({
    ...program,
    sections: program.sections.map((section) => ({
      ...section,
      currentEnrollments: section._count.enrollments,
    })),
  }));

  // Fetch all tutors
  const tutors = await prisma.tutorProfile.findMany({
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return (
    <SectionManagementClient programs={transformedPrograms} tutors={tutors} />
  );
}
