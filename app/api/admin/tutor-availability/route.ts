import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - List all tutor availability slots
export async function GET() {
  try {
    const slots = await prisma.tutorAvailability.findMany({
      orderBy: [{ tutorId: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
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
      },
    });

    return NextResponse.json(slots);
  } catch (error) {
    console.error("Failed to fetch availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

// POST - Create new availability slot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (
      body.dayOfWeek === undefined ||
      !body.startTime ||
      !body.endTime ||
      !body.tutorId
    ) {
      return NextResponse.json(
        { error: "tutorId, dayOfWeek, startTime, and endTime are required" },
        { status: 400 }
      );
    }

    // Check for overlapping slots
    const existingSlot = await prisma.tutorAvailability.findFirst({
      where: {
        tutorId: body.tutorId,
        dayOfWeek: body.dayOfWeek,
        OR: [
          {
            AND: [
              { startTime: { lte: body.startTime } },
              { endTime: { gt: body.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: body.endTime } },
              { endTime: { gte: body.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: body.startTime } },
              { endTime: { lte: body.endTime } },
            ],
          },
        ],
      },
    });

    if (existingSlot) {
      return NextResponse.json(
        { error: "Slot overlaps with existing availability" },
        { status: 400 }
      );
    }

    const slot = await prisma.tutorAvailability.create({
      data: {
        tutorId: body.tutorId,
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        isActive: true,
      },
    });

    return NextResponse.json(slot, { status: 201 });
  } catch (error) {
    console.error("Failed to create availability slot:", error);
    return NextResponse.json(
      { error: "Failed to create availability slot" },
      { status: 500 }
    );
  }
}
