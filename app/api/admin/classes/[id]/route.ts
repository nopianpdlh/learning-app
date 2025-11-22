import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET single class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const classData = await db.class.findUnique({
      where: { id },
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

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json(classData);
  } catch (error) {
    console.error("Error fetching class:", error);
    return NextResponse.json(
      { error: "Failed to fetch class" },
      { status: 500 }
    );
  }
}

// PUT update class
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const existingClass = await db.class.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Validate tutor if changed
    if (tutorId && tutorId !== existingClass.tutorId) {
      const tutorProfile = await db.tutorProfile.findUnique({
        where: { id: tutorId },
      });

      if (!tutorProfile) {
        return NextResponse.json(
          { error: "Tutor not found" },
          { status: 404 }
        );
      }
    }

    // Update class
    const updatedClass = await db.class.update({
      where: { id },
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
        published,
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
      const { data: { user: adminUser } } = await supabase.auth.getUser(token);
      if (adminUser) {
        adminUserId = adminUser.id;
      }
    }

    // Fallback to tutor's user ID if no auth token
    if (!adminUserId) {
      adminUserId = updatedClass.tutor.user.id;
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: adminUserId,
        action: "UPDATE_CLASS",
        entity: "Class",
        entityId: id,
        metadata: {
          className: updatedClass.name,
          subject: updatedClass.subject,
          published: updatedClass.published,
        },
      },
    });

    return NextResponse.json(updatedClass);
  } catch (error) {
    console.error("Error updating class:", error);
    return NextResponse.json(
      { error: "Failed to update class" },
      { status: 500 }
    );
  }
}

// DELETE class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const classData = await db.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Check if class has enrollments
    if (classData._count.enrollments > 0) {
      return NextResponse.json(
        { error: "Cannot delete class with active enrollments" },
        { status: 400 }
      );
    }

    // Get tutor's user ID for fallback
    const tutorProfile = await db.tutorProfile.findUnique({
      where: { id: classData.tutorId },
      include: { user: true },
    });

    // Get current admin user from auth header
    const authHeader = request.headers.get("authorization");
    let adminUserId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user: adminUser } } = await supabase.auth.getUser(token);
      if (adminUser) {
        adminUserId = adminUser.id;
      }
    }

    // Fallback to tutor's user ID if no auth token
    if (!adminUserId && tutorProfile) {
      adminUserId = tutorProfile.user.id;
    }

    // Ensure we have a valid user ID
    if (!adminUserId) {
      return NextResponse.json(
        { error: "Unable to determine admin user" },
        { status: 401 }
      );
    }

    // Create DELETE audit log before deletion
    await db.auditLog.create({
      data: {
        userId: adminUserId,
        action: "DELETE_CLASS",
        entity: "Class",
        entityId: id,
        metadata: {
          className: classData.name,
          subject: classData.subject,
          enrollmentCount: classData._count.enrollments,
        },
      },
    });

    // Delete class (cascade will handle related records)
    await db.class.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Class deleted" });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    );
  }
}
