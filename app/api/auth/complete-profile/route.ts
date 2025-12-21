import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const completeProfileSchema = z.object({
  userId: z.string(),
  name: z.string().min(3),
  phone: z.string().nullable().optional(),
  gradeLevel: z.string(),
  acceptTerms: z.boolean(),
  acceptPrivacy: z.boolean(),
  acceptMarketing: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = completeProfileSchema.parse(body);

    // Update user name and phone
    await db.user.update({
      where: { id: data.userId },
      data: {
        name: data.name,
        phone: data.phone || null,
      },
    });

    // Find and update student profile
    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: data.userId },
    });

    if (studentProfile) {
      await db.studentProfile.update({
        where: { id: studentProfile.id },
        data: {
          gradeLevel: data.gradeLevel,
        },
      });
    } else {
      // Create student profile if not exists
      await db.studentProfile.create({
        data: {
          userId: data.userId,
          gradeLevel: data.gradeLevel,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Complete profile error:", error);
    return NextResponse.json(
      { error: "Failed to complete profile" },
      { status: 500 }
    );
  }
}
