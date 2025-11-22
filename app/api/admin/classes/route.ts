import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET all classes
export async function GET() {
  try {
    const classes = await db.class.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        tutor: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}

// POST create new class
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      subject,
      gradeLevel,
      price,
      capacity,
      schedule,
      thumbnail,
      tutorId,
      published,
    } = body;

    // Validate tutor exists and is a tutor
    const tutorProfile = await db.tutorProfile.findUnique({
      where: { id: tutorId },
      include: { user: true },
    });

    if (!tutorProfile) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    // Create class
    const newClass = await db.class.create({
      data: {
        name,
        description,
        subject,
        gradeLevel,
        price: parseInt(price),
        capacity: parseInt(capacity),
        schedule,
        thumbnail: thumbnail || null,
        tutorId,
        published: published || false,
      },
      include: {
        tutor: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    // Get current admin user from auth header
    const authHeader = request.headers.get("authorization");
    let adminUserId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user: adminUser },
      } = await supabase.auth.getUser(token);
      if (adminUser) {
        adminUserId = adminUser.id;
      }
    }

    // Fallback to tutor's user ID if no auth token
    if (!adminUserId) {
      adminUserId = tutorProfile.userId;
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: adminUserId,
        action: "CREATE_CLASS",
        entity: "Class",
        entityId: newClass.id,
        metadata: {
          className: newClass.name,
          subject: newClass.subject,
          tutor: tutorProfile.user.name,
        },
      },
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    );
  }
}
