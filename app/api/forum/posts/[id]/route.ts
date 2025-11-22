/**
 * Forum Post API - Update and Delete by ID
 * PUT /api/forum/posts/[id] - Update post content
 * DELETE /api/forum/posts/[id] - Delete post
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { updatePostSchema } from "@/lib/validations/forum.schema";

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

    // Fetch existing post
    const existingPost = await prisma.forumPost.findUnique({
      where: { id: params.id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Only post author can edit (not even tutor/admin)
    if (existingPost.authorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const data = updatePostSchema.parse(body);

    // Update post
    const post = await prisma.forumPost.update({
      where: { id: params.id },
      data: {
        content: data.content,
      },
    });

    return NextResponse.json(post);
  } catch (error: any) {
    console.error("Update forum post error:", error);

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

    // Fetch existing post with thread info
    const existingPost = await prisma.forumPost.findUnique({
      where: { id: params.id },
      include: {
        thread: {
          include: {
            class: {
              select: {
                tutorId: true,
              },
            },
          },
        },
      },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Permission checks
    // - Post author can delete
    // - Tutor/Admin can delete
    const isAuthor = existingPost.authorId === user.id;
    const isTutor =
      profile.role === "TUTOR" && existingPost.thread.class.tutorId === user.id;
    const isAdmin = profile.role === "ADMIN";

    if (!isAuthor && !isTutor && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete post (cascades to child replies)
    await prisma.forumPost.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error: any) {
    console.error("Delete forum post error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
