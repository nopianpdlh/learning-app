/**
 * Live Classes API - List and Create
 * GET /api/live-classes - List all scheduled meetings
 * POST /api/live-classes - Create new scheduled meeting
 * Updated to use ScheduledMeeting and section-based system
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

    // Parse query params - support both classId and sectionId
    const searchParams = request.nextUrl.searchParams;
    const sectionId =
      searchParams.get("classId") || searchParams.get("sectionId");
    const filters = liveClassFilterSchema.parse({
      classId: sectionId,
      upcoming: searchParams.get("upcoming"),
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

    const page = parseInt(filters.page);
    const limit = Math.min(parseInt(filters.limit), 100);
    const skip = (page - 1) * limit;

    // Build where clause based on role
    const where: any = {};

    // Filter by sectionId if provided
    if (filters.classId) {
      where.sectionId = filters.classId;
    }

    // Filter by upcoming
    if (filters.upcoming === "true") {
      where.scheduledAt = { gte: new Date() };
    }

    // Role-based filtering
    if (profile.role === "STUDENT") {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: user.id },
      });

      if (!studentProfile) {
        return NextResponse.json(
          { error: "Student profile not found" },
          { status: 404 }
        );
      }

      const enrollments = await prisma.enrollment.findMany({
        where: {
          studentId: studentProfile.id,
          status: { in: ["ACTIVE", "EXPIRED"] },
        },
        select: { sectionId: true },
      });

      const enrolledSectionIds = enrollments.map((e) => e.sectionId);

      if (filters.classId) {
        if (!enrolledSectionIds.includes(filters.classId)) {
          return NextResponse.json({
            liveClasses: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
          });
        }
      } else {
        where.sectionId = { in: enrolledSectionIds };
      }
    } else if (profile.role === "TUTOR") {
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: user.id },
      });

      if (tutorProfile) {
        const tutorSections = await prisma.classSection.findMany({
          where: { tutorId: tutorProfile.id },
          select: { id: true },
        });

        const tutorSectionIds = tutorSections.map((s) => s.id);
        where.sectionId = { in: tutorSectionIds };
      }
    }
    // Admins see all meetings (no filter)

    // Fetch scheduled meetings
    const [meetings, total] = await Promise.all([
      prisma.scheduledMeeting.findMany({
        where,
        include: {
          section: {
            select: {
              id: true,
              sectionLabel: true,
              template: {
                select: {
                  name: true,
                  subject: true,
                },
              },
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
      prisma.scheduledMeeting.count({ where }),
    ]);

    return NextResponse.json({
      liveClasses: meetings.map((m) => ({
        id: m.id,
        classId: m.sectionId,
        className: `${m.section.template.name} - Section ${m.section.sectionLabel}`,
        tutorName: m.section.tutor.user.name,
        title: m.title,
        description: m.description,
        meetingUrl: m.meetingUrl,
        scheduledAt: m.scheduledAt,
        duration: m.duration,
        status: m.status,
        createdAt: m.createdAt,
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
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        tutorProfile: true,
      },
    });

    if (!dbUser || (dbUser.role !== "TUTOR" && dbUser.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate request body - support both classId and sectionId
    const body = await request.json();
    const sectionId = body.sectionId || body.classId;
    const data = createLiveClassSchema.parse({ ...body, classId: sectionId });

    // Verify section exists
    const sectionData = await prisma.classSection.findUnique({
      where: { id: data.classId },
      include: {
        template: true,
      },
    });

    if (!sectionData) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Tutors can only create meetings for their own sections
    if (
      dbUser.role === "TUTOR" &&
      sectionData.tutorId !== dbUser.tutorProfile?.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create scheduled meeting
    const meeting = await prisma.scheduledMeeting.create({
      data: {
        sectionId: data.classId,
        createdBy: user.id,
        title: data.title,
        description: (data as any).description || null,
        meetingUrl: data.meetingUrl,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration,
        status: "SCHEDULED",
      },
      include: {
        section: {
          select: {
            sectionLabel: true,
            template: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Create notifications for enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: {
        sectionId: data.classId,
        status: { in: ["ACTIVE"] },
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (enrollments.length > 0) {
      await prisma.notification.createMany({
        data: enrollments.map((enrollment) => ({
          userId: enrollment.student.user.id,
          title: "New Live Class Scheduled",
          message: `Live class "${data.title}" has been scheduled for ${sectionData.template.name}`,
          type: "LIVE_CLASS",
        })),
      });
    }

    return NextResponse.json(
      {
        ...meeting,
        className: `${meeting.section.template.name} - Section ${meeting.section.sectionLabel}`,
      },
      { status: 201 }
    );
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
