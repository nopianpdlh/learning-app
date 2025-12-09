/**
 * Student Assignments API
 * GET /api/student/assignments - Fetch all assignments from enrolled classes
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      include: {
        enrollments: {
          where: {
            status: { in: ["ACTIVE", "PAID"] },
          },
          select: {
            classId: true,
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
    });

    if (!studentProfile) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    const enrolledClassIds = studentProfile.enrollments.map((e) => e.classId);

    if (enrolledClassIds.length === 0) {
      return NextResponse.json({
        assignments: [],
        stats: {
          total: 0,
          pending: 0,
          submitted: 0,
          graded: 0,
          late: 0,
        },
      });
    }

    // Fetch all PUBLISHED assignments from enrolled classes
    const assignments = await prisma.assignment.findMany({
      where: {
        classId: { in: enrolledClassIds },
        status: "PUBLISHED",
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
        submissions: {
          where: {
            studentId: studentProfile.id,
          },
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
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });

    // Process assignments with computed status
    const now = new Date();
    const processedAssignments = assignments.map((assignment) => {
      const submission = assignment.submissions[0] || null;
      const isPastDue = new Date(assignment.dueDate) < now;

      // Determine effective status for UI
      let effectiveStatus: string;
      if (submission) {
        effectiveStatus = submission.status; // SUBMITTED, GRADED, LATE
      } else if (isPastDue) {
        effectiveStatus = "OVERDUE"; // Past due but not submitted
      } else {
        effectiveStatus = "PENDING"; // Not yet due, not submitted
      }

      return {
        id: assignment.id,
        title: assignment.title,
        instructions: assignment.instructions,
        dueDate: assignment.dueDate.toISOString(),
        maxPoints: assignment.maxPoints,
        attachmentUrl: assignment.attachmentUrl,
        createdAt: assignment.createdAt.toISOString(),
        class: assignment.class,
        isPastDue,
        effectiveStatus,
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
      };
    });

    // Calculate stats
    const stats = {
      total: processedAssignments.length,
      pending: processedAssignments.filter(
        (a) => a.effectiveStatus === "PENDING"
      ).length,
      submitted: processedAssignments.filter(
        (a) => a.effectiveStatus === "SUBMITTED"
      ).length,
      graded: processedAssignments.filter((a) => a.effectiveStatus === "GRADED")
        .length,
      late: processedAssignments.filter(
        (a) => a.effectiveStatus === "LATE" || a.effectiveStatus === "OVERDUE"
      ).length,
    };

    return NextResponse.json({
      assignments: processedAssignments,
      stats,
    });
  } catch (error) {
    console.error("GET /api/student/assignments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}
