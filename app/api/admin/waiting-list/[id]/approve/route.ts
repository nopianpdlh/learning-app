import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSnapTransaction, generateInvoiceNumber } from "@/lib/midtrans";

// POST - Approve waiting list entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.sectionId) {
      return NextResponse.json(
        { error: "sectionId is required" },
        { status: 400 }
      );
    }

    // Get the waiting list entry
    const entry = await prisma.waitingList.findUnique({
      where: { id },
      include: {
        template: true,
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Waiting list entry not found" },
        { status: 404 }
      );
    }

    if (entry.status !== "PENDING") {
      return NextResponse.json(
        { error: "Entry is not in PENDING status" },
        { status: 400 }
      );
    }

    // Check if section exists and has space
    const section = await prisma.classSection.findUnique({
      where: { id: body.sectionId },
      include: {
        template: true,
      },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    if (section.currentEnrollments >= section.template.maxStudentsPerSection) {
      return NextResponse.json({ error: "Section is full" }, { status: 400 });
    }

    // Update waiting list entry
    const updatedEntry = await prisma.waitingList.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        assignedSectionId: body.sectionId,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        template: {
          include: {
            sections: {
              where: {
                status: "ACTIVE",
              },
            },
          },
        },
      },
    });

    // Create a pending enrollment (waiting for payment)
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setDate(expiryDate.getDate() + 30);
    const graceExpiryDate = new Date(expiryDate);
    graceExpiryDate.setDate(
      graceExpiryDate.getDate() + entry.template.gracePeriodDays
    );

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: entry.studentId,
        sectionId: body.sectionId,
        status: "PENDING",
        startDate: now,
        expiryDate: expiryDate,
        graceExpiryDate: graceExpiryDate,
        meetingsAllowed: entry.template.meetingsPerPeriod,
        meetingsAttended: 0,
      },
    });

    // Auto-create invoice
    const invoiceNumber = generateInvoiceNumber();
    const dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        enrollmentId: enrollment.id,
        studentName: entry.student.user.name,
        studentEmail: entry.student.user.email,
        studentPhone: entry.student.user.phone,
        programName: section.template.name,
        sectionLabel: section.sectionLabel,
        periodStart: now,
        periodEnd: expiryDate,
        amount: section.template.pricePerMonth,
        totalAmount: section.template.pricePerMonth,
        dueDate,
      },
    });

    // Create Snap transaction for payment
    const snapResponse = await createSnapTransaction({
      orderId: invoiceNumber,
      grossAmount: invoice.totalAmount,
      customerDetails: {
        firstName: entry.student.user.name,
        email: entry.student.user.email,
        phone: entry.student.user.phone || undefined,
      },
      itemDetails: [
        {
          id: section.templateId,
          name: `${invoice.programName} - Section ${invoice.sectionLabel}`,
          price: invoice.totalAmount,
          quantity: 1,
        },
      ],
      expiryDuration: 1440, // 24 hours
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        enrollmentId: enrollment.id,
        amount: invoice.totalAmount,
        paymentMethod: "midtrans",
        orderId: invoiceNumber,
        snapToken: snapResponse.token,
        redirectUrl: snapResponse.redirect_url,
        expiredAt: dueDate,
      },
    });

    // Link invoice to payment
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { paymentId: payment.id },
    });

    // TODO: Send email notification with payment link

    return NextResponse.json({
      ...updatedEntry,
      paymentUrl: snapResponse.redirect_url,
      invoiceNumber: invoice.invoiceNumber,
    });
  } catch (error) {
    console.error("Failed to approve waiting list entry:", error);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}
