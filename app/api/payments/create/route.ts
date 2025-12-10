import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSnapTransaction, generateInvoiceNumber } from "@/lib/midtrans";

// POST - Create payment for an enrollment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { enrollmentId } = body;

    if (!enrollmentId) {
      return NextResponse.json(
        { error: "enrollmentId is required" },
        { status: 400 }
      );
    }

    // Get enrollment with section and student info
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
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

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    if (enrollment.status !== "PENDING") {
      return NextResponse.json(
        { error: "Enrollment is not in PENDING status" },
        { status: 400 }
      );
    }

    if (!enrollment.section) {
      return NextResponse.json(
        { error: "Enrollment has no section assigned" },
        { status: 400 }
      );
    }

    // Check if invoice already exists
    let invoice = await prisma.invoice.findFirst({
      where: {
        enrollmentId,
        status: "UNPAID",
      },
    });

    // Create invoice if not exists
    if (!invoice) {
      const invoiceNumber = generateInvoiceNumber();
      const now = new Date();
      const dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          enrollmentId,
          studentName: enrollment.student.user.name,
          studentEmail: enrollment.student.user.email,
          studentPhone: enrollment.student.user.phone,
          programName: enrollment.section.template.name,
          sectionLabel: enrollment.section.sectionLabel,
          periodStart: now,
          periodEnd,
          amount: enrollment.section.template.pricePerMonth,
          totalAmount: enrollment.section.template.pricePerMonth,
          dueDate,
        },
      });
    }

    // Check if payment already exists
    let payment = await prisma.payment.findUnique({
      where: { enrollmentId },
    });

    // Create Snap transaction
    const orderId = invoice.invoiceNumber;
    const snapResponse = await createSnapTransaction({
      orderId,
      grossAmount: invoice.totalAmount,
      customerDetails: {
        firstName: enrollment.student.user.name,
        email: enrollment.student.user.email,
        phone: enrollment.student.user.phone || undefined,
      },
      itemDetails: [
        {
          id: enrollment.section.templateId,
          name: `${invoice.programName} - Section ${invoice.sectionLabel}`,
          price: invoice.totalAmount,
          quantity: 1,
        },
      ],
      expiryDuration: 1440, // 24 hours
    });

    const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create or update payment
    if (payment) {
      payment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          orderId,
          snapToken: snapResponse.token,
          redirectUrl: snapResponse.redirect_url,
          expiredAt,
          paymentMethod: "midtrans",
        },
      });
    } else {
      payment = await prisma.payment.create({
        data: {
          enrollmentId,
          amount: invoice.totalAmount,
          paymentMethod: "midtrans",
          orderId,
          snapToken: snapResponse.token,
          redirectUrl: snapResponse.redirect_url,
          expiredAt,
        },
      });
    }

    // Update invoice with payment reference
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { paymentId: payment.id },
    });

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
      },
      payment: {
        id: payment.id,
        orderId: payment.orderId,
        snapToken: snapResponse.token,
        redirectUrl: snapResponse.redirect_url,
        expiredAt,
      },
    });
  } catch (error) {
    console.error("Failed to create payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
