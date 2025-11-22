import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateClassSchema } from "@/lib/validations/class.schema";
import { createClient } from "@/lib/supabase/server";

// GET /api/classes/:id - Get class by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const classData = await db.class.findUnique({
      where: { id: params.id },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
                email: true,
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
    });

    if (!classData) {
      return NextResponse.json(
        { error: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ class: classData });
  } catch (error) {
    console.error("Get class error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kelas" },
      { status: 500 }
    );
  }
}

// PUT /api/classes/:id - Update class (Admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const data = updateClassSchema.parse(body);

    // Check if class exists
    const existingClass = await db.class.findUnique({
      where: { id: params.id },
    });

    if (!existingClass) {
      return NextResponse.json(
        { error: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    // If tutorId is being updated, verify tutor exists
    if (data.tutorId) {
      const tutor = await db.tutorProfile.findUnique({
        where: { id: data.tutorId },
      });

      if (!tutor) {
        return NextResponse.json(
          { error: "Tutor tidak ditemukan" },
          { status: 404 }
        );
      }
    }

    const updatedClass = await db.class.update({
      where: { id: params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description && { description: data.description }),
        ...(data.subject && { subject: data.subject }),
        ...(data.gradeLevel && { gradeLevel: data.gradeLevel }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.schedule && { schedule: data.schedule }),
        ...(data.tutorId && { tutorId: data.tutorId }),
        ...(data.thumbnail !== undefined && {
          thumbnail: data.thumbnail || null,
        }),
        ...(data.published !== undefined && { published: data.published }),
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

    return NextResponse.json({ class: updatedClass });
  } catch (error) {
    console.error("Update class error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui kelas" },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/:id - Delete class (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if class has enrollments
    const enrollmentCount = await db.enrollment.count({
      where: { classId: params.id },
    });

    if (enrollmentCount > 0) {
      return NextResponse.json(
        {
          error:
            "Tidak dapat menghapus kelas yang sudah memiliki siswa terdaftar",
        },
        { status: 400 }
      );
    }

    await db.class.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Kelas berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete class error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus kelas" },
      { status: 500 }
    );
  }
}
