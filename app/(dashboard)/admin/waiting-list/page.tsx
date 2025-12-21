import { prisma } from "@/lib/db";
import WaitingListManagementClient from "@/components/features/admin/WaitingListManagementClient";

export default async function AdminWaitingListPage() {
  // Fetch all waiting list entries with student and template info
  const waitingList = await prisma.waitingList.findMany({
    orderBy: { requestedAt: "desc" },
    include: {
      student: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      template: {
        include: {
          sections: {
            where: {
              status: "ACTIVE",
            },
            orderBy: {
              sectionLabel: "asc",
            },
          },
        },
      },
    },
  });

  return <WaitingListManagementClient waitingList={waitingList} />;
}
