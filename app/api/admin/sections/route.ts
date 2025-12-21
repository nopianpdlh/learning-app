import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - List all sections
export async function GET() {
  try {
    const sections = await prisma.classSection.findMany({
      orderBy: { createdAt: "desc" },
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
          select: {
            enrollments: true,
          },
        },
      },
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error("Failed to fetch sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch sections" },
      { status: 500 }
    );
  }
}

// POST - Create new section
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.templateId || !body.sectionLabel || !body.tutorId) {
      return NextResponse.json(
        { error: "templateId, sectionLabel, and tutorId are required" },
        { status: 400 }
      );
    }

    // Check if section label already exists for this template
    const existingSection = await prisma.classSection.findFirst({
      where: {
        templateId: body.templateId,
        sectionLabel: body.sectionLabel,
      },
    });

    if (existingSection) {
      return NextResponse.json(
        {
          error: `Section ${body.sectionLabel} already exists for this program`,
        },
        { status: 400 }
      );
    }

    // Create the section
    const section = await prisma.classSection.create({
      data: {
        templateId: body.templateId,
        sectionLabel: body.sectionLabel.toUpperCase(),
        tutorId: body.tutorId,
        status: "ACTIVE",
        currentEnrollments: 0,
      },
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
      },
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error("Failed to create section:", error);
    return NextResponse.json(
      { error: "Failed to create section" },
      { status: 500 }
    );
  }
}
