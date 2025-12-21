import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import TutorDashboardClient from "@/components/features/tutor/TutorDashboardClient";

export default async function TutorDashboardPage() {
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
      tutorProfile: true,
    },
  });

  if (!dbUser || dbUser.role !== "TUTOR" || !dbUser.tutorProfile) {
    redirect("/");
  }

  return <TutorDashboardClient />;
}
