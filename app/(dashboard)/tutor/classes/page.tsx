import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import TutorClassesClient from "../../../../components/features/tutor/TutorClassesClient";
import {
  generateClassCode,
  determineClassStatus,
  calculateClassProgress,
  type ClassWithStats,
} from "@/lib/class-helpers";

export default async function TutorClassesPage() {
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

  // Fetch tutor's classes with all required data
  const classes = await prisma.class.findMany({
    where: {
      tutorId: dbUser.tutorProfile.id,
    },
    include: {
      _count: {
        select: {
          enrollments: {
            where: {
              status: {
                in: ["PAID", "ACTIVE"],
              },
            },
          },
          materials: true,
          assignments: {
            where: {
              status: "PUBLISHED",
            },
          },
          quizzes: {
            where: {
              status: "PUBLISHED",
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform data for client component
  const classesWithStats: ClassWithStats[] = classes.map((cls, index) => ({
    id: cls.id,
    name: cls.name,
    code: generateClassCode(cls.subject, cls.gradeLevel, index),
    students: cls._count.enrollments,
    schedule: cls.schedule,
    status: determineClassStatus(cls.published, cls._count.enrollments),
    progress: calculateClassProgress({
      materials: cls._count.materials,
      assignments: cls._count.assignments,
      quizzes: cls._count.quizzes,
    }),
    subject: cls.subject,
    gradeLevel: cls.gradeLevel,
    published: cls.published,
  }));

  return <TutorClassesClient classes={classesWithStats} />;
}
