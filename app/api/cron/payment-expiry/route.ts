import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * CRON JOB: Handle payment expiry
 * Run hourly
 *
 * This cron job:
 * 1. Finds PENDING payments that have expired
 * 2. Updates payment status to EXPIRED
 * 3. Updates invoice status to OVERDUE
 * 4. Updates waiting list entry to EXPIRED (if applicable)
 */
export async function GET() {
  try {
    const now = new Date();

    // Find expired payments
    const expiredPayments = await prisma.payment.findMany({
      where: {
        status: "PENDING",
        expiredAt: {
          lt: now,
        },
      },
      include: {
        enrollment: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
        invoice: true,
      },
    });

    console.log(`Found ${expiredPayments.length} expired payments`);

    let processed = 0;
    const errors: string[] = [];

    for (const payment of expiredPayments) {
      try {
        // Update payment status
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "EXPIRED" },
        });

        // Update invoice status if exists
        if (payment.invoice) {
          await prisma.invoice.update({
            where: { id: payment.invoice.id },
            data: { status: "OVERDUE" },
          });
        }

        // Update enrollment if still PENDING
        if (payment.enrollment.status === "PENDING") {
          await prisma.enrollment.update({
            where: { id: payment.enrollmentId },
            data: { status: "CANCELLED" },
          });

          // Decrement currentEnrollments in section
          await prisma.classSection.update({
            where: { id: payment.enrollment.sectionId },
            data: { currentEnrollments: { decrement: 1 } },
          });

          // Update waiting list entry
          await prisma.waitingList.updateMany({
            where: {
              studentId: payment.enrollment.studentId,
              status: "APPROVED",
            },
            data: { status: "EXPIRED" },
          });
        }

        // Create notification
        await prisma.notification.create({
          data: {
            userId: payment.enrollment.student.userId,
            title: "Pembayaran Kedaluwarsa",
            message: `Batas waktu pembayaran untuk invoice ${
              payment.invoice?.invoiceNumber || payment.orderId
            } telah habis.`,
            type: "PAYMENT",
          },
        });

        processed++;
        console.log(`Processed expired payment ${payment.id}`);
      } catch (error) {
        console.error(`Error processing payment ${payment.id}:`, error);
        errors.push(payment.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} expired payments`,
      total: expiredPayments.length,
      processed,
      errors,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Payment expiry cron error:", error);
    return NextResponse.json(
      { error: "Failed to process payment expiry" },
      { status: 500 }
    );
  }
}
