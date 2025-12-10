import { prisma } from "@/lib/db";
import TutorAvailabilityManagementClient from "@/components/features/admin/TutorAvailabilityManagementClient";

export default async function AdminTutorAvailabilityPage() {
  // Fetch all tutors with their availability
  const tutors = await prisma.tutorProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      availability: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
      _count: {
        select: {
          sections: true,
        },
      },
    },
  });

  return <TutorAvailabilityManagementClient tutors={tutors} />;
}
