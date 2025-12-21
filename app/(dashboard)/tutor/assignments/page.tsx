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
      tutorProfile: {
        include: {
          sections: {
            select: {
              id: true,
              sectionLabel: true,
              template: { select: { name: true, subject: true } },
            },
          },
        },
      },
    },
  });

  if (!dbUser || dbUser.role !== "TUTOR" || !dbUser.tutorProfile) {
    redirect("/");
  }

  const sectionIds = dbUser.tutorProfile.sections.map((s) => s.id);

  // Transform sections for client (compatibility with existing component)
  const classes = dbUser.tutorProfile.sections.map((s) => ({
    id: s.id,
    name: `${s.template.name} - Section ${s.sectionLabel}`,
    subject: s.template.subject,
  }));

  // Get all assignments for tutor's sections
  const assignments = await prisma.assignment.findMany({
    where: {
      sectionId: { in: sectionIds },
    },
    include: {
      section: {
        select: {
          id: true,
          sectionLabel: true,
          template: { select: { name: true } },
          enrollments: {
            where: {
              status: { in: ["ACTIVE", "EXPIRED"] },
            },
            select: { id: true },
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
    const totalStudents = assignment.section.enrollments.length;
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
        id: assignment.section.id,
        name: `${assignment.section.template.name} - ${assignment.section.sectionLabel}`,
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
