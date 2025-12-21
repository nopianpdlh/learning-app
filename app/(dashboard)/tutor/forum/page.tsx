import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import TutorForumClient from "@/components/features/tutor/TutorForumClient";

export default async function TutorForumPage() {
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

  return <TutorForumClient />;
}
