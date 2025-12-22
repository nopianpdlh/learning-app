import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - List all scheduled meetings
export async function GET() {
  try {
    const meetings = await prisma.scheduledMeeting.findMany({
      orderBy: { scheduledAt: "desc" },
      include: {
        section: {
          include: {
            tutor: {
              include: {
                user: {
                  select: { name: true },
                },
              },
            },
            template: {
              select: {
                name: true,
                maxStudentsPerSection: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Failed to fetch meetings:", error);
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
      { status: 500 }
    );
  }
}

// POST - Create new scheduled meeting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.sectionId || !body.title || !body.scheduledAt || !body.duration) {
      return NextResponse.json(
        { error: "sectionId, title, scheduledAt, and duration are required" },
        { status: 400 }
      );
    }

    // Get section with tutor availability
    const section = await prisma.classSection.findUnique({
      where: { id: body.sectionId },
      include: {
        tutor: {
          include: {
            availability: true,
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const scheduledDate = new Date(body.scheduledAt);
    const dayOfWeek = scheduledDate.getDay();
    const timeStr = scheduledDate.toTimeString().substring(0, 5);

    // Check tutor availability
    const tutorAvailable = section.tutor.availability.some((a) => {
      if (a.dayOfWeek !== dayOfWeek) return false;
      return a.startTime <= timeStr && a.endTime > timeStr;
    });

    if (!tutorAvailable) {
      return NextResponse.json(
        { error: "Tutor is not available at this time" },
        { status: 400 }
      );
    }

    // Check for conflicting meetings - find all meetings for this tutor on the same day
    const startOfDay = new Date(scheduledDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(scheduledDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sameDayMeetings = await prisma.scheduledMeeting.findMany({
      where: {
        section: { tutorId: section.tutorId },
        status: { not: "CANCELLED" },
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Check for time overlap
    const meetingEnd = new Date(
      scheduledDate.getTime() + body.duration * 60000
    );

    const conflictingMeeting = sameDayMeetings.find((m) => {
      const existingStart = new Date(m.scheduledAt);
      const existingEnd = new Date(
        existingStart.getTime() + m.duration * 60000
      );

      // Check overlap: new meeting starts during existing, or existing starts during new
      return (
        (scheduledDate >= existingStart && scheduledDate < existingEnd) ||
        (meetingEnd > existingStart && meetingEnd <= existingEnd) ||
        (scheduledDate <= existingStart && meetingEnd >= existingEnd)
      );
    });

    if (conflictingMeeting) {
      return NextResponse.json(
        {
          error: `Bentrok dengan meeting lain pada jam ${new Date(
            conflictingMeeting.scheduledAt
          )
            .toTimeString()
            .substring(0, 5)}`,
        },
        { status: 400 }
      );
    }

    // Create the meeting
    const meeting = await prisma.scheduledMeeting.create({
      data: {
        sectionId: body.sectionId,
        title: body.title,
        description: body.description || null,
        scheduledAt: scheduledDate,
        duration: body.duration,
        meetingUrl: body.meetingUrl || null,
        status: "SCHEDULED",
        createdBy: "admin", // TODO: Get from session
      },
      include: {
        section: {
          include: {
            tutor: {
              include: {
                user: { select: { name: true } },
                availability: true,
              },
            },
            template: {
              select: {
                name: true,
                maxStudentsPerSection: true,
              },
            },
          },
        },
      },
    });

    // Create attendance records for all enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: {
        sectionId: body.sectionId,
        status: "ACTIVE",
      },
    });

    if (enrollments.length > 0) {
      await prisma.meetingAttendance.createMany({
        data: enrollments.map((enrollment) => ({
          meetingId: meeting.id,
          enrollmentId: enrollment.id,
          status: "PENDING",
        })),
      });
    }

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error("Failed to create meeting:", error);
    return NextResponse.json(
      { error: "Failed to create meeting" },
      { status: 500 }
    );
  }
}
