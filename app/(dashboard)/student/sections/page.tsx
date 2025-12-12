import { db as prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudentSectionsClient from "./StudentSectionsClient";

export default async function StudentSectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get student profile
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });

  if (!studentProfile) {
    redirect("/login");
  }

  // Get enrollments with sections
  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: studentProfile.id,
      status: { in: ["ACTIVE", "EXPIRED", "PENDING"] },
    },
    include: {
      section: {
        include: {
          template: true,
          tutor: {
            include: { user: { select: { name: true, avatar: true } } },
          },
          _count: {
            select: {
              materials: true,
              assignments: true,
              quizzes: true,
            },
          },
        },
      },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Transform data for client
  const enrolledSections = enrollments
    .filter((e) => e.section)
    .map((enrollment) => {
      const section = enrollment.section!;
      const now = new Date();
      const expiryDate = enrollment.expiryDate
        ? new Date(enrollment.expiryDate)
        : null;

      let daysRemaining = 0;
      if (expiryDate) {
        daysRemaining = Math.max(
          0,
          Math.ceil(
            (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
        );
      }

      return {
        enrollmentId: enrollment.id,
        enrollmentStatus: enrollment.status,
        startDate: enrollment.startDate?.toISOString() || null,
        expiryDate: enrollment.expiryDate?.toISOString() || null,
        daysRemaining,
        meetingsRemaining: enrollment.meetingsRemaining || 0,
        totalMeetings: enrollment.totalMeetings || 0,
        paymentStatus: enrollment.payment?.status || null,
        section: {
          id: section.id,
          label: section.sectionLabel,
          status: section.status,
          template: {
            id: section.template.id,
            name: section.template.name,
            subject: section.template.subject,
            gradeLevel: section.template.gradeLevel,
            thumbnail: section.template.thumbnail,
            pricePerMonth: section.template.pricePerMonth,
          },
          tutor: {
            name: section.tutor.user.name,
            avatar: section.tutor.user.avatar,
          },
          counts: section._count,
        },
      };
    });

  return <StudentSectionsClient enrolledSections={enrolledSections} />;
}
