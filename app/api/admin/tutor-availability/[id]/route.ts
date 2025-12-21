import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DELETE - Delete availability slot
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const slot = await prisma.tutorAvailability.findUnique({
      where: { id },
    });

    if (!slot) {
      return NextResponse.json(
        { error: "Availability slot not found" },
        { status: 404 }
      );
    }

    await prisma.tutorAvailability.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete availability slot:", error);
    return NextResponse.json(
      { error: "Failed to delete availability slot" },
      { status: 500 }
    );
  }
}

// PATCH - Update availability slot (toggle active state)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const slot = await prisma.tutorAvailability.update({
      where: { id },
      data: {
        isActive: body.isActive,
      },
    });

    return NextResponse.json(slot);
  } catch (error) {
    console.error("Failed to update availability slot:", error);
    return NextResponse.json(
      { error: "Failed to update availability slot" },
      { status: 500 }
    );
  }
}
