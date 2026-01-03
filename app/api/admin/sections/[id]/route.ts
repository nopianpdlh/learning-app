import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Get single section
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const section = await prisma.classSection.findUnique({
      where: { id },
      include: {
        template: true,
        tutor: {
          include: {
            user: true,
          },
        },
        enrollments: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
        meetings: true,
      },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error("Failed to fetch section:", error);
    return NextResponse.json(
      { error: "Failed to fetch section" },
      { status: 500 }
    );
  }
}

// PATCH - Update section (expanded fields)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Build update data object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (body.sectionLabel !== undefined) {
      // Check for duplicate label in same template
      const existing = await prisma.classSection.findFirst({
        where: {
          id: { not: id },
          templateId: body.templateId,
          sectionLabel: body.sectionLabel,
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Section ${body.sectionLabel} sudah ada di program ini` },
          { status: 400 }
        );
      }
      updateData.sectionLabel = body.sectionLabel;
    }

    if (body.tutorId !== undefined) {
      updateData.tutorId = body.tutorId;
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    if (body.templateId !== undefined) {
      // Moving section to different template - check enrollments
      const section = await prisma.classSection.findUnique({
        where: { id },
        include: { _count: { select: { enrollments: true } } },
      });

      if (section && section._count.enrollments > 0) {
        return NextResponse.json(
          { error: "Tidak dapat pindahkan section yang memiliki siswa aktif" },
          { status: 400 }
        );
      }
      updateData.templateId = body.templateId;
    }

    const section = await prisma.classSection.update({
      where: { id },
      data: updateData,
      include: {
        template: true,
        tutor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    return NextResponse.json(section);
  } catch (error) {
    console.error("Failed to update section:", error);
    return NextResponse.json(
      { error: "Failed to update section" },
      { status: 500 }
    );
  }
}

// DELETE - Delete section (with force option)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    // Get section with counts
    const section = await prisma.classSection.findUnique({
      where: { id },
      include: {
        template: { select: { name: true } },
        _count: {
          select: {
            enrollments: true,
            meetings: true,
            materials: true,
            assignments: true,
            quizzes: true,
            liveClasses: true,
            forumThreads: true,
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const hasData =
      section._count.enrollments > 0 ||
      section._count.meetings > 0 ||
      section._count.materials > 0 ||
      section._count.assignments > 0 ||
      section._count.quizzes > 0 ||
      section._count.liveClasses > 0 ||
      section._count.forumThreads > 0;

    // If section has data and not force delete
    if (hasData && !force) {
      return NextResponse.json(
        {
          error:
            "Section memiliki data aktif. Gunakan force delete untuk menghapus semua data.",
          canForceDelete: true,
          details: {
            sectionName: `${section.template.name} - Section ${section.sectionLabel}`,
            enrollments: section._count.enrollments,
            meetings: section._count.meetings,
            materials: section._count.materials,
            assignments: section._count.assignments,
            quizzes: section._count.quizzes,
          },
        },
        { status: 400 }
      );
    }

    // If force delete - cascade delete all related data
    if (force && hasData) {
      // Get all enrollments for this section
      const enrollments = await prisma.enrollment.findMany({
        where: { sectionId: id },
        select: { id: true },
      });
      const enrollmentIds = enrollments.map((e) => e.id);

      // Delete in proper order to avoid FK constraint errors
      // Using longer timeout (30s) because cascade delete has many queries
      await prisma.$transaction(
        async (tx) => {
          // 0. Delete invoices for these enrollments (must be before payments)
          await tx.invoice.deleteMany({
            where: { enrollmentId: { in: enrollmentIds } },
          });

          // 1. Delete payments for these enrollments
          await tx.payment.deleteMany({
            where: { enrollmentId: { in: enrollmentIds } },
          });

          // 1.5 Delete meeting attendance for these enrollments
          await tx.meetingAttendance.deleteMany({
            where: { enrollmentId: { in: enrollmentIds } },
          });

          // 2. Delete enrollments
          await tx.enrollment.deleteMany({
            where: { sectionId: id },
          });

          // 3. Delete meeting attendance
          const meetings = await tx.scheduledMeeting.findMany({
            where: { sectionId: id },
            select: { id: true },
          });
          const meetingIds = meetings.map((m) => m.id);

          await tx.meetingAttendance.deleteMany({
            where: { meetingId: { in: meetingIds } },
          });

          // 4. Delete meetings
          await tx.scheduledMeeting.deleteMany({
            where: { sectionId: id },
          });

          // 5. Delete quiz answers first
          const quizzes = await tx.quiz.findMany({
            where: { sectionId: id },
            select: { id: true },
          });
          const quizIds = quizzes.map((q) => q.id);

          const quizAttempts = await tx.quizAttempt.findMany({
            where: { quizId: { in: quizIds } },
            select: { id: true },
          });
          const quizAttemptIds = quizAttempts.map((a) => a.id);

          await tx.quizAnswer.deleteMany({
            where: { attemptId: { in: quizAttemptIds } },
          });

          // 5.5 Delete quiz attempts
          await tx.quizAttempt.deleteMany({
            where: { quizId: { in: quizIds } },
          });

          // 6. Delete quiz questions
          await tx.quizQuestion.deleteMany({
            where: { quizId: { in: quizIds } },
          });

          // 7. Delete quizzes
          await tx.quiz.deleteMany({
            where: { sectionId: id },
          });

          // 8. Delete assignment submissions
          const assignments = await tx.assignment.findMany({
            where: { sectionId: id },
            select: { id: true },
          });
          const assignmentIds = assignments.map((a) => a.id);

          await tx.assignmentSubmission.deleteMany({
            where: { assignmentId: { in: assignmentIds } },
          });

          // 9. Delete assignments
          await tx.assignment.deleteMany({
            where: { sectionId: id },
          });

          // 10. Delete material bookmarks first
          const materials = await tx.material.findMany({
            where: { sectionId: id },
            select: { id: true },
          });
          const materialIds = materials.map((m) => m.id);

          await tx.materialBookmark.deleteMany({
            where: { materialId: { in: materialIds } },
          });

          // 10.5 Delete materials
          await tx.material.deleteMany({
            where: { sectionId: id },
          });

          // 11. Delete live class attendances first
          const liveClasses = await tx.liveClass.findMany({
            where: { sectionId: id },
            select: { id: true },
          });
          const liveClassIds = liveClasses.map((lc) => lc.id);

          await tx.liveClassAttendance.deleteMany({
            where: { liveClassId: { in: liveClassIds } },
          });

          // 11.5 Delete live classes
          await tx.liveClass.deleteMany({
            where: { sectionId: id },
          });

          // 12. Delete forum posts first (due to self-referencing replies)
          const forumThreads = await tx.forumThread.findMany({
            where: { sectionId: id },
            select: { id: true },
          });
          const forumThreadIds = forumThreads.map((ft) => ft.id);

          await tx.forumPost.deleteMany({
            where: { threadId: { in: forumThreadIds } },
          });

          // 12.5 Delete forum threads
          await tx.forumThread.deleteMany({
            where: { sectionId: id },
          });

          // 13. Finally delete the section
          await tx.classSection.delete({
            where: { id },
          });
        },
        {
          maxWait: 10000, // 10 seconds max wait to acquire transaction
          timeout: 30000, // 30 seconds timeout for the transaction
        }
      );

      return NextResponse.json({
        success: true,
        message: "Section dan semua data terkait berhasil dihapus",
        deleted: {
          enrollments: section._count.enrollments,
          meetings: section._count.meetings,
          materials: section._count.materials,
          assignments: section._count.assignments,
          quizzes: section._count.quizzes,
        },
      });
    }

    // Simple delete (no data to cascade)
    await prisma.classSection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete section:", error);
    return NextResponse.json(
      { error: "Failed to delete section" },
      { status: 500 }
    );
  }
}
