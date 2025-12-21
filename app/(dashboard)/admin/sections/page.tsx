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

  return <SectionManagementClient programs={programs} tutors={tutors} />;
}
