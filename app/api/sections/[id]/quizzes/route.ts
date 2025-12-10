import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET quizzes for a section
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

    const quizzes = await prisma.quiz.findMany({
      where: { sectionId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { questions: true, attempts: true },
        },
      },
    });

    return NextResponse.json({
      section: {
        id: section.id,
        label: section.sectionLabel,
        templateName: section.template.name,
      },
      quizzes,
    });
  } catch (error) {
    console.error("Error fetching section quizzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

// POST create quiz for a section
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
        { error: "Only the assigned tutor or admin can add quizzes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      timeLimit,
      startDate,
      endDate,
      passingGrade,
      status,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const quiz = await prisma.quiz.create({
      data: {
        sectionId,
        title,
        description,
        timeLimit,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        passingGrade,
        status: status || "DRAFT",
      },
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}
