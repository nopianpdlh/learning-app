import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/payments/status?enrollmentId=xxx
 * Get payment status for an enrollment
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const enrollmentId = searchParams.get("enrollmentId");

    if (!enrollmentId) {
      return NextResponse.json(
        { error: "enrollmentId is required" },
        { status: 400 }
      );
    }

    // Find enrollment with payment details
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        class: {
          select: {
            name: true,
            subject: true,
            thumbnail: true,
          },
        },
        payment: true,
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (enrollment.student.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        class: enrollment.class,
      },
      payment: enrollment.payment || null,
    });
  } catch (error) {
    console.error("Payment status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
