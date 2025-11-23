import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import TutorAssignmentsClient from "@/components/features/tutor/TutorAssignmentsClient";

export default async function TutorAssignmentsPage() {
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

  // Get tutor's classes
  const classes = await prisma.class.findMany({
    where: {
      tutorId: dbUser.tutorProfile.id,
    },
    select: {
      id: true,
      name: true,
      subject: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Get all assignments for tutor's classes
  const assignments = await prisma.assignment.findMany({
    where: {
      class: {
        tutorId: dbUser.tutorProfile.id,
      },
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          enrollments: {
            where: {
              status: { in: ["PAID", "ACTIVE"] },
            },
            select: {
              id: true,
            },
          },
        },
      },
      submissions: {
        select: {
          id: true,
          status: true,
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
    orderBy: {
      dueDate: "desc",
    },
  });

  // Transform assignments data with submission counts
  const assignmentsData = assignments.map((assignment) => {
    const totalStudents = assignment.class.enrollments.length;
    const submittedCount = assignment.submissions.filter(
      (s) => s.status === "SUBMITTED" || s.status === "GRADED"
    ).length;
    const gradedCount = assignment.submissions.filter(
      (s) => s.status === "GRADED"
    ).length;

    return {
      id: assignment.id,
      title: assignment.title,
      instructions: assignment.instructions,
      dueDate: assignment.dueDate.toISOString(),
      maxPoints: assignment.maxPoints,
      attachmentUrl: assignment.attachmentUrl,
      status: assignment.status,
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
      class: {
        id: assignment.class.id,
        name: assignment.class.name,
      },
      _count: {
        submissions: assignment._count.submissions,
      },
      submittedCount,
      gradedCount,
      totalStudents,
    };
  });

  return (
    <TutorAssignmentsClient assignments={assignmentsData} classes={classes} />
  );
}
