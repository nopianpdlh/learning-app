import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

// GET assignments for a section
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sectionId } = await params;

    // Verify section exists
    const section = await prisma.classSection.findUnique({
      where: { id: sectionId },
      include: {
        template: true,
      },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const assignments = await prisma.assignment.findMany({
      where: { sectionId },
      orderBy: { dueDate: "asc" },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });

    return NextResponse.json({
      section: {
        id: section.id,
        label: section.sectionLabel,
        templateName: section.template.name,
      },
      assignments,
    });
  } catch (error) {
    console.error("Error fetching section assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

// POST create assignment for a section
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sectionId } = await params;

    // Verify section exists and user is tutor of this section
    const section = await prisma.classSection.findUnique({
      where: { id: sectionId },
      include: {
        tutor: {
          include: { user: true },
        },
        template: true,
      },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Check if user is the tutor or admin
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isTutor = section.tutor.user.email === user.email;
    const isAdmin = dbUser.role === "ADMIN";

    if (!isTutor && !isAdmin) {
      return NextResponse.json(
        { error: "Only the assigned tutor or admin can add assignments" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, instructions, dueDate, maxPoints, attachmentUrl, status } =
      body;

    if (!title || !instructions || !dueDate) {
      return NextResponse.json(
        { error: "Title, instructions, and dueDate are required" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        sectionId,
        title,
        instructions,
        dueDate: new Date(dueDate),
        maxPoints: maxPoints || 100,
        attachmentUrl,
        status: status || "DRAFT",
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}
