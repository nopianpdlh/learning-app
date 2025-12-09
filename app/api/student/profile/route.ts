/**
 * Student Profile API
 * GET /api/student/profile - Get current profile
 * PUT /api/student/profile - Update profile
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        studentProfile: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        avatar: userData.avatar,
      },
      profile: userData.studentProfile
        ? {
            id: userData.studentProfile.id,
            gradeLevel: userData.studentProfile.gradeLevel,
            school: userData.studentProfile.school,
            parentName: userData.studentProfile.parentName,
            parentPhone: userData.studentProfile.parentPhone,
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/student/profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, gradeLevel, school, parentName, parentPhone } = body;

    // Validate required fields
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Nama harus minimal 2 karakter" },
        { status: 400 }
      );
    }

    // Update user and student profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update User
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          name: name.trim(),
          phone: phone?.trim() || null,
        },
      });

      // Update or create StudentProfile
      const updatedProfile = await tx.studentProfile.upsert({
        where: { userId: user.id },
        update: {
          gradeLevel: gradeLevel?.trim() || null,
          school: school?.trim() || null,
          parentName: parentName?.trim() || null,
          parentPhone: parentPhone?.trim() || null,
        },
        create: {
          userId: user.id,
          gradeLevel: gradeLevel?.trim() || null,
          school: school?.trim() || null,
          parentName: parentName?.trim() || null,
          parentPhone: parentPhone?.trim() || null,
        },
      });

      return { user: updatedUser, profile: updatedProfile };
    });

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        phone: result.user.phone,
        avatar: result.user.avatar,
      },
      profile: {
        id: result.profile.id,
        gradeLevel: result.profile.gradeLevel,
        school: result.profile.school,
        parentName: result.profile.parentName,
        parentPhone: result.profile.parentPhone,
      },
    });
  } catch (error) {
    console.error("PUT /api/student/profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
