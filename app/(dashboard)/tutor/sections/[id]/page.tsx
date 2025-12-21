import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TutorSectionDetailClient from "./TutorSectionDetailClient";

export default async function TutorSectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sectionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get tutor profile
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      tutorProfile: true,
    },
  });

  if (!dbUser?.tutorProfile) {
    redirect("/login");
  }

  // Fetch section with full details
  const section = await prisma.classSection.findUnique({
    where: { id: sectionId },
    include: {
      template: true,
      enrollments: {
        where: {
          status: { in: ["ACTIVE", "EXPIRED", "PENDING"] },
        },
        include: {
          student: {
            include: {
              user: {
                select: { name: true, email: true, avatar: true },
              },
            },
          },
        },
      },
    },
  });

  if (!section) {
    redirect("/tutor/sections");
  }

  // Verify tutor owns this section
  if (section.tutorId !== dbUser.tutorProfile.id) {
    redirect("/tutor/sections");
  }

  // Fetch content
  const [materials, assignments, quizzes, meetings] = await Promise.all([
    prisma.material.findMany({
      where: { sectionId },
      orderBy: { session: "asc" },
    }),
    prisma.assignment.findMany({
      where: { sectionId },
      orderBy: { dueDate: "asc" },
      include: {
        _count: { select: { submissions: true } },
      },
    }),
    prisma.quiz.findMany({
      where: { sectionId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { questions: true, attempts: true } },
      },
    }),
    prisma.scheduledMeeting.findMany({
      where: { sectionId },
      orderBy: { scheduledAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <TutorSectionDetailClient
      section={{
        id: section.id,
        label: section.sectionLabel,
        status: section.status,
        template: section.template,
      }}
      students={section.enrollments.map(
        (e: (typeof section.enrollments)[0]) => ({
          enrollmentId: e.id,
          status: e.status,
          startDate: e.startDate?.toISOString() || null,
          expiryDate: e.expiryDate?.toISOString() || null,
          student: {
            id: e.student.id,
            name: e.student.user.name,
            email: e.student.user.email,
            avatar: e.student.user.avatar,
          },
        })
      )}
      materials={materials.map((m: (typeof materials)[0]) => ({
        id: m.id,
        title: m.title,
        session: m.session,
        fileType: m.fileType,
        createdAt: m.createdAt.toISOString(),
      }))}
      assignments={assignments.map((a: (typeof assignments)[0]) => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate.toISOString(),
        status: a.status,
        submissionCount: a._count.submissions,
      }))}
      quizzes={quizzes.map((q: (typeof quizzes)[0]) => ({
        id: q.id,
        title: q.title,
        status: q.status,
        questionsCount: q._count.questions,
        attemptsCount: q._count.attempts,
      }))}
      meetings={meetings.map((m: (typeof meetings)[0]) => ({
        id: m.id,
        title: m.title,
        scheduledAt: m.scheduledAt.toISOString(),
        duration: m.duration,
        status: m.status,
        meetingUrl: m.meetingUrl,
      }))}
    />
  );
}
