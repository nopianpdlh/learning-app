import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * CRON JOB: Handle grace period expiry
 * Run daily at 01:00 UTC
 *
 * This cron job:
 * 1. Finds EXPIRED enrollments where grace period has ended
 * 2. Updates them to SLOT_RELEASED status
 * 3. Decrements section enrollment count
 * 4. Updates section status if it was FULL
 */
export async function GET() {
  try {
    const now = new Date();

    // Find enrollments where grace period has expired
    const gracePeriodExpired = await prisma.enrollment.findMany({
      where: {
        status: "EXPIRED",
        graceExpiryDate: {
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

    console.log(
      `Found ${gracePeriodExpired.length} grace period expired enrollments`
    );

    let processed = 0;
    const errors: string[] = [];

    for (const enrollment of gracePeriodExpired) {
      try {
        // Update enrollment status to SLOT_RELEASED
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { status: "SLOT_RELEASED" },
        });

        // Decrement section enrollment count
        if (enrollment.sectionId) {
          const section = await prisma.classSection.update({
            where: { id: enrollment.sectionId },
            data: {
              currentEnrollments: {
                decrement: 1,
              },
            },
            include: {
              template: true,
            },
          });

          // If section was FULL, set it back to ACTIVE
          if (section.status === "FULL") {
            await prisma.classSection.update({
              where: { id: section.id },
              data: { status: "ACTIVE" },
            });
          }
        }

        // Create notification for student
        await prisma.notification.create({
          data: {
            userId: enrollment.student.userId,
            title: "Slot Dilepaskan",
            message: `Grace period untuk kelas "${
              enrollment.section?.template.name || "Kelas"
            }" telah berakhir. Slot Anda telah dilepaskan. Silakan daftar ulang jika ingin melanjutkan.`,
            type: "SUBSCRIPTION",
          },
        });

        // Update waiting list entry if exists
        await prisma.waitingList.updateMany({
          where: {
            studentId: enrollment.studentId,
            templateId: enrollment.section?.templateId,
            status: "APPROVED",
          },
          data: {
            status: "EXPIRED",
          },
        });

        processed++;
        console.log(`Processed enrollment ${enrollment.id} - slot released`);
      } catch (error) {
        console.error(`Error processing enrollment ${enrollment.id}:`, error);
        errors.push(enrollment.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} grace period expired enrollments`,
      total: gracePeriodExpired.length,
      processed,
      errors,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Grace period cron error:", error);
    return NextResponse.json(
      { error: "Failed to process grace period expiry" },
      { status: 500 }
    );
  }
}
