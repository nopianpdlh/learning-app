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

    // Check if program has sections with enrollments
    const program = await prisma.classTemplate.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
        },
      },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Check if any section has enrollments
    const hasEnrollments = program.sections.some(
      (section) => section._count.enrollments > 0
    );

    if (hasEnrollments) {
      return NextResponse.json(
        { error: "Cannot delete program with active enrollments" },
        { status: 400 }
      );
    }

    // Delete program (will cascade delete sections)
    await prisma.classTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete program:", error);
    return NextResponse.json(
      { error: "Failed to delete program" },
      { status: 500 }
    );
  }
}
