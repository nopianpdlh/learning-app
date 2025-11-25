/**
 * Forum Posts API - Create Post/Reply
 * POST /api/forum/posts - Create new post or reply
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { createPostSchema } from "@/lib/validations/forum.schema";
import { sendForumActivityNotification } from "@/lib/email";

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

    // Parse and validate request body
    const body = await request.json();
    const data = createPostSchema.parse(body);

    // Verify thread exists and get class info
    const thread = await prisma.forumThread.findUnique({
      where: { id: data.threadId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            tutorId: true,
          },
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
      // Get tutor profile to compare with class tutorId
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: user.id },
      });

      if (!tutorProfile || thread.class.tutorId !== tutorProfile.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // If parentId provided, verify parent post exists and belongs to same thread
    if (data.parentId) {
      const parentPost = await prisma.forumPost.findUnique({
        where: { id: data.parentId },
      });

      if (!parentPost) {
        return NextResponse.json(
          { error: "Parent post not found" },
          { status: 404 }
        );
      }

      if (parentPost.threadId !== data.threadId) {
        return NextResponse.json(
          { error: "Parent post does not belong to this thread" },
          { status: 400 }
        );
      }
    }

    // Create post (authorId is userId directly per schema)
    const post = await prisma.forumPost.create({
      data: {
        threadId: data.threadId,
        authorId: user.id,
        content: data.content,
        parentId: data.parentId,
      },
    });

    // Update thread's updatedAt timestamp
    await prisma.forumThread.update({
      where: { id: data.threadId },
      data: { updatedAt: new Date() },
    });

    // Create notification for thread author (if not replying to own thread)
    if (thread.authorId !== user.id) {
      // Get thread author details
      const threadAuthor = await prisma.user.findUnique({
        where: { id: thread.authorId },
        select: { email: true, name: true },
      });

      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: thread.authorId,
          title: "New Reply in Thread",
          message: `New reply in "${thread.title}" from ${thread.class.name}`,
          type: "FORUM",
        },
      });

      // Send email notification
      if (threadAuthor) {
        const contentPreview =
          data.content.length > 200
            ? data.content.substring(0, 200) + "..."
            : data.content;

        sendForumActivityNotification({
          to: threadAuthor.email,
          recipientName: threadAuthor.name,
          activityType: "new_reply",
          threadTitle: thread.title,
          authorName: profile.name,
          className: thread.class.name,
          contentPreview,
          threadUrl: `${process.env.NEXT_PUBLIC_APP_URL}/student/classes/${thread.classId}/forum/${thread.id}`,
        }).catch((err) => {
          console.error("Failed to send forum email notification:", err);
        });
      }
    }

    // If replying to specific post, notify parent post author
    if (data.parentId) {
      const parentPost = await prisma.forumPost.findUnique({
        where: { id: data.parentId },
        select: { authorId: true },
      });

      if (
        parentPost &&
        parentPost.authorId !== user.id &&
        parentPost.authorId !== thread.authorId
      ) {
        // Get parent post author details
        const parentAuthor = await prisma.user.findUnique({
          where: { id: parentPost.authorId },
          select: { email: true, name: true },
        });

        // Create in-app notification
        await prisma.notification.create({
          data: {
            userId: parentPost.authorId,
            title: "Someone replied to your post",
            message: `New reply to your post in "${thread.title}"`,
            type: "FORUM",
          },
        });

        // Send email notification
        if (parentAuthor) {
          const contentPreview =
            data.content.length > 200
              ? data.content.substring(0, 200) + "..."
              : data.content;

          sendForumActivityNotification({
            to: parentAuthor.email,
            recipientName: parentAuthor.name,
            activityType: "new_reply",
            threadTitle: thread.title,
            authorName: profile.name,
            className: thread.class.name,
            contentPreview,
            threadUrl: `${process.env.NEXT_PUBLIC_APP_URL}/student/classes/${thread.classId}/forum/${thread.id}`,
          }).catch((err) => {
            console.error("Failed to send forum email notification:", err);
          });
        }
      }
    }

    return NextResponse.json(
      {
        id: post.id,
        threadId: post.threadId,
        authorId: post.authorId,
        authorName: profile.name,
        content: post.content,
        parentId: post.parentId,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create forum post error:", error);

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
