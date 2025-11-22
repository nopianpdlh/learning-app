import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/tutors - Get all tutors
export async function GET(req: NextRequest) {
  try {
    const tutors = await db.tutorProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    return NextResponse.json({ tutors });
  } catch (error) {
    console.error("Get tutors error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data tutor" },
      { status: 500 }
    );
  }
}
