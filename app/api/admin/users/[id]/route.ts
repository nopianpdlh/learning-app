import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        tutorProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, role } = body;

    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user in Supabase Auth metadata
    await supabase.auth.admin.updateUserById(id, {
      email,
      user_metadata: {
        name,
        role: role.toUpperCase(),
      },
    });

    // Update user in database
    const user = await db.user.update({
      where: { id },
      data: {
        name,
        email,
        phone: phone || null,
        role: role.toUpperCase(),
      },
    });

    // Handle profile changes if role changed
    if (existingUser.role !== role.toUpperCase()) {
      // Delete old profile
      if (existingUser.role === "STUDENT") {
        await db.studentProfile.deleteMany({ where: { userId: id } });
      } else if (existingUser.role === "TUTOR") {
        await db.tutorProfile.deleteMany({ where: { userId: id } });
      }

      // Create new profile
      if (role.toUpperCase() === "STUDENT") {
        await db.studentProfile.create({
          data: { userId: id },
        });
      } else if (role.toUpperCase() === "TUTOR") {
        await db.tutorProfile.create({
          data: { userId: id },
        });
      }
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: id,
        action: "UPDATE_USER",
        entity: "User",
        entityId: id,
        metadata: { role: user.role, email: user.email },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current admin user from auth header
    const authHeader = request.headers.get("authorization");
    let adminUserId = id; // Default to target user if no auth

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user: adminUser },
      } = await supabase.auth.getUser(token);
      if (adminUser) {
        adminUserId = adminUser.id;
      }
    }

    // Create DELETE audit log before deletion (using admin as actor)
    if (adminUserId !== id) {
      await db.auditLog.create({
        data: {
          userId: adminUserId,
          action: "DELETE_USER",
          entity: "User",
          entityId: id,
          metadata: {
            deletedUser: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    }

    // Delete audit logs of the target user (foreign key constraint)
    await db.auditLog.deleteMany({
      where: { userId: id },
    });

    // Delete from Supabase Auth
    await supabase.auth.admin.deleteUser(id);

    // Delete from database (profiles will cascade delete)
    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
