import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySignature, mapTransactionStatus } from "@/lib/midtrans";

// POST - Midtrans webhook notification handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Midtrans webhook received:", JSON.stringify(body, null, 2));

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      transaction_id,
      payment_type,
      va_numbers,
      settlement_time,
    } = body;

    // Verify signature
    const isValid = verifySignature(
      order_id,
      status_code,
      gross_amount,
      signature_key
    );

    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Find payment by orderId
    const payment = await prisma.payment.findFirst({
      where: { orderId: order_id },
      include: {
        enrollment: {
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
        },
        invoice: true,
      },
    });

    if (!payment) {
      console.error(`Payment not found for order_id: ${order_id}`);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Map transaction status
    const newStatus = mapTransactionStatus(transaction_status, fraud_status);

    // Extract VA number if available
    const vaNumber = va_numbers?.[0]?.va_number || null;

    // Update payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        transactionId: transaction_id,
        paymentType: payment_type,
        vaNumber,
        paidAt:
          newStatus === "PAID" ? new Date(settlement_time || Date.now()) : null,
      },
    });

    // Handle status-specific updates
    if (newStatus === "PAID") {
      // Update invoice status
      if (payment.invoice) {
        await prisma.invoice.update({
          where: { id: payment.invoice.id },
          data: {
            status: "PAID",
            paidAt: new Date(settlement_time || Date.now()),
          },
        });
      }

      // Activate enrollment
      const now = new Date();
      const gracePeriodDays =
        payment.enrollment.section?.template?.gracePeriodDays || 7;
      const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const graceExpiryDate = new Date(
        expiryDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000
      );

      await prisma.enrollment.update({
        where: { id: payment.enrollmentId },
        data: {
          status: "ACTIVE",
          startDate: now,
          expiryDate,
          graceExpiryDate,
        },
      });

      // Update section enrollment count
      if (payment.enrollment.sectionId) {
        await prisma.classSection.update({
          where: { id: payment.enrollment.sectionId },
          data: {
            currentEnrollments: {
              increment: 1,
            },
          },
        });

        // Check if section is now full
        const section = await prisma.classSection.findUnique({
          where: { id: payment.enrollment.sectionId },
          include: { template: true },
        });

        if (
          section &&
          section.currentEnrollments >= section.template.maxStudentsPerSection
        ) {
          await prisma.classSection.update({
            where: { id: section.id },
            data: { status: "FULL" },
          });
        }
      }

      // Create notification
      try {
        await prisma.notification.create({
          data: {
            userId: payment.enrollment.student.userId,
            title: "Pembayaran Berhasil",
            message: `Pembayaran untuk ${
              payment.invoice?.programName || "kelas"
            } telah berhasil. Selamat belajar!`,
            type: "PAYMENT",
          },
        });
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
      }

      console.log(`Payment confirmed for order: ${order_id}`);
    } else if (newStatus === "EXPIRED") {
      // Update invoice status
      if (payment.invoice) {
        await prisma.invoice.update({
          where: { id: payment.invoice.id },
          data: { status: "OVERDUE" },
        });
      }

      // Update waiting list entry to expired
      const waitingEntry = await prisma.waitingList.findFirst({
        where: {
          studentId: payment.enrollment.studentId,
          status: "APPROVED",
        },
      });

      if (waitingEntry) {
        await prisma.waitingList.update({
          where: { id: waitingEntry.id },
          data: { status: "EXPIRED" },
        });
      }

      console.log(`Payment expired for order: ${order_id}`);
    } else if (newStatus === "FAILED") {
      // Update invoice status
      if (payment.invoice) {
        await prisma.invoice.update({
          where: { id: payment.invoice.id },
          data: { status: "CANCELLED" },
        });
      }

      console.log(`Payment failed for order: ${order_id}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Midtrans webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
