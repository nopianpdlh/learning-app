import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

// POST - Join waiting list for a program
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student profile
    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!studentProfile) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { templateId } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Check if program exists and is published
    const program = await db.classTemplate.findUnique({
      where: { id: templateId, published: true },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Check if already in waiting list
    const existingEntry = await db.waitingList.findUnique({
      where: {
        studentId_templateId: {
          studentId: studentProfile.id,
          templateId,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: "Kamu sudah terdaftar di waiting list program ini" },
        { status: 400 }
      );
    }

    // Check if already enrolled in this program
    const existingEnrollment = await db.enrollment.findFirst({
      where: {
        studentId: studentProfile.id,
        section: { templateId },
        status: { in: ["ACTIVE", "PENDING", "EXPIRED"] },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Kamu sudah terdaftar di program ini" },
        { status: 400 }
      );
    }

    // Create waiting list entry
    const waitingEntry = await db.waitingList.create({
      data: {
        studentId: studentProfile.id,
        templateId,
        status: "PENDING",
      },
      include: {
        template: { select: { name: true } },
      },
    });

    // Create notification for admins (optional - notify that there's a new waiting list entry)
    // This could be enhanced to notify specific admins

    return NextResponse.json({
      success: true,
      message: "Berhasil mendaftar ke waiting list",
      waitingEntry: {
        id: waitingEntry.id,
        programName: waitingEntry.template.name,
        status: waitingEntry.status,
      },
    });
  } catch (error) {
    console.error("Error joining waiting list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get student's waiting list entries
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!studentProfile) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    const waitingEntries = await db.waitingList.findMany({
      where: { studentId: studentProfile.id },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            subject: true,
            pricePerMonth: true,
            thumbnail: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      waitingList: waitingEntries.map((entry) => ({
        id: entry.id,
        status: entry.status,
        requestedAt: entry.requestedAt.toISOString(),
        approvedAt: entry.approvedAt?.toISOString() || null,
        rejectedAt: entry.rejectedAt?.toISOString() || null,
        rejectionNote: entry.rejectionNote,
        program: entry.template,
      })),
    });
  } catch (error) {
    console.error("Error fetching waiting list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
