/**
 * Forum Threads API - List and Create
 * GET /api/forum/threads - List forum threads
 * POST /api/forum/threads - Create new thread
 * Updated to use section-based system
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import {
  createThreadSchema,
  forumFilterSchema,
} from "@/lib/validations/forum.schema";

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
    const filters = forumFilterSchema.parse({
      classId: sectionId,
      sort: searchParams.get("sort") || "recent",
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

    if (!filters.classId) {
      return NextResponse.json(
        { error: "sectionId is required" },
        { status: 400 }
      );
    }

    // Verify access to section
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

      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: studentProfile.id,
          sectionId: filters.classId,
          status: { in: ["ACTIVE", "EXPIRED"] },
        },
      });

      if (!enrollment) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (profile.role === "TUTOR") {
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: user.id },
      });

      if (!tutorProfile) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const sectionData = await prisma.classSection.findFirst({
        where: {
          id: filters.classId,
          tutorId: tutorProfile.id,
        },
      });

      if (!sectionData) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const page = parseInt(filters.page);
    const limit = Math.min(parseInt(filters.limit), 100);
    const skip = (page - 1) * limit;

    // Build orderBy based on sort
    let orderBy: any = {};
    if (filters.sort === "recent") {
      orderBy = { updatedAt: "desc" };
    } else if (filters.sort === "oldest") {
      orderBy = { createdAt: "asc" };
    }

    // Fetch threads
    const [threads, total] = await Promise.all([
      prisma.forumThread.findMany({
        where: { sectionId: filters.classId },
        include: {
          posts: {
            select: {
              id: true,
            },
          },
        },
        orderBy:
          filters.sort !== "mostReplies" ? orderBy : { createdAt: "desc" },
        skip: filters.sort !== "mostReplies" ? skip : undefined,
        take: filters.sort !== "mostReplies" ? limit : undefined,
      }),
      prisma.forumThread.count({ where: { sectionId: filters.classId } }),
    ]);

    // Fetch author details for all threads
    const authorIds = threads.map((t) => t.authorId);
    const authors = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, name: true },
    });

    // For mostReplies sort, calculate reply counts and sort
    let sortedThreads = threads;
    if (filters.sort === "mostReplies") {
      sortedThreads = threads
        .map((thread) => ({
          ...thread,
          replyCount: thread.posts.length,
        }))
        .sort((a, b) => b.replyCount - a.replyCount)
        .slice(skip, skip + limit);
    }

    // Create author map for quick lookup
    const authorMap = new Map(authors.map((a) => [a.id, a.name]));

    return NextResponse.json({
      threads: sortedThreads.map((thread) => ({
        id: thread.id,
        classId: thread.sectionId, // Client compatibility
        sectionId: thread.sectionId,
        authorId: thread.authorId,
        authorName: authorMap.get(thread.authorId) || "Unknown",
        title: thread.title,
        isPinned: thread.isPinned,
        replyCount: thread.posts.length,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Get forum threads error:", error);

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
      select: { role: true, name: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body - support both classId and sectionId
    const body = await request.json();
    const sectionId = body.sectionId || body.classId;
    const data = createThreadSchema.parse({ ...body, classId: sectionId });

    // Verify access to section
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

      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: studentProfile.id,
          sectionId: data.classId,
          status: { in: ["ACTIVE", "EXPIRED"] },
        },
      });

      if (!enrollment) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (profile.role === "TUTOR") {
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: user.id },
      });

      if (!tutorProfile) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const sectionData = await prisma.classSection.findFirst({
        where: {
          id: data.classId,
          tutorId: tutorProfile.id,
        },
      });

      if (!sectionData) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Get section info for notification
    const sectionData = await prisma.classSection.findUnique({
      where: { id: data.classId },
      include: {
        template: {
          select: { name: true },
        },
      },
    });

    // Create thread
    const thread = await prisma.forumThread.create({
      data: {
        sectionId: data.classId,
        authorId: user.id,
        title: data.title,
      },
    });

    // Create notifications for class members (exclude author)
    const enrollments = await prisma.enrollment.findMany({
      where: {
        sectionId: data.classId,
        status: { in: ["ACTIVE"] },
      },
      include: {
        student: {
          select: { userId: true },
        },
      },
    });

    // Filter out the thread author
    const otherStudents = enrollments.filter(
      (e) => e.student.userId !== user.id
    );

    if (otherStudents.length > 0) {
      await prisma.notification.createMany({
        data: otherStudents.map((enrollment) => ({
          userId: enrollment.student.userId,
          title: "New Forum Thread",
          message: `"${data.title}" thread created in ${
            sectionData?.template.name || "your class"
          }`,
          type: "FORUM",
        })),
      });
    }

    return NextResponse.json(
      {
        id: thread.id,
        classId: thread.sectionId,
        sectionId: thread.sectionId,
        authorId: thread.authorId,
        authorName: profile.name,
        title: thread.title,
        isPinned: thread.isPinned,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create forum thread error:", error);

    if (error.name === "ZodError") {
      // Get the first error message for a user-friendly response
      const firstError = error.errors[0];
      let errorMessage = "Validasi gagal";

      if (firstError) {
        const field = firstError.path.join(".");
        const fieldNames: Record<string, string> = {
          title: "Judul",
          content: "Isi diskusi",
          classId: "Kelas",
        };
        const fieldName = fieldNames[field] || field;

        if (firstError.code === "too_small") {
          errorMessage = `${fieldName} minimal ${firstError.minimum} karakter`;
        } else if (firstError.code === "too_big") {
          errorMessage = `${fieldName} maksimal ${firstError.maximum} karakter`;
        } else {
          errorMessage = `${fieldName}: ${firstError.message}`;
        }
      }

      return NextResponse.json(
        { error: errorMessage, details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
