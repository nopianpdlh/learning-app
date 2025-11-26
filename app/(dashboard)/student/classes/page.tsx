import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import StudentClassesClient from "@/components/features/student/StudentClassesClient";

export default async function StudentClassesPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user from database
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      studentProfile: true,
    },
  });

  if (!dbUser || dbUser.role !== "STUDENT" || !dbUser.studentProfile) {
    redirect("/");
  }

  return <StudentClassesClient />;
}
