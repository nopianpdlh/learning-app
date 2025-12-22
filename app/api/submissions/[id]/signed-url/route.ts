/**
 * Submission Signed URL API
 * POST /api/submissions/[id]/signed-url - Generate signed URL for submission file
 * Updated to use section-based system
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const submissionId = params.id;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get submission with student profile check - using section instead of class
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          select: {
            userId: true,
          },
        },
        assignment: {
          include: {
            section: {
              select: {
                tutorId: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Check if user is the student who submitted OR tutor of the section
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        studentProfile: { select: { id: true } },
        tutorProfile: { select: { id: true } },
      },
    });

    const isStudent = submission.student.userId === user.id;
    const isTutor =
      dbUser?.tutorProfile?.id === submission.assignment.section.tutorId;
    const isAdmin = dbUser?.role === "ADMIN";

    if (!isStudent && !isTutor && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!submission.fileUrl) {
      return NextResponse.json({ error: "No file available" }, { status: 400 });
    }

    // If fileUrl is already a full URL, return as-is
    if (submission.fileUrl.startsWith("http")) {
      return NextResponse.json({
        success: true,
        url: submission.fileUrl,
      });
    }

    // Generate signed URL from Supabase Storage
    const { data, error } = await supabase.storage
      .from("submissions")
      .createSignedUrl(submission.fileUrl, 3600); // 1 hour expiry

    if (error || !data) {
      console.error("Signed URL error:", error);
      return NextResponse.json(
        { error: "Failed to generate signed URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: data.signedUrl,
    });
  } catch (error) {
    console.error("POST /api/submissions/[id]/signed-url error:", error);
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 500 }
    );
  }
}
