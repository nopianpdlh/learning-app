import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/tutor/forum/discussions
 * Fetch all forum discussions from tutor's sections with aggregated stats
 * Uses section-based system
 */
export async function GET(req: NextRequest) {
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

    // Get user from database with sections
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        tutorProfile: {
          include: {
            sections: {
              select: {
                id: true,
                sectionLabel: true,
                template: { select: { name: true, subject: true } },
              },
            },
          },
        },
      },
    });

    if (!dbUser || dbUser.role !== "TUTOR" || !dbUser.tutorProfile) {
      return NextResponse.json(
        { error: "Forbidden: Tutor only" },
        { status: 403 }
      );
    }

    const tutorSections = dbUser.tutorProfile.sections;

    if (tutorSections.length === 0) {
      return NextResponse.json({
        discussions: [],
        stats: {
          total: 0,
          unanswered: 0,
          totalReplies: 0,
        },
        classes: [],
      });
    }

    const sectionIds = tutorSections.map((s) => s.id);

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const sectionFilter =
      searchParams.get("classId") || searchParams.get("sectionId");
    const statusFilter = searchParams.get("status"); // 'all' | 'unanswered' | 'answered'

    // Build where clause for threads
    const where: any = {
      sectionId: sectionFilter || { in: sectionIds },
    };

    // Fetch all threads from tutor's sections
    const threads = await db.forumThread.findMany({
      where,
      include: {
        section: {
          select: {
            sectionLabel: true,
            template: { select: { name: true, subject: true } },
          },
        },
        posts: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: [
        { isPinned: "desc" }, // Pinned first
        { updatedAt: "desc" }, // Then by recent activity
      ],
    });

    // Get author info for thread authors
    const threadAuthorIds = [...new Set(threads.map((t) => t.authorId))];
    const threadAuthors = await db.user.findMany({
      where: { id: { in: threadAuthorIds } },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    });

    const authorMap = new Map(threadAuthors.map((a) => [a.id, a]));

    // Transform threads into discussions format
    const discussions = threads.map((thread) => {
      const firstPost = thread.posts[0];
      const author = authorMap.get(thread.authorId);
      const hasTutorReply = thread.posts.some(
        (post) => post.authorId === user.id
      );
      const replyCount = thread.posts.length - 1; // Exclude first post (the thread itself)

      return {
        id: thread.id,
        title: thread.title,
        content: firstPost?.content || "",
        authorName: author?.name || "Unknown",
        authorAvatar: author?.avatar || null,
        authorId: thread.authorId,
        className: `${thread.section.template.name} - ${thread.section.sectionLabel}`,
        classId: thread.sectionId,
        subject: thread.section.template.subject,
        replyCount,
        hasTutorReply,
        isPinned: thread.isPinned,
        createdAt: thread.createdAt.toISOString(),
        updatedAt: thread.updatedAt.toISOString(),
        posts: thread.posts.map((post) => ({
          id: post.id,
          content: post.content,
          authorId: post.authorId,
          authorName: post.author.name,
          authorAvatar: post.author.avatar,
          parentId: post.parentId,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        })),
      };
    });

    // Apply status filter
    let filteredDiscussions = discussions;
    if (statusFilter === "unanswered") {
      filteredDiscussions = discussions.filter((d) => !d.hasTutorReply);
    } else if (statusFilter === "answered") {
      filteredDiscussions = discussions.filter((d) => d.hasTutorReply);
    }

    // Calculate statistics
    const stats = {
      total: discussions.length,
      unanswered: discussions.filter((d) => !d.hasTutorReply).length,
      totalReplies: discussions.reduce((acc, d) => acc + d.replyCount, 0),
    };

    // Transform sections for client compatibility
    const classes = tutorSections.map((s) => ({
      id: s.id,
      name: `${s.template.name} - ${s.sectionLabel}`,
      subject: s.template.subject,
    }));

    return NextResponse.json({
      discussions: filteredDiscussions,
      stats,
      classes,
    });
  } catch (error) {
    console.error("GET /api/tutor/forum/discussions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch discussions" },
      { status: 500 }
    );
  }
}
