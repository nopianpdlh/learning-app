import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import AssignmentDetailClient from "@/components/features/tutor/AssignmentDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TutorAssignmentDetailPage({ params }: PageProps) {
  const { id } = await params;
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

  // Get assignment with submissions
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          subject: true,
          tutorId: true,
          enrollments: {
            where: {
              status: { in: ["PAID", "ACTIVE"] },
            },
            select: {
              id: true,
              student: {
                select: {
                  id: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      submissions: {
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: {
          submittedAt: "desc",
        },
      },
    },
  });

  if (!assignment) {
    notFound();
  }

  // Check if tutor owns this assignment
  if (assignment.class.tutorId !== dbUser.tutorProfile.id) {
    redirect("/tutor/assignments");
  }

  // Get enrolled students who haven't submitted
  const submittedStudentIds = assignment.submissions.map((s) => s.studentId);
  const notSubmittedStudents = assignment.class.enrollments.filter(
    (enrollment) => !submittedStudentIds.includes(enrollment.student.id)
  );

  // Transform data for client
  const assignmentData = {
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
      subject: assignment.class.subject,
    },
    submissions: assignment.submissions.map((submission) => ({
      id: submission.id,
      fileUrl: submission.fileUrl,
      status: submission.status,
      score: submission.score,
      feedback: submission.feedback,
      submittedAt: submission.submittedAt.toISOString(),
      gradedAt: submission.gradedAt?.toISOString() || null,
      student: {
        id: submission.student.id,
        user: {
          id: submission.student.user.id,
          name: submission.student.user.name,
          email: submission.student.user.email,
          avatar: submission.student.user.avatar,
        },
      },
    })),
    notSubmittedStudents: notSubmittedStudents.map((enrollment) => ({
      id: enrollment.student.id,
      user: {
        id: enrollment.student.user.id,
        name: enrollment.student.user.name,
        email: enrollment.student.user.email,
        avatar: enrollment.student.user.avatar,
      },
    })),
    totalStudents: assignment.class.enrollments.length,
    submittedCount: assignment.submissions.length,
    gradedCount: assignment.submissions.filter((s) => s.status === "GRADED")
      .length,
  };

  return <AssignmentDetailClient assignment={assignmentData} />;
}
