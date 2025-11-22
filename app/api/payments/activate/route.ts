import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/payments/activate
 * Activate paid enrollments (can be called via cron job)
 * Changes enrollment status from PAID to ACTIVE
 * This endpoint should be called by a cron job or manually by admin
 */
export async function POST(req: NextRequest) {
  try {
    // Optional: Add authentication for cron job
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all enrollments with PAID status
    const paidEnrollments = await db.enrollment.findMany({
      where: {
        status: "PAID",
      },
      include: {
        class: true,
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    const now = new Date();
    let activatedCount = 0;

    // Activate enrollments where class has started
    // For simplicity, we activate immediately after payment
    // In production, you might want to check class start date
    for (const enrollment of paidEnrollments) {
      await db.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "ACTIVE",
        },
      });

      // Create notification
      await db.notification.create({
        data: {
          userId: enrollment.student.userId,
          title: "Kelas Aktif",
          message: `Kelas "${enrollment.class.name}" sekarang sudah aktif. Anda dapat mulai belajar!`,
          type: "ASSIGNMENT",
        },
      });

      activatedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `${activatedCount} enrollment(s) activated`,
      activatedCount,
    });
  } catch (error) {
    console.error("Activate enrollments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/activate
 * Manual trigger for activation (Admin only)
 */
export async function GET(req: NextRequest) {
  try {
    // For manual trigger via browser (admin only)
    // In production, add proper admin authentication
    return POST(req);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
