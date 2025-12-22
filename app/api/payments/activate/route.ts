import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/payments/activate
 * Activate enrollments that have been paid
 * Changes enrollment status from PENDING to ACTIVE when payment is PAID
 * Updated to use section-based system
 */
export async function POST(req: NextRequest) {
  try {
    // Optional: Add authentication for cron job
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all enrollments with PENDING status that have PAID payment
    const pendingEnrollments = await db.enrollment.findMany({
      where: {
        status: "PENDING",
        payment: {
          status: "PAID",
        },
      },
      include: {
        section: {
          include: {
            template: true,
          },
        },
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    let activatedCount = 0;
    const now = new Date();

    // Activate enrollments
    for (const enrollment of pendingEnrollments) {
      // Calculate subscription period (30 days)
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + 30);

      // Calculate grace period (7 days after expiry)
      const graceExpiryDate = new Date(expiryDate);
      graceExpiryDate.setDate(graceExpiryDate.getDate() + 7);

      await db.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "ACTIVE",
          startDate: now,
          expiryDate: expiryDate,
          graceExpiryDate: graceExpiryDate,
        },
      });

      // Create notification
      await db.notification.create({
        data: {
          userId: enrollment.student.userId,
          title: "Kelas Aktif",
          message: `Kelas "${enrollment.section.template.name}" sekarang sudah aktif. Anda dapat mulai belajar!`,
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
