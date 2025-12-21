import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProgramDetailClient } from "@/components/features/student/ProgramDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get student profile
  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: user.id },
  });

  if (!studentProfile) {
    redirect("/login");
  }

  // Get program details
  const program = await db.classTemplate.findUnique({
    where: { id, published: true },
    include: {
      sections: {
        where: { status: "ACTIVE" },
        include: {
          tutor: {
            include: { user: { select: { name: true, avatar: true } } },
          },
          _count: { select: { enrollments: true } },
        },
        orderBy: { sectionLabel: "asc" },
      },
    },
  });

  if (!program) {
    notFound();
  }

  // Check if student already enrolled in this program
  const existingEnrollment = await db.enrollment.findFirst({
    where: {
      studentId: studentProfile.id,
      section: { templateId: program.id },
      status: { in: ["ACTIVE", "PENDING", "EXPIRED"] },
    },
    include: {
      section: { select: { sectionLabel: true } },
    },
  });

  // Check if student in waiting list for this program
  const waitingEntry = await db.waitingList.findUnique({
    where: {
      studentId_templateId: {
        studentId: studentProfile.id,
        templateId: program.id,
      },
    },
  });

  // Transform data
  const programData = {
    id: program.id,
    name: program.name,
    description: program.description,
    subject: program.subject,
    gradeLevel: program.gradeLevel,
    classType: program.classType,
    pricePerMonth: program.pricePerMonth,
    maxStudentsPerSection: program.maxStudentsPerSection,
    meetingsPerPeriod: program.meetingsPerPeriod,
    periodDays: program.periodDays,
    thumbnail: program.thumbnail,
    sections: program.sections.map((section) => ({
      id: section.id,
      label: section.sectionLabel,
      tutorName: section.tutor.user.name,
      tutorAvatar: section.tutor.user.avatar,
      currentStudents: section._count.enrollments,
      maxStudents: program.maxStudentsPerSection,
      isFull: section._count.enrollments >= program.maxStudentsPerSection,
    })),
  };

  const studentStatus = {
    isEnrolled: !!existingEnrollment,
    enrolledSection: existingEnrollment?.section?.sectionLabel || null,
    enrollmentStatus: existingEnrollment?.status || null,
    waitingStatus: waitingEntry?.status || null,
    waitingAssignedSection: waitingEntry?.assignedSectionId || null,
  };

  return (
    <ProgramDetailClient
      program={programData}
      studentStatus={studentStatus}
      studentId={studentProfile.id}
    />
  );
}
