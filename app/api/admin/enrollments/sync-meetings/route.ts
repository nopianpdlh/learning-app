import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

// POST - Sync enrollment meeting quotas with template configuration
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get all active enrollments with template info
    const enrollments = await db.enrollment.findMany({
      where: {
        status: { in: ["ACTIVE", "PENDING"] },
      },
      include: {
        section: {
          include: {
            template: true,
          },
        },
      },
    });

    let updatedCount = 0;
    const updates: {
      id: string;
      oldTotal: number;
      newTotal: number;
      className: string;
    }[] = [];

    for (const enrollment of enrollments) {
      const templateMeetings = enrollment.section.template.meetingsPerPeriod;

      // Check if enrollment totalMeetings doesn't match template
      if (enrollment.totalMeetings !== templateMeetings) {
        // Calculate how many meetings used
        const meetingsUsed =
          enrollment.totalMeetings - enrollment.meetingsRemaining;

        // New remaining = template meetings - used (but not less than 0)
        const newRemaining = Math.max(0, templateMeetings - meetingsUsed);

        await db.enrollment.update({
          where: { id: enrollment.id },
          data: {
            totalMeetings: templateMeetings,
            meetingsRemaining: newRemaining,
          },
        });

        updates.push({
          id: enrollment.id,
          oldTotal: enrollment.totalMeetings,
          newTotal: templateMeetings,
          className: enrollment.section.template.name,
        });
        updatedCount++;
      }
    }

    // Log the sync operation
    if (updatedCount > 0) {
      console.log(
        `[SYNC_MEETINGS] Admin ${user.id} synced ${updatedCount} enrollments:`,
        updates
      );
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${updatedCount} enrollment(s)`,
      updatedCount,
      updates,
    });
  } catch (error) {
    console.error("Error syncing enrollment meetings:", error);
    return NextResponse.json(
      { error: "Failed to sync enrollments" },
      { status: 500 }
    );
  }
}

// GET - Preview enrollments that need syncing
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get enrollments that don't match template
    const enrollments = await db.enrollment.findMany({
      where: {
        status: { in: ["ACTIVE", "PENDING"] },
      },
      include: {
        section: {
          include: {
            template: true,
          },
        },
        student: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    const mismatchedEnrollments = enrollments
      .filter((e) => e.totalMeetings !== e.section.template.meetingsPerPeriod)
      .map((e) => ({
        enrollmentId: e.id,
        studentName: e.student.user.name,
        studentEmail: e.student.user.email,
        className: e.section.template.name,
        classType: e.section.template.classType,
        currentTotal: e.totalMeetings,
        currentRemaining: e.meetingsRemaining,
        templateMeetings: e.section.template.meetingsPerPeriod,
        status: e.status,
      }));

    return NextResponse.json({
      total: mismatchedEnrollments.length,
      enrollments: mismatchedEnrollments,
    });
  } catch (error) {
    console.error("Error fetching mismatched enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}
