import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST - Reject waiting list entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get the waiting list entry
    const entry = await prisma.waitingList.findUnique({
      where: { id },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Waiting list entry not found" },
        { status: 404 }
      );
    }

    if (entry.status !== "PENDING") {
      return NextResponse.json(
        { error: "Entry is not in PENDING status" },
        { status: 400 }
      );
    }

    // Update waiting list entry
    const updatedEntry = await prisma.waitingList.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectionNote: body.rejectionNote || null,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        template: {
          include: {
            sections: {
              where: {
                status: "ACTIVE",
              },
            },
          },
        },
      },
    });

    // TODO: Send notification email to student about rejection

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error("Failed to reject waiting list entry:", error);
    return NextResponse.json({ error: "Failed to reject" }, { status: 500 });
  }
}
