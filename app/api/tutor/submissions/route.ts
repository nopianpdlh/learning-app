import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/tutor/submissions
 * Get all submissions for tutor's sections with optional filters
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
            sections: { select: { id: true } },
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

    const sectionIds = dbUser.tutorProfile.sections.map((s) => s.id);

    if (sectionIds.length === 0) {
      return NextResponse.json({
        submissions: [],
        stats: { total: 0, pending: 0, graded: 0, avgScore: 0 },
      });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // 'pending', 'graded', 'all'
    const sectionId =
      searchParams.get("classId") || searchParams.get("sectionId");
    const assignmentId = searchParams.get("assignmentId");

    // Build where clause
    const where: any = {
      assignment: {
        sectionId: sectionId || { in: sectionIds },
      },
    };

    // Add status filter
    if (status && status !== "all") {
      if (status === "pending") {
        where.status = "SUBMITTED";
      } else if (status === "graded") {
        where.status = "GRADED";
      }
    }

    // Add assignment filter
    if (assignmentId) {
      where.assignmentId = assignmentId;
    }

    // Fetch submissions
    const submissions = await db.assignmentSubmission.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        assignment: {
          select: {
            id: true,
            title: true,
            maxPoints: true,
            dueDate: true,
            section: {
              select: {
                id: true,
                sectionLabel: true,
                template: { select: { name: true, subject: true } },
              },
            },
          },
        },
      },
      orderBy: [
        { status: "asc" }, // SUBMITTED first
        { submittedAt: "desc" }, // Then by submission date
      ],
    });

    // Transform to include class compatibility
    const transformedSubmissions = submissions.map((s) => ({
      ...s,
      assignment: {
        ...s.assignment,
        class: {
          id: s.assignment.section.id,
          name: `${s.assignment.section.template.name} - ${s.assignment.section.sectionLabel}`,
          subject: s.assignment.section.template.subject,
        },
      },
    }));

    // Calculate statistics
    const stats = {
      total: submissions.length,
      pending: submissions.filter((s) => s.status === "SUBMITTED").length,
      graded: submissions.filter((s) => s.status === "GRADED").length,
      avgScore:
        submissions.filter((s) => s.score !== null).length > 0
          ? Math.round(
              submissions
                .filter((s) => s.score !== null)
                .reduce((acc, s) => acc + (s.score || 0), 0) /
                submissions.filter((s) => s.score !== null).length
            )
          : 0,
    };

    return NextResponse.json({
      submissions: transformedSubmissions,
      stats,
    });
  } catch (error) {
    console.error("GET /api/tutor/submissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
