/**
 * Live Classes API - Get, Update, Delete by ID
 * GET /api/live-classes/[id] - Get single live class
 * PUT /api/live-classes/[id] - Update live class
 * DELETE /api/live-classes/[id] - Delete live class
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { updateLiveClassSchema } from "@/lib/validations/liveclass.schema";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Fetch live class
    const liveClass = await prisma.liveClass.findUnique({
      where: { id: params.id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            tutorId: true,
            tutor: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!liveClass) {
      return NextResponse.json(
        { error: "Live class not found" },
        { status: 404 }
      );
    }

    // Role-based access control
    if (profile.role === "STUDENT") {
      // Students can only access live classes from enrolled classes
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: user.id,
          classId: liveClass.classId,
          status: { in: ["PAID", "ACTIVE"] },
        },
      });

      if (!enrollment) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (profile.role === "TUTOR") {
      // Tutors can only access their own classes
      if (liveClass.class.tutorId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    // Admins can access all

    return NextResponse.json({
      id: liveClass.id,
      classId: liveClass.classId,
      className: liveClass.class.name,
      tutorName: liveClass.class.tutor.user.name,
      title: liveClass.title,
      meetingUrl: liveClass.meetingUrl,
      scheduledAt: liveClass.scheduledAt,
      duration: liveClass.duration,
      createdAt: liveClass.createdAt,
      updatedAt: liveClass.updatedAt,
    });
  } catch (error: any) {
    console.error("Get live class error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!profile || (profile.role !== "TUTOR" && profile.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch existing live class
    const existingLiveClass = await prisma.liveClass.findUnique({
      where: { id: params.id },
      include: {
        class: {
          select: {
            tutorId: true,
            name: true,
          },
        },
      },
    });

    if (!existingLiveClass) {
      return NextResponse.json(
        { error: "Live class not found" },
        { status: 404 }
      );
    }

    // Tutors can only update their own classes
    if (
      profile.role === "TUTOR" &&
      existingLiveClass.class.tutorId !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const data = updateLiveClassSchema.parse(body);

    // Build update data
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.meetingUrl !== undefined) updateData.meetingUrl = data.meetingUrl;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.scheduledAt !== undefined)
      updateData.scheduledAt = new Date(data.scheduledAt);

    // Update live class
    const liveClass = await prisma.liveClass.update({
      where: { id: params.id },
      data: updateData,
      include: {
        class: {
          select: {
            name: true,
          },
        },
      },
    });

    // If schedule changed, notify enrolled students
    if (
      data.scheduledAt &&
      data.scheduledAt !== existingLiveClass.scheduledAt.toISOString()
    ) {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          classId: existingLiveClass.classId,
          status: { in: ["PAID", "ACTIVE"] },
        },
        select: { studentId: true },
      });

      if (enrollments.length > 0) {
        await prisma.notification.createMany({
          data: enrollments.map((enrollment) => ({
            userId: enrollment.studentId,
            title: "Live Class Rescheduled",
            message: `The live class "${liveClass.title}" has been rescheduled for ${existingLiveClass.class.name}`,
            type: "LIVE_CLASS",
          })),
        });
      }
    }

    return NextResponse.json(liveClass);
  } catch (error: any) {
    console.error("Update live class error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!profile || (profile.role !== "TUTOR" && profile.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch existing live class
    const existingLiveClass = await prisma.liveClass.findUnique({
      where: { id: params.id },
      include: {
        class: {
          select: {
            tutorId: true,
            name: true,
          },
        },
      },
    });

    if (!existingLiveClass) {
      return NextResponse.json(
        { error: "Live class not found" },
        { status: 404 }
      );
    }

    // Tutors can only delete their own classes
    if (
      profile.role === "TUTOR" &&
      existingLiveClass.class.tutorId !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete live class
    await prisma.liveClass.delete({
      where: { id: params.id },
    });

    // Notify enrolled students about cancellation
    const enrollments = await prisma.enrollment.findMany({
      where: {
        classId: existingLiveClass.classId,
        status: { in: ["PAID", "ACTIVE"] },
      },
      select: { studentId: true },
    });

    if (enrollments.length > 0) {
      await prisma.notification.createMany({
        data: enrollments.map((enrollment) => ({
          userId: enrollment.studentId,
          title: "Live Class Cancelled",
          message: `The live class "${existingLiveClass.title}" has been cancelled for ${existingLiveClass.class.name}`,
          type: "LIVE_CLASS",
        })),
      });
    }

    return NextResponse.json({ message: "Live class deleted successfully" });
  } catch (error: any) {
    console.error("Delete live class error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
