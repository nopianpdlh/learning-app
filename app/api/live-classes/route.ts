/**
 * Live Classes API - List and Create
 * GET /api/live-classes - List all live classes
 * POST /api/live-classes - Create new live class
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import {
  createLiveClassSchema,
  liveClassFilterSchema,
} from "@/lib/validations/liveclass.schema";

export async function GET(request: NextRequest) {
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

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const filters = liveClassFilterSchema.parse({
      classId: searchParams.get("classId"),
      upcoming: searchParams.get("upcoming"),
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

    const page = parseInt(filters.page);
    const limit = Math.min(parseInt(filters.limit), 100);
    const skip = (page - 1) * limit;

    // Build where clause based on role
    const where: any = {};

    // Filter by classId if provided
    if (filters.classId) {
      where.classId = filters.classId;
    }

    // Filter by upcoming
    if (filters.upcoming === "true") {
      where.scheduledAt = { gte: new Date() };
    }

    // Role-based filtering
    if (profile.role === "STUDENT") {
      // Students see only live classes from enrolled classes
      const enrollments = await prisma.enrollment.findMany({
        where: {
          studentId: user.id,
          status: { in: ["PAID", "ACTIVE"] },
        },
        select: { classId: true },
      });

      const enrolledClassIds = enrollments.map((e) => e.classId);
      where.classId = { in: enrolledClassIds };
    } else if (profile.role === "TUTOR") {
      // Tutors see only live classes from their classes
      const tutorClasses = await prisma.class.findMany({
        where: { tutorId: user.id },
        select: { id: true },
      });

      const tutorClassIds = tutorClasses.map((c) => c.id);
      where.classId = { in: tutorClassIds };
    }
    // Admins see all live classes (no filter)

    // Fetch live classes
    const [liveClasses, total] = await Promise.all([
      prisma.liveClass.findMany({
        where,
        include: {
          class: {
            select: {
              id: true,
              name: true,
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
        orderBy: { scheduledAt: "asc" },
        skip,
        take: limit,
      }),
      prisma.liveClass.count({ where }),
    ]);

    return NextResponse.json({
      liveClasses: liveClasses.map((lc) => ({
        id: lc.id,
        classId: lc.classId,
        className: lc.class.name,
        tutorName: lc.class.tutor.user.name,
        title: lc.title,
        meetingUrl: lc.meetingUrl,
        scheduledAt: lc.scheduledAt,
        duration: lc.duration,
        createdAt: lc.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Get live classes error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const data = createLiveClassSchema.parse(body);

    // Verify class exists
    const classData = await prisma.class.findUnique({
      where: { id: data.classId },
      select: {
        id: true,
        name: true,
        tutorId: true,
      },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Tutors can only create live classes for their own classes
    if (profile.role === "TUTOR" && classData.tutorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create live class
    const liveClass = await prisma.liveClass.create({
      data: {
        classId: data.classId,
        title: data.title,
        meetingUrl: data.meetingUrl,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration,
      },
      include: {
        class: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create notifications for enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: {
        classId: data.classId,
        status: { in: ["PAID", "ACTIVE"] },
      },
      select: { studentId: true },
    });

    if (enrollments.length > 0) {
      await prisma.notification.createMany({
        data: enrollments.map((enrollment) => ({
          userId: enrollment.studentId,
          title: "New Live Class Scheduled",
          message: `Live class "${data.title}" has been scheduled for ${classData.name}`,
          type: "LIVE_CLASS",
        })),
      });
    }

    return NextResponse.json(liveClass, { status: 201 });
  } catch (error: any) {
    console.error("Create live class error:", error);

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
