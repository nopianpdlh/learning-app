import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import StudentClassDetailClient from "@/components/features/student/StudentClassDetailClient";
import ClassHeader from "@/components/student/ClassHeader";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StudentClassDetailPage({ params }: PageProps) {
  const { id: classId } = await params;
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

  // Check if student is enrolled in this class
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: dbUser.studentProfile.id,
      classId,
      status: { in: ["PAID", "ACTIVE", "COMPLETED"] },
    },
    include: {
      class: true,
    },
  });

  // If not enrolled, redirect to class list
  if (!enrollment) {
    redirect("/student/classes");
  }

  return (
    <>
      <ClassHeader
        classId={classId}
        className={enrollment.class.name}
        currentSection="overview"
      />
      <StudentClassDetailClient classId={classId} />
    </>
  );
}
