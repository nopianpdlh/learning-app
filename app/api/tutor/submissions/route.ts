import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/tutor/submissions
 * Get all submissions for tutor's classes with optional filters
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

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        tutorProfile: true,
      },
    });

    if (!dbUser || dbUser.role !== "TUTOR" || !dbUser.tutorProfile) {
      return NextResponse.json(
        { error: "Forbidden: Tutor only" },
        { status: 403 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // 'pending', 'graded', 'all'
    const classId = searchParams.get("classId");
    const assignmentId = searchParams.get("assignmentId");

    // Build where clause
    const where: any = {
      assignment: {
        class: {
          tutorId: dbUser.tutorProfile.id,
        },
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

    // Add class filter
    if (classId) {
      where.assignment = {
        ...where.assignment,
        classId,
      };
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
            class: {
              select: {
                id: true,
                name: true,
                subject: true,
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
      submissions,
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
