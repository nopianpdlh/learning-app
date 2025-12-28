import { db as prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudentSectionDetailClient from "./StudentSectionDetailClient";

export default async function StudentSectionDetailPage({
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

  // Get student profile
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      studentProfile: true,
    },
  });

  if (!dbUser?.studentProfile) {
    redirect("/login");
  }

  // Fetch section with full details
  const section = await prisma.classSection.findUnique({
    where: { id: sectionId },
    include: {
      template: true,
      tutor: {
        include: {
          user: { select: { name: true, avatar: true, email: true } },
        },
      },
    },
  });

  if (!section) {
    redirect("/student/sections");
  }

  // Check if student is enrolled
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: dbUser.studentProfile.id,
      sectionId,
      status: { in: ["ACTIVE", "EXPIRED"] },
    },
  });

  if (!enrollment) {
    redirect("/student/sections");
  }

  // Fetch content
  const [materials, assignments, quizzes, meetings, completedMeetingsCount] =
    await Promise.all([
      prisma.material.findMany({
        where: { sectionId },
        orderBy: { session: "asc" },
      }),
      prisma.assignment.findMany({
        where: { sectionId, status: "PUBLISHED" },
        orderBy: { dueDate: "asc" },
        include: {
          submissions: {
            where: { studentId: dbUser.studentProfile.id },
            select: { id: true, status: true, score: true },
          },
        },
      }),
      prisma.quiz.findMany({
        where: { sectionId, status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { questions: true } },
          attempts: {
            where: { studentId: dbUser.studentProfile.id },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, score: true, submittedAt: true },
          },
        },
      }),
      prisma.scheduledMeeting.findMany({
        where: { sectionId },
        orderBy: { scheduledAt: "asc" },
        take: 5,
      }),
      // Count completed meetings (status COMPLETED OR past meetings)
      prisma.scheduledMeeting.count({
        where: {
          sectionId,
          OR: [{ status: "COMPLETED" }, { scheduledAt: { lt: new Date() } }],
        },
      }),
    ]);

  const now = new Date();
  const expiryDate = enrollment.expiryDate
    ? new Date(enrollment.expiryDate)
    : null;
  let daysRemaining = 0;
  if (expiryDate) {
    daysRemaining = Math.max(
      0,
      Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
  }

  // Calculate meetings remaining based on completed meetings
  const totalMeetings = enrollment.totalMeetings || 0;
  const meetingsRemaining = Math.max(0, totalMeetings - completedMeetingsCount);

  return (
    <StudentSectionDetailClient
      section={{
        id: section.id,
        label: section.sectionLabel,
        status: section.status,
        template: {
          ...section.template,
          classType: section.template.classType,
        },
        tutor: {
          id: section.tutor.id,
          name: section.tutor.user.name,
          avatar: section.tutor.user.avatar,
          email: section.tutor.user.email,
        },
      }}
      enrollment={{
        id: enrollment.id,
        status: enrollment.status,
        startDate: enrollment.startDate?.toISOString() || null,
        expiryDate: enrollment.expiryDate?.toISOString() || null,
        daysRemaining,
        meetingsRemaining,
        totalMeetings,
      }}
      materials={materials.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      }))}
      assignments={assignments.map((a) => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate.toISOString(),
        maxPoints: a.maxPoints,
        status: a.status,
        submission: a.submissions[0] || null,
      }))}
      quizzes={quizzes.map((q) => ({
        id: q.id,
        title: q.title,
        questionsCount: q._count.questions,
        timeLimit: q.timeLimit,
        passingGrade: q.passingGrade,
        lastAttempt: q.attempts[0]
          ? {
              id: q.attempts[0].id,
              score: q.attempts[0].score,
              submittedAt: q.attempts[0].submittedAt
                ? q.attempts[0].submittedAt.toISOString()
                : null,
            }
          : null,
      }))}
      meetings={meetings.map((m) => ({
        id: m.id,
        title: m.title,
        scheduledAt: m.scheduledAt.toISOString(),
        duration: m.duration,
        meetingUrl: m.meetingUrl,
        recordingUrl: m.recordingUrl,
        status: m.status,
      }))}
    />
  );
}
