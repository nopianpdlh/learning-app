import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

// GET section detail with enrollment status for current student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sectionId } = await params;

    // Get student profile
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      include: {
        studentProfile: true,
      },
    });

    if (!dbUser?.studentProfile) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Fetch section with full details
    const section = await prisma.classSection.findUnique({
      where: { id: sectionId },
      include: {
        template: true,
        tutor: {
          include: { user: { select: { name: true, avatar: true } } },
        },
        _count: {
          select: {
            enrollments: true,
            materials: true,
            assignments: true,
            quizzes: true,
            meetings: true,
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Check if student is enrolled in this section
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: dbUser.studentProfile.id,
        sectionId,
        status: { in: ["ACTIVE", "EXPIRED"] },
      },
      include: {
        payment: true,
      },
    });

    // Calculate subscription info
    let subscriptionInfo = null;
    if (enrollment) {
      const now = new Date();
      const expiryDate = enrollment.expiryDate
        ? new Date(enrollment.expiryDate)
        : null;
      const graceExpiryDate = enrollment.graceExpiryDate
        ? new Date(enrollment.graceExpiryDate)
        : null;

      let daysRemaining = 0;
      let isInGracePeriod = false;
      let graceDaysRemaining = 0;

      if (expiryDate) {
        daysRemaining = Math.max(
          0,
          Math.ceil(
            (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
        );
      }

      if (enrollment.status === "EXPIRED" && graceExpiryDate) {
        isInGracePeriod = true;
        graceDaysRemaining = Math.max(
          0,
          Math.ceil(
            (graceExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
        );
      }

      subscriptionInfo = {
        enrollmentId: enrollment.id,
        status: enrollment.status,
        startDate: enrollment.startDate,
        expiryDate: enrollment.expiryDate,
        daysRemaining,
        isInGracePeriod,
        graceDaysRemaining,
        meetingsRemaining: enrollment.meetingsRemaining,
        totalMeetings: enrollment.totalMeetings,
      };
    }

    return NextResponse.json({
      id: section.id,
      label: section.sectionLabel,
      status: section.status,
      template: section.template,
      tutor: {
        id: section.tutor.id,
        name: section.tutor.user.name,
        avatar: section.tutor.user.avatar,
      },
      counts: section._count,
      enrollment: subscriptionInfo,
      isEnrolled: !!enrollment,
    });
  } catch (error) {
    console.error("Error fetching section detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch section" },
      { status: 500 }
    );
  }
}
