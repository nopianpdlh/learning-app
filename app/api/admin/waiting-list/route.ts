import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - List all waiting list entries
export async function GET() {
  try {
    const waitingList = await prisma.waitingList.findMany({
      orderBy: { requestedAt: "desc" },
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

    return NextResponse.json(waitingList);
  } catch (error) {
    console.error("Failed to fetch waiting list:", error);
    return NextResponse.json(
      { error: "Failed to fetch waiting list" },
      { status: 500 }
    );
  }
}
