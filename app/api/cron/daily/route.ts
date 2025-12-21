import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber, createSnapTransaction } from "@/lib/midtrans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds for all tasks

/**
 * MASTER CRON JOB: Daily Tasks
 * Runs once daily and executes all cron tasks
 *
 * This combines all individual cron jobs into one to fit Vercel Hobby plan limits (2 cron jobs max)
 *
 * Tasks executed:
 * 1. Payment Expiry Check
 * 2. Subscription Expiry Check
 * 3. Grace Period Check
 * 4. Renewal Reminders
 * 5. Meeting Reminders
 */

interface TaskResult {
  task: string;
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results: TaskResult[] = [];

  console.log(`[DAILY CRON] Starting at ${now.toISOString()}`);

  // ========================================
  // TASK 1: Payment Expiry
  // ========================================
  try {
    const expiredPayments = await prisma.payment.findMany({
      where: {
        status: "PENDING",
        expiredAt: { lt: now },
      },
      include: {
        enrollment: {
          include: {
            student: { include: { user: true } },
          },
        },
        invoice: true,
      },
    });

    let paymentProcessed = 0;
    for (const payment of expiredPayments) {
      try {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "EXPIRED" },
        });

        if (payment.invoice) {
          await prisma.invoice.update({
            where: { id: payment.invoice.id },
            data: { status: "OVERDUE" },
          });
        }

        if (payment.enrollment.status === "PENDING") {
          await prisma.enrollment.update({
            where: { id: payment.enrollmentId },
            data: { status: "CANCELLED" },
          });

          await prisma.waitingList.updateMany({
            where: {
              studentId: payment.enrollment.studentId,
              status: "APPROVED",
            },
            data: { status: "EXPIRED" },
          });
        }

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

        paymentProcessed++;
      } catch (error) {
        console.error(`Error processing payment ${payment.id}:`, error);
      }
    }

    results.push({
      task: "payment-expiry",
      success: true,
      message: `Processed ${paymentProcessed}/${expiredPayments.length} expired payments`,
    });
  } catch (error) {
    console.error("Payment expiry error:", error);
    results.push({
      task: "payment-expiry",
      success: false,
      message: String(error),
    });
  }

  // ========================================
  // TASK 2: Subscription Expiry
  // ========================================
  try {
    const expiredEnrollments = await prisma.enrollment.findMany({
      where: {
        status: "ACTIVE",
        expiryDate: { lt: now },
      },
      include: {
        student: { include: { user: true } },
        section: { include: { template: true } },
      },
    });

    let subscriptionProcessed = 0;
    for (const enrollment of expiredEnrollments) {
      try {
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { status: "EXPIRED" },
        });

        await prisma.notification.create({
          data: {
            userId: enrollment.student.userId,
            title: "Langganan Berakhir",
            message: `Langganan kelas "${
              enrollment.section?.template.name || "Kelas"
            }" telah berakhir. Silakan perpanjang dalam 7 hari.`,
            type: "SUBSCRIPTION",
          },
        });

        subscriptionProcessed++;
      } catch (error) {
        console.error(`Error processing enrollment ${enrollment.id}:`, error);
      }
    }

    results.push({
      task: "subscription-expiry",
      success: true,
      message: `Processed ${subscriptionProcessed}/${expiredEnrollments.length} expired subscriptions`,
    });
  } catch (error) {
    console.error("Subscription expiry error:", error);
    results.push({
      task: "subscription-expiry",
      success: false,
      message: String(error),
    });
  }

  // ========================================
  // TASK 3: Grace Period
  // ========================================
  try {
    const gracePeriodExpired = await prisma.enrollment.findMany({
      where: {
        status: "EXPIRED",
        graceExpiryDate: { lt: now },
      },
      include: {
        student: { include: { user: true } },
        section: { include: { template: true } },
      },
    });

    let graceProcessed = 0;
    for (const enrollment of gracePeriodExpired) {
      try {
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { status: "SLOT_RELEASED" },
        });

        if (enrollment.sectionId) {
          const section = await prisma.classSection.update({
            where: { id: enrollment.sectionId },
            data: { currentEnrollments: { decrement: 1 } },
          });

          if (section.status === "FULL") {
            await prisma.classSection.update({
              where: { id: section.id },
              data: { status: "ACTIVE" },
            });
          }
        }

        await prisma.notification.create({
          data: {
            userId: enrollment.student.userId,
            title: "Slot Dilepaskan",
            message: `Grace period untuk kelas "${
              enrollment.section?.template.name || "Kelas"
            }" telah berakhir. Slot Anda telah dilepaskan.`,
            type: "SUBSCRIPTION",
          },
        });

        graceProcessed++;
      } catch (error) {
        console.error(`Error processing grace period ${enrollment.id}:`, error);
      }
    }

    results.push({
      task: "grace-period",
      success: true,
      message: `Processed ${graceProcessed}/${gracePeriodExpired.length} grace period expirations`,
    });
  } catch (error) {
    console.error("Grace period error:", error);
    results.push({
      task: "grace-period",
      success: false,
      message: String(error),
    });
  }

  // ========================================
  // TASK 4: Renewal Reminders
  // ========================================
  try {
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const expiringEnrollments = await prisma.enrollment.findMany({
      where: {
        status: "ACTIVE",
        expiryDate: { gte: now, lte: threeDaysLater },
      },
      include: {
        student: { include: { user: true } },
        section: { include: { template: true } },
        invoices: {
          where: {
            status: "UNPAID",
            createdAt: {
              gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    });

    let renewalProcessed = 0;
    for (const enrollment of expiringEnrollments) {
      try {
        if (enrollment.invoices.length > 0 || !enrollment.section) continue;

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

        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { paymentId: payment.id },
        });

        const daysLeft = Math.ceil(
          (new Date(enrollment.expiryDate!).getTime() - now.getTime()) /
            (24 * 60 * 60 * 1000)
        );
        await prisma.notification.create({
          data: {
            userId: enrollment.student.userId,
            title: "Reminder: Perpanjang Langganan",
            message: `Langganan kelas "${enrollment.section.template.name}" akan berakhir dalam ${daysLeft} hari.`,
            type: "SUBSCRIPTION",
            link: snapResponse.redirect_url,
          },
        });

        renewalProcessed++;
      } catch (error) {
        console.error(`Error processing renewal ${enrollment.id}:`, error);
      }
    }

    results.push({
      task: "renewal-reminder",
      success: true,
      message: `Processed ${renewalProcessed}/${expiringEnrollments.length} renewal reminders`,
    });
  } catch (error) {
    console.error("Renewal reminder error:", error);
    results.push({
      task: "renewal-reminder",
      success: false,
      message: String(error),
    });
  }

  // ========================================
  // TASK 5: Meeting Reminders (for today's meetings)
  // ========================================
  try {
    // Get meetings scheduled for today
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const todayMeetings = await prisma.scheduledMeeting.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        section: {
          include: {
            template: true,
            enrollments: {
              where: { status: "ACTIVE" },
              include: { student: { include: { user: true } } },
            },
          },
        },
      },
    });

    let meetingNotifications = 0;
    for (const meeting of todayMeetings) {
      const scheduledTime = new Date(meeting.scheduledAt);
      const formattedTime = scheduledTime.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      });

      for (const enrollment of meeting.section.enrollments) {
        try {
          // Check if notification already sent today for this meeting
          const existingNotif = await prisma.notification.findFirst({
            where: {
              userId: enrollment.student.userId,
              title: { contains: "Meeting Hari Ini" },
              createdAt: { gte: startOfDay },
              message: { contains: meeting.title },
            },
          });

          if (existingNotif) continue;

          await prisma.notification.create({
            data: {
              userId: enrollment.student.userId,
              title: "Meeting Hari Ini",
              message: `Kelas "${meeting.title}" dijadwalkan hari ini pukul ${formattedTime} WIB. Jangan lupa bergabung!`,
              type: "CLASS",
              link: meeting.meetingUrl || undefined,
            },
          });
          meetingNotifications++;
        } catch (error) {
          console.error(`Error creating meeting notification:`, error);
        }
      }
    }

    results.push({
      task: "meeting-reminder",
      success: true,
      message: `Sent ${meetingNotifications} meeting reminders for ${todayMeetings.length} meetings today`,
    });
  } catch (error) {
    console.error("Meeting reminder error:", error);
    results.push({
      task: "meeting-reminder",
      success: false,
      message: String(error),
    });
  }

  // ========================================
  // TASK 6: Assignment Reminders (for assignments due today)
  // ========================================
  try {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const assignmentsDueToday = await prisma.assignment.findMany({
      where: {
        status: "PUBLISHED",
        dueDate: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        section: {
          include: {
            template: true,
            enrollments: {
              where: { status: "ACTIVE" },
              include: { student: { include: { user: true } } },
            },
          },
        },
        submissions: true,
      },
    });

    let assignmentNotifications = 0;
    for (const assignment of assignmentsDueToday) {
      for (const enrollment of assignment.section.enrollments) {
        // Check if already submitted
        const hasSubmitted = assignment.submissions.some(
          (sub) => sub.studentId === enrollment.studentId
        );
        if (hasSubmitted) continue;

        try {
          // Check if notification already sent today
          const existingNotif = await prisma.notification.findFirst({
            where: {
              userId: enrollment.student.userId,
              title: { contains: "Tugas Deadline Hari Ini" },
              createdAt: { gte: startOfDay },
              message: { contains: assignment.title },
            },
          });

          if (existingNotif) continue;

          await prisma.notification.create({
            data: {
              userId: enrollment.student.userId,
              title: "⚠️ Tugas Deadline Hari Ini!",
              message: `Tugas "${assignment.title}" untuk kelas "${assignment.section.template.name}" jatuh tempo hari ini. Segera kumpulkan!`,
              type: "ASSIGNMENT",
            },
          });
          assignmentNotifications++;
        } catch (error) {
          console.error(`Error creating assignment notification:`, error);
        }
      }
    }

    results.push({
      task: "assignment-reminder",
      success: true,
      message: `Sent ${assignmentNotifications} assignment reminders for ${assignmentsDueToday.length} assignments due today`,
    });
  } catch (error) {
    console.error("Assignment reminder error:", error);
    results.push({
      task: "assignment-reminder",
      success: false,
      message: String(error),
    });
  }

  // ========================================
  // SUMMARY
  // ========================================
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  console.log(
    `[DAILY CRON] Completed: ${successCount} success, ${failCount} failed`
  );

  return NextResponse.json({
    success: failCount === 0,
    message: `Daily cron completed: ${successCount} tasks succeeded, ${failCount} failed`,
    timestamp: now.toISOString(),
    results,
  });
}
