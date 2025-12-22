/**
 * Student Assignment Detail API
 * GET /api/student/assignments/[id] - Get single assignment with submission
 * Updated to use section-based system
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const assignmentId = params.id;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!studentProfile) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Get assignment with section and submission
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
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
            enrollments: {
              where: {
                studentId: studentProfile.id,
                status: { in: ["ACTIVE", "EXPIRED"] },
              },
              select: { id: true },
            },
          },
        },
        submissions: {
          where: { studentId: studentProfile.id },
          select: {
            id: true,
            fileUrl: true,
            status: true,
            score: true,
            feedback: true,
            submittedAt: true,
            gradedAt: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check enrollment
    if (assignment.section.enrollments.length === 0) {
      return NextResponse.json(
        { error: "You are not enrolled in this section" },
        { status: 403 }
      );
    }

    const submission = assignment.submissions[0] || null;
    const now = new Date();
    const isPastDue = new Date(assignment.dueDate) < now;

    // Determine effective status
    let effectiveStatus: string;
    if (submission) {
      effectiveStatus = submission.status;
    } else if (isPastDue) {
      effectiveStatus = "OVERDUE";
    } else {
      effectiveStatus = "PENDING";
    }

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        instructions: assignment.instructions,
        dueDate: assignment.dueDate.toISOString(),
        maxPoints: assignment.maxPoints,
        attachmentUrl: assignment.attachmentUrl,
        createdAt: assignment.createdAt.toISOString(),
        // Client compatibility
        class: {
          id: assignment.section.id,
          name: `${assignment.section.template.name} - Section ${assignment.section.sectionLabel}`,
          subject: assignment.section.template.subject,
        },
        isPastDue,
        effectiveStatus,
      },
      submission: submission
        ? {
            id: submission.id,
            fileUrl: submission.fileUrl,
            status: submission.status,
            score: submission.score,
            feedback: submission.feedback,
            submittedAt: submission.submittedAt.toISOString(),
            gradedAt: submission.gradedAt?.toISOString() || null,
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/student/assignments/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment" },
      { status: 500 }
    );
  }
}
