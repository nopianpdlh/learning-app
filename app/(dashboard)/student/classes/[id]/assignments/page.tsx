/**
 * Student Assignments Page
 * /student/classes/[id]/assignments
 */

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import StudentAssignmentCard from "./StudentAssignmentCard";
import ClassHeader from "@/components/student/ClassHeader";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StudentAssignmentsPage({ params }: PageProps) {
  const { id: classId } = await params;
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
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

  // Verify student is enrolled in this class
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_classId: {
        studentId: dbUser.studentProfile.id,
        classId,
      },
    },
    include: {
      class: true,
    },
  });

  if (!enrollment || !["PAID", "ACTIVE"].includes(enrollment.status)) {
    redirect("/student/classes");
  }

  // Get published assignments for this class
  const assignments = await prisma.assignment.findMany({
    where: {
      classId,
      status: "PUBLISHED",
    },
    orderBy: { dueDate: "asc" },
  });

  // Get student's submissions
  const submissions = await prisma.assignmentSubmission.findMany({
    where: {
      assignmentId: { in: assignments.map((a) => a.id) },
      studentId: dbUser.studentProfile.id,
    },
  });

  // Create submission map
  const submissionMap = new Map(
    submissions.map((sub) => [sub.assignmentId, sub])
  );

  // Merge assignments with submissions
  const assignmentsWithSubmissions = assignments.map((assignment) => ({
    ...assignment,
    submission: submissionMap.get(assignment.id) || null,
  }));

  const now = new Date();
  const upcomingCount = assignmentsWithSubmissions.filter(
    (a) => !submissionMap.has(a.id) && a.dueDate > now
  ).length;
  const overdueCount = assignmentsWithSubmissions.filter(
    (a) => !submissionMap.has(a.id) && a.dueDate <= now
  ).length;
  const submittedCount = submissions.length;

  return (
    <>
      <ClassHeader
        classId={classId}
        className={enrollment.class.name}
        currentSection="assignments"
      />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tugas</h1>
          <p className="text-gray-600 mt-2">
            Kelas: <span className="font-medium">{enrollment.class.name}</span>
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Tugas Mendatang</p>
            <p className="text-3xl font-bold text-blue-600">{upcomingCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Sudah Dikumpulkan</p>
            <p className="text-3xl font-bold text-green-600">
              {submittedCount}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Terlambat</p>
            <p className="text-3xl font-bold text-red-600">{overdueCount}</p>
          </div>
        </div>

        {/* Assignments List */}
        {assignmentsWithSubmissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Belum ada tugas yang dipublikasikan</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignmentsWithSubmissions.map((assignment) => (
              <StudentAssignmentCard
                key={assignment.id}
                assignment={assignment}
                submission={assignment.submission}
                classId={classId}
                studentId={dbUser.studentProfile!.id}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
