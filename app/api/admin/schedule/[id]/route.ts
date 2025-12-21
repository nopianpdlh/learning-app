import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Get single meeting with attendance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const meeting = await prisma.scheduledMeeting.findUnique({
      where: { id },
      include: {
        section: {
          include: {
            tutor: {
              include: {
                user: { select: { name: true } },
              },
            },
            template: true,
          },
        },
        attendance: {
          include: {
            enrollment: {
              include: {
                student: {
                  include: {
                    user: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Failed to fetch meeting:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting" },
      { status: 500 }
    );
  }
}

// PATCH - Update meeting
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.scheduledAt !== undefined)
      updateData.scheduledAt = new Date(body.scheduledAt);
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.meetingUrl !== undefined) updateData.meetingUrl = body.meetingUrl;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.recordingUrl !== undefined)
      updateData.recordingUrl = body.recordingUrl;

    const meeting = await prisma.scheduledMeeting.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Failed to update meeting:", error);
    return NextResponse.json(
      { error: "Failed to update meeting" },
      { status: 500 }
    );
  }
}

// DELETE - Delete meeting (also deletes attendance records)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete attendance records first
    await prisma.meetingAttendance.deleteMany({
      where: { meetingId: id },
    });

    // Delete the meeting
    await prisma.scheduledMeeting.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete meeting:", error);
    return NextResponse.json(
      { error: "Failed to delete meeting" },
      { status: 500 }
    );
  }
}
