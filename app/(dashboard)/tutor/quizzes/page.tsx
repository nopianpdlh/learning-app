import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import TutorQuizzesClient from "@/components/features/tutor/TutorQuizzesClient";

export default async function TutorQuizzesPage() {
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

  // Get all classes taught by this tutor
  const classes = await prisma.class.findMany({
    where: {
      tutorId: tutorProfile.id,
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

  // Get all quizzes for tutor's classes with enrollments and attempts
  const quizzes = await prisma.quiz.findMany({
    where: {
      classId: {
        in: classes.map((c) => c.id),
      },
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          subject: true,
          enrollments: {
            where: {
              status: {
                in: ["PAID", "ACTIVE"],
              },
            },
            select: {
              id: true,
            },
          },
        },
      },
      questions: {
        select: {
          id: true,
        },
      },
      attempts: {
        include: {
          student: {
            select: {
              id: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate stats for each quiz
  const quizzesWithStats = quizzes.map((quiz) => {
    const totalStudents = quiz.class.enrollments.length;
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

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      classId: quiz.classId,
      className: quiz.class.name,
      classSubject: quiz.class.subject,
      timeLimit: quiz.timeLimit,
      startDate: quiz.startDate?.toISOString() || null,
      endDate: quiz.endDate?.toISOString() || null,
      passingGrade: quiz.passingGrade,
      status: quiz.status,
      questionsCount: quiz.questions.length,
      totalStudents,
      participants: uniqueParticipants,
      avgScore,
      createdAt: quiz.createdAt.toISOString(),
      updatedAt: quiz.updatedAt.toISOString(),
    };
  });

  return <TutorQuizzesClient quizzes={quizzesWithStats} classes={classes} />;
}
