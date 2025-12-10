import { prisma } from "@/lib/db";
import ScheduleManagementClient from "@/components/features/admin/ScheduleManagementClient";

export default async function AdminSchedulePage() {
  // Fetch all scheduled meetings
  const meetings = await prisma.scheduledMeeting.findMany({
    orderBy: { scheduledAt: "desc" },
    include: {
      section: {
        include: {
          tutor: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
              availability: true,
            },
          },
          template: {
            select: {
              name: true,
              maxStudentsPerSection: true,
            },
          },
        },
      },
    },
  });

  // Fetch all active sections with tutor info
  const sections = await prisma.classSection.findMany({
    where: { status: "ACTIVE" },
    include: {
      tutor: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
          availability: true,
        },
      },
      template: {
        select: {
          name: true,
          maxStudentsPerSection: true,
        },
      },
    },
    orderBy: [{ template: { name: "asc" } }, { sectionLabel: "asc" }],
  });

  return <ScheduleManagementClient meetings={meetings} sections={sections} />;
}
