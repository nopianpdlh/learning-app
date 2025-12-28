import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

// GET - List student's meeting requests
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student profile
    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!studentProfile) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Get meeting requests by this student
    const requests = await db.scheduledMeeting.findMany({
      where: {
        requestedBy: studentProfile.id,
      },
      include: {
        section: {
          include: {
            template: true,
            tutor: {
              include: { user: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching meeting requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

// POST - Create new meeting request
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sectionId, scheduledAt, duration, note } = body;

    // Validate required fields
    if (!sectionId || !scheduledAt || !duration) {
      return NextResponse.json(
        { error: "sectionId, scheduledAt, and duration are required" },
        { status: 400 }
      );
    }

    // Get student profile
    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!studentProfile) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Check enrollment
    const enrollment = await db.enrollment.findFirst({
      where: {
        studentId: studentProfile.id,
        sectionId,
        status: "ACTIVE",
      },
      include: {
        section: {
          include: { template: true },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        {
          error:
            "Anda tidak terdaftar di kelas ini atau enrollment tidak aktif",
        },
        { status: 403 }
      );
    }

    // Check if it's a PRIVATE class
    if (enrollment.section.template.classType !== "PRIVATE") {
      return NextResponse.json(
        { error: "Fitur request jadwal hanya untuk kelas PRIVATE" },
        { status: 403 }
      );
    }

    // Check remaining meetings
    if (enrollment.meetingsRemaining <= 0) {
      return NextResponse.json(
        { error: "Kuota meeting Anda sudah habis" },
        { status: 403 }
      );
    }

    // Check pending request limit (max 2)
    const pendingCount = await db.scheduledMeeting.count({
      where: {
        requestedBy: studentProfile.id,
        sectionId,
        requestStatus: "PENDING",
      },
    });

    if (pendingCount >= 2) {
      return NextResponse.json(
        {
          error:
            "Anda sudah memiliki 2 request pending. Tunggu approval terlebih dahulu.",
        },
        { status: 403 }
      );
    }

    // Validate scheduled time (must be at least 24 hours ahead)
    const requestedTime = new Date(scheduledAt);
    const minTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (requestedTime < minTime) {
      return NextResponse.json(
        { error: "Jadwal harus minimal 24 jam dari sekarang" },
        { status: 400 }
      );
    }

    // Create meeting request
    const meeting = await db.scheduledMeeting.create({
      data: {
        sectionId,
        title: `Request Meeting - ${enrollment.section.template.name}`,
        description: note || null,
        scheduledAt: requestedTime,
        duration: parseInt(duration),
        status: "SCHEDULED",
        createdBy: user.id,
        requestedBy: studentProfile.id,
        requestStatus: "PENDING",
        requestNote: note || null,
      },
      include: {
        section: {
          include: { template: true },
        },
      },
    });

    // Create notification for admin
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    await db.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: "Request Jadwal Meeting Baru",
        message: `${
          user.user_metadata?.name || user.email
        } mengajukan jadwal meeting untuk ${enrollment.section.template.name}`,
        type: "CLASS",
        link: "/admin/meeting-requests",
      })),
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error("Error creating meeting request:", error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  }
}
