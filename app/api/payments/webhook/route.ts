import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookPayload, WebhookPayload } from "@/lib/pakasir";
import { sendPaymentConfirmationEmail } from "@/lib/email";

/**
 * POST /api/payments/webhook
 * Handle Pakasir payment webhook callbacks
 * This endpoint is called by Pakasir when payment status changes
 */
export async function POST(req: NextRequest) {
  try {
    // Parse webhook payload from Pakasir
    const body = await req.json();

    const payload: WebhookPayload = {
      project: body.project,
      order_id: body.order_id,
      amount: body.amount,
      status: body.status,
      payment_method: body.payment_method,
      completed_at: body.completed_at,
    };

    // Verify webhook payload
    const isValid = verifyWebhookPayload(payload);

    if (!isValid) {
      console.error("Invalid webhook payload");
      return NextResponse.json({ error: "Invalid payload" }, { status: 401 });
    }

    // Find payment by order ID (our enrollment ID is in order_id)
    const payment = await db.payment.findFirst({
      where: {
        enrollmentId: payload.order_id.startsWith("ENR-")
          ? payload.order_id.split("-")[1]
          : payload.order_id,
      },
      include: {
        enrollment: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
            class: true,
          },
        },
      },
    });

    if (!payment) {
      console.error("Payment not found for order_id:", payload.order_id);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Verify amount matches (important security check as recommended by Pakasir)
    if (payment.amount !== payload.amount) {
      console.error("Amount mismatch:", {
        expected: payment.amount,
        received: payload.amount,
      });
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    // Map Pakasir status to our payment status
    let paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED" = "PENDING";
    let enrollmentStatus:
      | "PENDING"
      | "PAID"
      | "ACTIVE"
      | "COMPLETED"
      | "CANCELLED" = "PENDING";

    switch (payload.status) {
      case "completed":
        paymentStatus = "PAID";
        enrollmentStatus = "PAID"; // Will be changed to ACTIVE after class starts
        break;
      case "pending":
        paymentStatus = "PENDING";
        enrollmentStatus = "PENDING";
        break;
      default:
        paymentStatus = "PENDING";
        enrollmentStatus = "PENDING";
    }

    // Update payment status
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        paymentMethod: payload.payment_method,
        paidAt: payload.completed_at ? new Date(payload.completed_at) : null,
      },
    });

    // Update enrollment status
    await db.enrollment.update({
      where: { id: payment.enrollmentId },
      data: {
        status: enrollmentStatus,
      },
    });

    // If payment is successful, send notification and email
    if (paymentStatus === "PAID") {
      // Create notification
      await db.notification.create({
        data: {
          userId: payment.enrollment.student.userId,
          title: "Pembayaran Berhasil",
          message: `Pembayaran untuk kelas "${payment.enrollment.class.name}" telah berhasil dikonfirmasi. Selamat belajar!`,
          type: "PAYMENT",
        },
      });

      // Send payment confirmation email
      try {
        await sendPaymentConfirmationEmail({
          to: payment.enrollment.student.user.email,
          userName: payment.enrollment.student.user.name,
          className: payment.enrollment.class.name,
          amount: payment.amount,
          transactionId: payload.order_id,
          paidAt: payload.completed_at
            ? new Date(payload.completed_at)
            : new Date(),
        });
      } catch (emailError) {
        console.error("Failed to send payment confirmation email:", emailError);
        // Don't fail the webhook if email fails
      }

      console.log(`Payment confirmed for enrollment ${payment.enrollmentId}`);
    }

    // Log the webhook event
    console.log("Webhook processed:", {
      orderId: payload.order_id,
      status: payload.status,
      amount: payload.amount,
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
