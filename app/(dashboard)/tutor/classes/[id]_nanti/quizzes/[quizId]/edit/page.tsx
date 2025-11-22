/**
 * Edit Quiz Page
 * /tutor/classes/[id]/quizzes/[quizId]/edit
 */

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import QuizForm from "../../create/QuizForm";

interface PageProps {
  params: {
    id: string;
    quizId: string;
  };
}

export default async function EditQuizPage({ params }: PageProps) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user role
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!profile || profile.role !== "TUTOR") {
    redirect("/");
  }

  // Verify tutor owns the class
  const classData = await prisma.class.findFirst({
    where: {
      id: params.id,
      tutorId: user.id,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!classData) {
    redirect("/tutor/dashboard");
  }

  // Fetch quiz with questions
  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!quiz || quiz.classId !== params.id) {
    redirect(`/tutor/classes/${params.id}/quizzes`);
  }

  // Transform data for form
  const initialData = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    timeLimit: quiz.timeLimit,
    startDate: quiz.startDate,
    endDate: quiz.endDate,
    passingGrade: quiz.passingGrade,
    status: quiz.status,
    questions: quiz.questions.map((q) => ({
      questionType: q.questionType as
        | "MULTIPLE_CHOICE"
        | "TRUE_FALSE"
        | "SHORT_ANSWER",
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || "",
      points: q.points,
      orderIndex: q.orderIndex,
    })),
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Kuis</h1>
        <p className="text-gray-600 mt-2">
          Kelas: <span className="font-medium">{classData.name}</span>
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <QuizForm classId={params.id} initialData={initialData} />
      </div>
    </div>
  );
}
