import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

// POST - Reject meeting request
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await req.json();
    const { reason } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Alasan penolakan harus diisi" },
        { status: 400 }
      );
    }

    // Get meeting request
    const meeting = await db.scheduledMeeting.findUnique({
      where: { id },
      include: {
        section: {
          include: { template: true },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting request not found" },
        { status: 404 }
      );
    }

    if (meeting.requestStatus !== "PENDING") {
      return NextResponse.json(
        { error: "Request sudah diproses sebelumnya" },
        { status: 400 }
      );
    }

    // Update meeting to rejected
    const updatedMeeting = await db.scheduledMeeting.update({
      where: { id },
      data: {
        requestStatus: "REJECTED",
        reviewedBy: user.id,
        reviewedAt: new Date(),
        rejectionNote: reason,
        status: "CANCELLED",
      },
    });

    // Get student user ID for notification
    if (meeting.requestedBy) {
      const studentProfile = await db.studentProfile.findUnique({
        where: { id: meeting.requestedBy },
        select: { userId: true },
      });

      if (studentProfile) {
        // Notify student
        await db.notification.create({
          data: {
            userId: studentProfile.userId,
            title: "Request Jadwal Ditolak ❌",
            message: `Request meeting Anda untuk ${meeting.section.template.name} ditolak. Alasan: ${reason}`,
            type: "CLASS",
            link: `/student/sections/${meeting.sectionId}`,
          },
        });
      }
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "REJECT_MEETING_REQUEST",
        entity: "ScheduledMeeting",
        entityId: id,
        metadata: {
          sectionId: meeting.sectionId,
          reason,
        },
      },
    });

    return NextResponse.json(updatedMeeting);
  } catch (error) {
    console.error("Error rejecting meeting request:", error);
    return NextResponse.json(
      { error: "Failed to reject request" },
      { status: 500 }
    );
  }
}
