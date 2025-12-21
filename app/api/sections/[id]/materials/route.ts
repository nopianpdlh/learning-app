import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

// GET materials for a section
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

    const materials = await prisma.material.findMany({
      where: { sectionId },
      orderBy: { session: "asc" },
    });

    return NextResponse.json({
      section: {
        id: section.id,
        label: section.sectionLabel,
        templateName: section.template.name,
      },
      materials,
    });
  } catch (error) {
    console.error("Error fetching section materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}

// POST create material for a section
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
        { error: "Only the assigned tutor or admin can add materials" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      session,
      fileType,
      fileUrl,
      videoUrl,
      thumbnail,
    } = body;

    if (!title || !session || !fileType) {
      return NextResponse.json(
        { error: "Title, session, and fileType are required" },
        { status: 400 }
      );
    }

    const material = await prisma.material.create({
      data: {
        sectionId,
        title,
        description,
        session: parseInt(session),
        fileType,
        fileUrl,
        videoUrl,
        thumbnail,
      },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error("Error creating material:", error);
    return NextResponse.json(
      { error: "Failed to create material" },
      { status: 500 }
    );
  }
}
