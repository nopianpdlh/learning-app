import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Get single program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const program = await prisma.classTemplate.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            tutor: {
              include: {
                user: true,
              },
            },
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
        },
        _count: {
          select: {
            sections: true,
            waitingList: true,
          },
        },
      },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error("Failed to fetch program:", error);
    return NextResponse.json(
      { error: "Failed to fetch program" },
      { status: 500 }
    );
  }
}

// PATCH - Update program
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const program = await prisma.classTemplate.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        subject: body.subject,
        gradeLevel: body.gradeLevel,
        classType: body.classType,
        pricePerMonth: body.pricePerMonth,
        maxStudentsPerSection: body.maxStudentsPerSection,
        meetingsPerPeriod: body.meetingsPerPeriod,
        periodDays: body.periodDays,
        gracePeriodDays: body.gracePeriodDays,
        thumbnail: body.thumbnail,
        published: body.published,
      },
      include: {
        _count: {
          select: {
            sections: true,
            waitingList: true,
          },
        },
      },
    });

    return NextResponse.json(program);
  } catch (error) {
    console.error("Failed to update program:", error);
    return NextResponse.json(
      { error: "Failed to update program" },
      { status: 500 }
    );
  }
}

// DELETE - Delete program
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get("force") === "true";

    // Check if program exists and get related data
    const program = await prisma.classTemplate.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            enrollments: {
              include: {
                payment: true,
                invoices: true,
              },
            },
          },
        },
        waitingList: true,
      },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Count total enrollments
    const totalEnrollments = program.sections.reduce(
      (acc: number, section) => acc + section.enrollments.length,
      0
    );

    // If has enrollments and not force delete, return error with details
    if (totalEnrollments > 0 && !forceDelete) {
      return NextResponse.json(
        {
          error: "Cannot delete program with active enrollments",
          details: {
            sections: program.sections.length,
            enrollments: totalEnrollments,
          },
          canForceDelete: true,
        },
        { status: 400 }
      );
    }

    // Force delete - cascade delete all related data
    if (forceDelete && totalEnrollments > 0) {
      // Delete in correct order to respect foreign key constraints
      for (const section of program.sections) {
        // Delete invoices and payments for each enrollment
        for (const enrollment of section.enrollments) {
          // Delete attendance records
          await prisma.meetingAttendance.deleteMany({
            where: { enrollmentId: enrollment.id },
          });
          // Delete invoices
          await prisma.invoice.deleteMany({
            where: { enrollmentId: enrollment.id },
          });
          // Payment is one-to-one, delete if exists
          if (enrollment.payment) {
            await prisma.payment.delete({
              where: { id: enrollment.payment.id },
            });
          }
        }

        // Delete all enrollments for this section
        await prisma.enrollment.deleteMany({
          where: { sectionId: section.id },
        });

        // Delete scheduled meetings (and their attendance via cascade)
        await prisma.scheduledMeeting.deleteMany({
          where: { sectionId: section.id },
        });
      }

      // Delete sections - cascade will handle materials, assignments, quizzes, etc.
      await prisma.classSection.deleteMany({
        where: { templateId: id },
      });
    }

    // Delete waiting list entries
    await prisma.waitingList.deleteMany({
      where: { templateId: id },
    });

    // Finally delete the program
    await prisma.classTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      deletedEnrollments: totalEnrollments,
      deletedSections: program.sections.length,
    });
  } catch (error) {
    console.error("Failed to delete program:", error);
    return NextResponse.json(
      { error: "Failed to delete program" },
      { status: 500 }
    );
  }
}
