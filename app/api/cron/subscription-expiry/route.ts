import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * CRON JOB: Check subscription expiry
 * Run daily at 00:00 UTC
 *
 * This cron job:
 * 1. Finds ACTIVE enrollments that have expired (expiryDate < now)
 * 2. Updates them to EXPIRED status
 * 3. Creates renewal reminder notification
 */
export async function GET() {
  try {
    const now = new Date();

    // Find expired enrollments that are still ACTIVE
    const expiredEnrollments = await prisma.enrollment.findMany({
      where: {
        status: "ACTIVE",
        expiryDate: {
          lt: now,
        },
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        section: {
          include: {
            template: true,
          },
        },
      },
    });

    console.log(`Found ${expiredEnrollments.length} expired enrollments`);

    let processed = 0;
    const errors: string[] = [];

    for (const enrollment of expiredEnrollments) {
      try {
        // Update enrollment status to EXPIRED
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { status: "EXPIRED" },
        });

        // Create notification for student
        await prisma.notification.create({
          data: {
            userId: enrollment.student.userId,
            title: "Langganan Berakhir",
            message: `Langganan kelas "${
              enrollment.section?.template.name || "Kelas"
            }" telah berakhir. Silakan perpanjang dalam 7 hari untuk mempertahankan slot Anda.`,
            type: "SUBSCRIPTION",
          },
        });

        // TODO: Send email reminder for renewal

        processed++;
        console.log(`Processed enrollment ${enrollment.id}`);
      } catch (error) {
        console.error(`Error processing enrollment ${enrollment.id}:`, error);
        errors.push(enrollment.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} expired enrollments`,
      total: expiredEnrollments.length,
      processed,
      errors,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Subscription expiry cron error:", error);
    return NextResponse.json(
      { error: "Failed to process subscription expiry" },
      { status: 500 }
    );
  }
}
