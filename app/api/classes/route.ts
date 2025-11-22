import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  createClassSchema,
  classFilterSchema,
} from "@/lib/validations/class.schema";
import { createClient } from "@/lib/supabase/server";

// GET /api/classes - Get all classes with optional filters
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { searchParams } = new URL(req.url);

    const filters = classFilterSchema.parse({
      subject: searchParams.get("subject") || undefined,
      gradeLevel: searchParams.get("gradeLevel") || undefined,
      minPrice: searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : undefined,
      search: searchParams.get("search") || undefined,
      published: searchParams.get("published") === "true" ? true : undefined,
    });

    const where: any = {};

    // Role-based filtering
    if (session) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: {
          tutorProfile: true,
          studentProfile: true,
        },
      });

      if (user?.role === "TUTOR" && user.tutorProfile) {
        // Tutors only see their own classes
        where.tutorId = user.tutorProfile.id;
      } else if (user?.role === "STUDENT") {
        // Students only see published classes
        where.published = true;
      }
      // Admin sees all classes
    } else {
      // Public access only sees published classes
      where.published = true;
    }

    if (filters.subject) {
      where.subject = { contains: filters.subject, mode: "insensitive" };
    }

    if (filters.gradeLevel) {
      where.gradeLevel = { contains: filters.gradeLevel, mode: "insensitive" };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.published !== undefined) {
      where.published = filters.published;
    }

    const classes = await db.class.findMany({
      where,
      include: {
        tutor: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            materials: true,
            assignments: true,
            quizzes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ classes });
  } catch (error) {
    console.error("Get classes error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kelas" },
      { status: 500 }
    );
  }
}

// POST /api/classes - Create new class (Admin only)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = createClassSchema.parse(body);

    // Verify tutor exists
    const tutor = await db.tutorProfile.findUnique({
      where: { id: data.tutorId },
    });

    if (!tutor) {
      return NextResponse.json(
        { error: "Tutor tidak ditemukan" },
        { status: 404 }
      );
    }

    const newClass = await db.class.create({
      data: {
        name: data.name,
        description: data.description,
        subject: data.subject,
        gradeLevel: data.gradeLevel,
        price: data.price,
        capacity: data.capacity,
        schedule: data.schedule,
        tutorId: data.tutorId,
        thumbnail: data.thumbnail || null,
        published: data.published,
      },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ class: newClass }, { status: 201 });
  } catch (error) {
    console.error("Create class error:", error);
    return NextResponse.json({ error: "Gagal membuat kelas" }, { status: 500 });
  }
}
