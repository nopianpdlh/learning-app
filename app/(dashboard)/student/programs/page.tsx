import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StudentProgramsClient } from "@/components/features/student/StudentProgramsClient";

export default async function StudentProgramsPage() {
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

  // Get all published programs
  const programs = await db.classTemplate.findMany({
    where: { published: true },
    include: {
      sections: {
        where: { status: "ACTIVE" },
        include: {
          tutor: {
            include: { user: { select: { name: true, avatar: true } } },
          },
          _count: { select: { enrollments: true } },
        },
      },
      _count: { select: { sections: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get student's waiting list entries
  const waitingListEntries = await db.waitingList.findMany({
    where: { studentId: studentProfile.id },
    select: { templateId: true, status: true },
  });

  // Get student's enrollments
  const enrollments = await db.enrollment.findMany({
    where: {
      studentId: studentProfile.id,
      status: { in: ["ACTIVE", "PENDING", "EXPIRED"] },
    },
    include: {
      section: { select: { templateId: true } },
    },
  });

  // Transform data
  const programsData = programs.map((program) => {
    const waitingEntry = waitingListEntries.find(
      (w) => w.templateId === program.id
    );
    const enrolled = enrollments.some(
      (e) => e.section?.templateId === program.id
    );

    // Calculate total available slots
    const totalSlots = program.sections.reduce(
      (acc, section) =>
        acc + (program.maxStudentsPerSection - section._count.enrollments),
      0
    );

    return {
      id: program.id,
      name: program.name,
      description: program.description,
      subject: program.subject,
      gradeLevel: program.gradeLevel,
      classType: program.classType,
      pricePerMonth: program.pricePerMonth,
      thumbnail: program.thumbnail,
      sectionsCount: program._count.sections,
      availableSlots: totalSlots,
      tutors: program.sections
        .map((s) => s.tutor.user.name)
        .filter((v, i, a) => a.indexOf(v) === i), // unique tutors
      waitingStatus: waitingEntry?.status || null,
      isEnrolled: enrolled,
    };
  });

  // Get unique subjects for filter
  const subjects = [...new Set(programs.map((p) => p.subject))];

  return <StudentProgramsClient programs={programsData} subjects={subjects} />;
}
