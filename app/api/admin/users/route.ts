import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET all users
export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        studentProfile: true,
        tutorProfile: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, role, password } = body;

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          role: role.toUpperCase(),
        },
      });

    if (authError) {
      console.error("Supabase auth error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Create user in database
    const user = await db.user.create({
      data: {
        id: authData.user.id,
        email,
        name,
        phone: phone || null,
        role: role.toUpperCase(),
      },
    });

    // Create profile based on role
    if (role.toUpperCase() === "STUDENT") {
      await db.studentProfile.create({
        data: {
          userId: user.id,
        },
      });
    } else if (role.toUpperCase() === "TUTOR") {
      await db.tutorProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Get current admin user from auth header
    const authHeader = request.headers.get("authorization");
    let adminUserId = user.id; // Default to new user if no auth

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user: adminUser },
      } = await supabase.auth.getUser(token);
      if (adminUser) {
        adminUserId = adminUser.id;
      }
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: adminUserId,
        action: "CREATE_USER",
        entity: "User",
        entityId: user.id,
        metadata: {
          role: user.role,
          email: user.email,
          createdUser: user.name,
        },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
