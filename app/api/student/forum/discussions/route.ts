/**
 * Student Forum Discussions API
 * GET /api/student/forum/discussions - Get all discussions for enrolled sections
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student profile with enrollments
    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: user.id },
      include: {
        enrollments: {
          where: {
            status: { in: ["ACTIVE", "EXPIRED"] },
          },
          select: {
            sectionId: true,
          },
        },
      },
    });

    if (!studentProfile) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    const enrolledSectionIds = studentProfile.enrollments.map(
      (e) => e.sectionId
    );

    if (enrolledSectionIds.length === 0) {
      return NextResponse.json({
        discussions: [],
        stats: {
          total: 0,
          answeredByTutor: 0,
          myDiscussions: 0,
        },
      });
    }

    // Get all forum threads for enrolled sections
    const threads = await db.forumThread.findMany({
      where: {
        sectionId: { in: enrolledSectionIds },
      },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
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
          },
        },
        posts: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Get author info for thread authors
    const threadAuthorIds = [...new Set(threads.map((t) => t.authorId))];
    const threadAuthors = await db.user.findMany({
      where: { id: { in: threadAuthorIds } },
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
      },
    });

    const authorMap = new Map(threadAuthors.map((a) => [a.id, a]));

    // Transform to client format
    const discussions = threads.map((thread) => {
      const firstPost = thread.posts[0];
      const author = authorMap.get(thread.authorId);
      const hasTutorReply = thread.posts.some(
        (post) => post.author.role === "TUTOR" && post.id !== firstPost?.id
      );

      return {
        id: thread.id,
        title: thread.title,
        content: firstPost?.content || "",
        authorId: thread.authorId,
        authorName: author?.name || "Unknown",
        authorAvatar: author?.avatar || null,
        className: `${thread.section.template.name} - Section ${thread.section.sectionLabel}`,
        classId: thread.section.id,
        subject: thread.section.template.subject,
        replyCount: thread.posts.length - 1,
        hasTutorReply,
        isPinned: thread.isPinned,
        createdAt: thread.createdAt.toISOString(),
        updatedAt: thread.updatedAt.toISOString(),
        posts: thread.posts.map((post) => ({
          id: post.id,
          content: post.content,
          authorId: post.author.id,
          authorName: post.author.name,
          authorAvatar: post.author.avatar,
          authorRole: post.author.role,
          parentId: post.parentId,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        })),
      };
    });

    // Calculate stats
    const stats = {
      total: discussions.length,
      answeredByTutor: discussions.filter((d) => d.hasTutorReply).length,
      myDiscussions: discussions.filter((d) => d.authorId === user.id).length,
    };

    return NextResponse.json({
      discussions,
      stats,
    });
  } catch (error) {
    console.error("GET /api/student/forum/discussions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch discussions" },
      { status: 500 }
    );
  }
}
