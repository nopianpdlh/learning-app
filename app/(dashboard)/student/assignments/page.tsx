/**
 * Student Assignments Page - Server Component
 * Fetches assignments data from database and passes to client component
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import AssignmentsClient from "./AssignmentsClient";

export default async function StudentAssignmentsPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get student profile with enrollments
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    include: {
      enrollments: {
        where: {
          status: { in: ["ACTIVE", "PAID"] },
        },
        select: {
          classId: true,
        },
      },
    },
  });

  if (!studentProfile) {
    redirect("/login");
  }

  const enrolledClassIds = studentProfile.enrollments.map((e) => e.classId);

  // Handle no enrollments
  if (enrolledClassIds.length === 0) {
    return (
      <AssignmentsClient
        initialAssignments={[]}
        initialStats={{
          total: 0,
          pending: 0,
          submitted: 0,
          graded: 0,
          late: 0,
        }}
      />
    );
  }

  // Fetch all PUBLISHED assignments from enrolled classes
  const assignments = await prisma.assignment.findMany({
    where: {
      classId: { in: enrolledClassIds },
      status: "PUBLISHED",
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          subject: true,
        },
      },
      submissions: {
        where: {
          studentId: studentProfile.id,
        },
        select: {
          id: true,
          fileUrl: true,
          status: true,
          score: true,
          feedback: true,
          submittedAt: true,
          gradedAt: true,
        },
      },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  // Process assignments with computed status
  const now = new Date();
  const processedAssignments = assignments.map((assignment) => {
    const submission = assignment.submissions[0] || null;
    const isPastDue = new Date(assignment.dueDate) < now;

    // Determine effective status for UI
    let effectiveStatus: string;
    if (submission) {
      effectiveStatus = submission.status;
    } else if (isPastDue) {
      effectiveStatus = "OVERDUE";
    } else {
      effectiveStatus = "PENDING";
    }

    return {
      id: assignment.id,
      title: assignment.title,
      instructions: assignment.instructions,
      dueDate: assignment.dueDate.toISOString(),
      maxPoints: assignment.maxPoints,
      attachmentUrl: assignment.attachmentUrl,
      createdAt: assignment.createdAt.toISOString(),
      class: assignment.class,
      isPastDue,
      effectiveStatus,
      submission: submission
        ? {
            id: submission.id,
            fileUrl: submission.fileUrl,
            status: submission.status,
            score: submission.score,
            feedback: submission.feedback,
            submittedAt: submission.submittedAt.toISOString(),
            gradedAt: submission.gradedAt?.toISOString() || null,
          }
        : null,
    };
  });

  // Calculate stats
  const stats = {
    total: processedAssignments.length,
    pending: processedAssignments.filter((a) => a.effectiveStatus === "PENDING")
      .length,
    submitted: processedAssignments.filter(
      (a) => a.effectiveStatus === "SUBMITTED"
    ).length,
    graded: processedAssignments.filter((a) => a.effectiveStatus === "GRADED")
      .length,
    late: processedAssignments.filter(
      (a) => a.effectiveStatus === "LATE" || a.effectiveStatus === "OVERDUE"
    ).length,
  };

  return (
    <AssignmentsClient
      initialAssignments={processedAssignments}
      initialStats={stats}
    />
  );
}
