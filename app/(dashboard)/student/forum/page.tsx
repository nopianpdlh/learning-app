import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import StudentForumClient from "@/components/features/student/StudentForumClient";

export default async function StudentForumPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user from database with student profile
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      studentProfile: {
        include: {
          enrollments: {
            where: {
              status: { in: ["ACTIVE", "EXPIRED"] },
            },
            include: {
              section: {
                include: {
                  template: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!dbUser || dbUser.role !== "STUDENT" || !dbUser.studentProfile) {
    redirect("/");
  }

  // Get enrolled sections for filtering
  const enrolledSections = dbUser.studentProfile.enrollments.map((e) => ({
    id: e.section.id,
    name: `${e.section.template.name} - Section ${e.section.sectionLabel}`,
    subject: e.section.template.subject,
  }));

  return <StudentForumClient enrolledSections={enrolledSections} />;
}
