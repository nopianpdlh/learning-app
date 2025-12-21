import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const createUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().nullable().optional(),
  role: z.enum(["ADMIN", "TUTOR", "STUDENT"]),
  gradeLevel: z.string().nullable().optional(),
  acceptMarketing: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createUserSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { id: data.id },
    });

    if (existingUser) {
      return NextResponse.json({ success: true, user: existingUser });
    }

    // Create user in database
    const user = await db.user.create({
      data: {
        id: data.id,
        email: data.email,
        name: data.name,
        phone: data.phone || null,
        role: data.role,
      },
    });

    // Create profile based on role
    if (data.role === "STUDENT") {
      await db.studentProfile.create({
        data: {
          userId: user.id,
          gradeLevel: data.gradeLevel || null,
        },
      });
    } else if (data.role === "TUTOR") {
      await db.tutorProfile.create({
        data: {
          userId: user.id,
          subjects: [],
        },
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
