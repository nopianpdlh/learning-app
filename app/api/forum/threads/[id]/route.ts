/**
 * Forum Thread API - Get, Update, Delete by ID
 * GET /api/forum/threads/[id] - Get thread with posts
 * PUT /api/forum/threads/[id] - Update thread (pin/unpin, edit title)
 * DELETE /api/forum/threads/[id] - Delete thread
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { updateThreadSchema } from "@/lib/validations/forum.schema";

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

    // Fetch thread with posts
    const thread = await prisma.forumThread.findUnique({
      where: { id: params.id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            tutorId: true,
          },
        },
        posts: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Verify access to class
    if (profile.role === "STUDENT") {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: user.id,
          classId: thread.classId,
          status: { in: ["PAID", "ACTIVE"] },
        },
      });

      if (!enrollment) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (profile.role === "TUTOR") {
      if (thread.class.tutorId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Get thread author name
    const threadAuthor = await prisma.user.findUnique({
      where: { id: thread.authorId },
      select: { id: true, name: true },
    });

    // Build reply tree structure (nested replies)
    const postsMap = new Map();
    const rootPosts: any[] = [];

    thread.posts.forEach((post) => {
      const postData = {
        id: post.id,
        threadId: post.threadId,
        authorId: post.author.id,
        authorName: post.author.name,
        content: post.content,
        parentId: post.parentId,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        replies: [],
      };

      postsMap.set(post.id, postData);

      if (!post.parentId) {
        rootPosts.push(postData);
      }
    });

    // Link replies to parent posts
    thread.posts.forEach((post) => {
      if (post.parentId && postsMap.has(post.parentId)) {
        const parent = postsMap.get(post.parentId);
        const child = postsMap.get(post.id);
        parent.replies.push(child);
      }
    });

    return NextResponse.json({
      id: thread.id,
      classId: thread.classId,
      className: thread.class.name,
      authorId: thread.authorId,
      authorName: threadAuthor?.name || "Unknown",
      title: thread.title,
      isPinned: thread.isPinned,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      posts: rootPosts,
      totalPosts: thread.posts.length,
    });
  } catch (error: any) {
    console.error("Get forum thread error:", error);
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

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Fetch existing thread
    const existingThread = await prisma.forumThread.findUnique({
      where: { id: params.id },
      include: {
        class: {
          select: {
            tutorId: true,
          },
        },
      },
    });

    if (!existingThread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const data = updateThreadSchema.parse(body);

    // Permission checks
    // - Thread author can update title
    // - Tutor/Admin can update title and pin/unpin
    const isAuthor = existingThread.authorId === user.id;
    const isTutor =
      profile.role === "TUTOR" && existingThread.class.tutorId === user.id;
    const isAdmin = profile.role === "ADMIN";

    if (!isAuthor && !isTutor && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Pinning requires tutor/admin permission
    if (data.isPinned !== undefined && !isTutor && !isAdmin) {
      return NextResponse.json(
        { error: "Only tutors and admins can pin threads" },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;

    // Update thread
    const thread = await prisma.forumThread.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(thread);
  } catch (error: any) {
    console.error("Update forum thread error:", error);

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

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Fetch existing thread
    const existingThread = await prisma.forumThread.findUnique({
      where: { id: params.id },
      include: {
        class: {
          select: {
            tutorId: true,
          },
        },
      },
    });

    if (!existingThread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Permission checks
    // - Thread author can delete
    // - Tutor/Admin can delete
    const isAuthor = existingThread.authorId === user.id;
    const isTutor =
      profile.role === "TUTOR" && existingThread.class.tutorId === user.id;
    const isAdmin = profile.role === "ADMIN";

    if (!isAuthor && !isTutor && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete thread (cascades to posts)
    await prisma.forumThread.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Thread deleted successfully" });
  } catch (error: any) {
    console.error("Delete forum thread error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
