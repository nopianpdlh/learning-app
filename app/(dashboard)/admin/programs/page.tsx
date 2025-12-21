import { prisma } from "@/lib/db";
import ProgramManagementClient from "@/components/features/admin/ProgramManagementClient";

export default async function AdminProgramsPage() {
  // Fetch all programs (ClassTemplates)
  const programs = await prisma.classTemplate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          sections: true,
          waitingList: true,
        },
      },
    },
  });

  return <ProgramManagementClient programs={programs} />;
}
