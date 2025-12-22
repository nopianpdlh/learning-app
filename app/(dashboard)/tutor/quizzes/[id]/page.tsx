import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import QuizDetailClient from "@/components/features/tutor/QuizDetailClient";

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get tutor profile
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!tutorProfile) {
    redirect("/");
  }

  // Get quiz with questions and attempts
  const quiz = await prisma.quiz.findUnique({
    where: {
      id,
    },
    include: {
      section: {
        select: {
          id: true,
          sectionLabel: true,
          tutorId: true,
          template: {
            select: {
              name: true,
              subject: true,
            },
          },
          enrollments: {
            where: {
              status: { in: ["ACTIVE", "EXPIRED"] },
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
      questions: {
        orderBy: {
          orderIndex: "asc",
        },
      },
      attempts: {
        include: {
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
        orderBy: {
          submittedAt: "desc",
        },
      },
    },
  });

  if (!quiz) {
    notFound();
  }

  // Check if tutor owns this quiz
  if (quiz.section.tutorId !== tutorProfile.id) {
    redirect("/tutor/quizzes");
  }

  // Calculate stats
  const totalStudents = quiz.section.enrollments.length;
  const uniqueParticipants = new Set(quiz.attempts.map((a) => a.student.id))
    .size;

  // Calculate average score from submitted attempts
  const submittedAttempts = quiz.attempts.filter(
    (a) => a.submittedAt && a.score !== null
  );
  const avgScore =
    submittedAttempts.length > 0
      ? Math.round(
          submittedAttempts.reduce((acc, a) => acc + (a.score || 0), 0) /
            submittedAttempts.length
        )
      : 0;

  // Find students who haven't attempted
  const attemptedStudentIds = new Set(quiz.attempts.map((a) => a.student.id));
  const notAttemptedStudents = quiz.section.enrollments
    .filter((e) => !attemptedStudentIds.has(e.student.id))
    .map((e) => ({
      id: e.student.id,
      user: e.student.user,
    }));

  // Serialize data
  const quizData = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    classId: quiz.sectionId, // For compatibility with QuizDetailClient
    className: `${quiz.section.template.name} - Section ${quiz.section.sectionLabel}`,
    classSubject: quiz.section.template.subject,
    timeLimit: quiz.timeLimit,
    startDate: quiz.startDate?.toISOString() || null,
    endDate: quiz.endDate?.toISOString() || null,
    passingGrade: quiz.passingGrade,
    status: quiz.status,
    createdAt: quiz.createdAt.toISOString(),
    updatedAt: quiz.updatedAt.toISOString(),
  };

  const questionsData = quiz.questions.map((q) => ({
    id: q.id,
    quizId: q.quizId,
    questionType: q.questionType,
    questionText: q.questionText,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    points: q.points,
    orderIndex: q.orderIndex,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
  }));

  const attemptsData = quiz.attempts.map((a) => ({
    id: a.id,
    quizId: a.quizId,
    studentId: a.studentId,
    studentName: a.student.user.name,
    studentEmail: a.student.user.email,
    studentAvatar: a.student.user.avatar,
    startedAt: a.startedAt.toISOString(),
    submittedAt: a.submittedAt?.toISOString() || null,
    score: a.score,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  const statsData = {
    totalStudents,
    participants: uniqueParticipants,
    avgScore,
    questionsCount: quiz.questions.length,
    notAttemptedCount: notAttemptedStudents.length,
  };

  return (
    <QuizDetailClient
      quiz={quizData}
      questions={questionsData}
      attempts={attemptsData}
      notAttemptedStudents={notAttemptedStudents}
      stats={statsData}
    />
  );
}
