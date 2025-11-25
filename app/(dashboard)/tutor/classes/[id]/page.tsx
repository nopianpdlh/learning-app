import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import ClassDetailClient from "@/components/features/tutor/ClassDetailClient";
import {
  generateClassCode,
  determineClassStatus,
  calculateClassProgress,
} from "@/lib/class-helpers";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClassDetailPage({ params }: PageProps) {
  const { id } = await params;
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

  // Fetch class data with all required relations
  const classData = await prisma.class.findUnique({
    where: { id },
    include: {
      tutor: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
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
          liveClasses: true,
          forumThreads: true,
        },
      },
      liveClasses: {
        where: {
          scheduledAt: {
            gte: new Date(),
          },
        },
        orderBy: {
          scheduledAt: "asc",
        },
        take: 3,
      },
    },
  });

  if (!classData) {
    redirect("/tutor/classes");
  }

  // Verify tutor owns this class
  if (classData.tutorId !== dbUser.tutorProfile.id) {
    redirect("/tutor/classes");
  }

  // Transform data for client component
  const classWithStats = {
    id: classData.id,
    name: classData.name,
    description: classData.description,
    code: generateClassCode(classData.subject, classData.gradeLevel, 0),
    subject: classData.subject,
    gradeLevel: classData.gradeLevel,
    schedule: classData.schedule,
    price: classData.price,
    capacity: classData.capacity,
    thumbnail: classData.thumbnail,
    published: classData.published,
    status: determineClassStatus(
      classData.published,
      classData._count.enrollments
    ),
    progress: calculateClassProgress({
      materials: classData._count.materials,
      assignments: classData._count.assignments,
      quizzes: classData._count.quizzes,
    }),
    stats: {
      students: classData._count.enrollments,
      materials: classData._count.materials,
      assignments: classData._count.assignments,
      quizzes: classData._count.quizzes,
      liveClasses: classData._count.liveClasses,
      forumThreads: classData._count.forumThreads,
    },
    upcomingLiveClasses: classData.liveClasses.map((lc) => ({
      id: lc.id,
      title: lc.title,
      scheduledAt: lc.scheduledAt.toISOString(),
      duration: lc.duration,
    })),
  };

  return <ClassDetailClient classData={classWithStats} />;
}
