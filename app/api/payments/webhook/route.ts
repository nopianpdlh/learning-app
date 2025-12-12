import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySignature, mapTransactionStatus } from "@/lib/midtrans";
import { sendPaymentConfirmationEmail } from "@/lib/email";

/**
 * POST /api/payments/webhook
 * Handle Midtrans payment webhook callbacks
 * This endpoint is called by Midtrans when payment status changes
 */
export async function POST(req: NextRequest) {
  try {
    // Parse webhook payload from Midtrans
    const body = await req.json();

    const {
      order_id,
      transaction_status,
      fraud_status,
      gross_amount,
      signature_key,
      status_code,
      payment_type,
      settlement_time,
    } = body;

    // Verify webhook signature
    if (signature_key) {
      const isValid = verifySignature(
        order_id,
        status_code,
        gross_amount,
        signature_key
      );

      if (!isValid) {
        console.error("Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    // Find payment by order ID (which is the invoice number we sent to Midtrans)
    const payment = await db.payment.findFirst({
      where: {
        OR: [
          { orderId: order_id },
          { transactionId: order_id },
          { enrollmentId: order_id },
        ],
      },
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
      },
    });

    if (!payment) {
      console.error("Payment not found for order_id:", order_id);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Verify amount matches (important security check)
    const receivedAmount = parseFloat(gross_amount);
    if (payment.amount !== receivedAmount) {
      console.error("Amount mismatch:", {
        expected: payment.amount,
        received: receivedAmount,
      });
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    // Map Midtrans status to our payment status
    const paymentStatus = mapTransactionStatus(
      transaction_status,
      fraud_status
    );

    let enrollmentStatus: "PENDING" | "ACTIVE" | "EXPIRED" = "PENDING";
    if (paymentStatus === "PAID") {
      enrollmentStatus = "ACTIVE";
    }

    // Update payment status
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        paymentMethod: payment_type || "midtrans",
        paidAt: settlement_time
          ? new Date(settlement_time)
          : paymentStatus === "PAID"
          ? new Date()
          : null,
      },
    });

    // Update enrollment status
    if (paymentStatus === "PAID") {
      await db.enrollment.update({
        where: { id: payment.enrollmentId },
        data: {
          status: enrollmentStatus,
        },
      });
    }

    const className = payment.enrollment.section
      ? `${payment.enrollment.section.template.name} - Section ${payment.enrollment.section.sectionLabel}`
      : "Program";

    // If payment is successful, send notification and email
    if (paymentStatus === "PAID") {
      // Create notification
      await db.notification.create({
        data: {
          userId: payment.enrollment.student.userId,
          title: "Pembayaran Berhasil",
          message: `Pembayaran untuk "${className}" telah berhasil dikonfirmasi. Selamat belajar!`,
          type: "PAYMENT",
        },
      });

      // Send payment confirmation email
      try {
        await sendPaymentConfirmationEmail({
          to: payment.enrollment.student.user.email,
          userName: payment.enrollment.student.user.name,
          className,
          amount: payment.amount,
          transactionId: order_id,
          paidAt: settlement_time ? new Date(settlement_time) : new Date(),
        });
      } catch (emailError) {
        console.error("Failed to send payment confirmation email:", emailError);
      }

      console.log(`Payment confirmed for enrollment ${payment.enrollmentId}`);
    }

    // Log the webhook event
    console.log("Midtrans webhook processed:", {
      orderId: order_id,
      transactionStatus: transaction_status,
      paymentStatus,
      amount: gross_amount,
      enrollmentId: payment.enrollmentId,
    });

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/webhook
 * Return 405 Method Not Allowed
 */
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
