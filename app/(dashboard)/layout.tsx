import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { TutorLayout } from "@/components/layouts/TutorLayout";
import ExecutiveLayout from "@/components/layouts/ExecutiveLayout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const role = (session.user.user_metadata?.role || "STUDENT").toUpperCase();

  // Render layout based on role
  if (role === "ADMIN") {
    return <AdminLayout>{children}</AdminLayout>;
  }

  if (role === "TUTOR") {
    return <TutorLayout>{children}</TutorLayout>;
  }

  if (role === "EXECUTIVE") {
    return <ExecutiveLayout>{children}</ExecutiveLayout>;
  }

  return <StudentLayout>{children}</StudentLayout>;
}
