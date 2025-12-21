import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

// GET - List all programs
export async function GET() {
  try {
    const programs = await prisma.classTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            sections: true,
            waitingList: true,
          },
        },
      },
    });

    return NextResponse.json(programs);
  } catch (error) {
    console.error("Failed to fetch programs:", error);
    return NextResponse.json(
      { error: "Failed to fetch programs" },
      { status: 500 }
    );
  }
}

// POST - Create new program
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (
      !body.name ||
      !body.subject ||
      !body.gradeLevel ||
      !body.pricePerMonth
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const program = await prisma.classTemplate.create({
      data: {
        name: body.name,
        description: body.description || "",
        subject: body.subject,
        gradeLevel: body.gradeLevel,
        classType: body.classType || "SEMI_PRIVATE",
        pricePerMonth: body.pricePerMonth,
        maxStudentsPerSection: body.maxStudentsPerSection || 10,
        meetingsPerPeriod: body.meetingsPerPeriod || 8,
        periodDays: body.periodDays || 30,
        gracePeriodDays: body.gracePeriodDays || 7,
        thumbnail: body.thumbnail || null,
        published: body.published || false,
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

    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error("Failed to create program:", error);
    return NextResponse.json(
      { error: "Failed to create program" },
      { status: 500 }
    );
  }
}
