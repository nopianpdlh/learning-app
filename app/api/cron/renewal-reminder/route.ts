import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber, createSnapTransaction } from "@/lib/midtrans";

/**
 * CRON JOB: Send renewal reminders
 * Run daily at 09:00 WIB
 *
 * This cron job:
 * 1. Finds ACTIVE enrollments expiring in 3 days
 * 2. Creates renewal invoice
 * 3. Sends reminder notification
 */
export async function GET() {
  try {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find enrollments expiring in ~3 days
    const expiringEnrollments = await prisma.enrollment.findMany({
      where: {
        status: "ACTIVE",
        expiryDate: {
          gte: now,
          lte: threeDaysLater,
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
        invoices: {
          where: {
            status: "UNPAID",
            createdAt: {
              gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        },
      },
    });

    console.log(`Found ${expiringEnrollments.length} expiring enrollments`);

    let processed = 0;
    const errors: string[] = [];

    for (const enrollment of expiringEnrollments) {
      try {
        // Skip if already has recent unpaid invoice
        if (enrollment.invoices.length > 0) {
          console.log(
            `Enrollment ${enrollment.id} already has pending invoice, skipping`
          );
          continue;
        }

        if (!enrollment.section) {
          console.log(`Enrollment ${enrollment.id} has no section, skipping`);
          continue;
        }

        // Create renewal invoice
        const invoiceNumber = generateInvoiceNumber();
        const dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const newPeriodStart = enrollment.expiryDate || now;
        const newPeriodEnd = new Date(
          new Date(newPeriodStart).getTime() + 30 * 24 * 60 * 60 * 1000
        );

        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            enrollmentId: enrollment.id,
            studentName: enrollment.student.user.name,
            studentEmail: enrollment.student.user.email,
            studentPhone: enrollment.student.user.phone,
            programName: enrollment.section.template.name,
            sectionLabel: enrollment.section.sectionLabel,
            periodStart: newPeriodStart,
            periodEnd: newPeriodEnd,
            amount: enrollment.section.template.pricePerMonth,
            totalAmount: enrollment.section.template.pricePerMonth,
            dueDate,
            notes: "Renewal - Perpanjangan langganan",
          },
        });

        // Create Snap transaction
        const snapResponse = await createSnapTransaction({
          orderId: invoiceNumber,
          grossAmount: invoice.totalAmount,
          customerDetails: {
            firstName: enrollment.student.user.name,
            email: enrollment.student.user.email,
            phone: enrollment.student.user.phone || undefined,
          },
          itemDetails: [
            {
              id: enrollment.section.templateId,
              name: `[RENEWAL] ${invoice.programName} - Section ${invoice.sectionLabel}`,
              price: invoice.totalAmount,
              quantity: 1,
            },
          ],
          expiryDuration: 1440,
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

        // Create notification
        const daysLeft = Math.ceil(
          (new Date(enrollment.expiryDate!).getTime() - now.getTime()) /
            (24 * 60 * 60 * 1000)
        );
        await prisma.notification.create({
          data: {
            userId: enrollment.student.userId,
            title: "Reminder: Perpanjang Langganan",
            message: `Langganan kelas "${enrollment.section.template.name}" akan berakhir dalam ${daysLeft} hari. Klik untuk memperpanjang.`,
            type: "SUBSCRIPTION",
            link: snapResponse.redirect_url,
          },
        });

        processed++;
        console.log(
          `Created renewal invoice ${invoiceNumber} for enrollment ${enrollment.id}`
        );
      } catch (error) {
        console.error(`Error processing enrollment ${enrollment.id}:`, error);
        errors.push(enrollment.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} renewal reminders`,
      total: expiringEnrollments.length,
      processed,
      errors,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Renewal reminder cron error:", error);
    return NextResponse.json(
      { error: "Failed to process renewal reminders" },
      { status: 500 }
    );
  }
}
