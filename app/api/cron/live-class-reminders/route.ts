/**
 * Cron Job: Send Live Class Reminders
 * Runs hourly to send H-1 (24h before) and H-0 (1h before) reminders
 *
 * Setup in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/live-class-reminders",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendLiveClassReminderH1, sendLiveClassReminderH0 } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Time windows for checking
    const h1Start = new Date(oneDayFromNow.getTime() - 30 * 60 * 1000); // 24h - 30min
    const h1End = new Date(oneDayFromNow.getTime() + 30 * 60 * 1000); // 24h + 30min

    const h0Start = new Date(oneHourFromNow.getTime() - 5 * 60 * 1000); // 1h - 5min
    const h0End = new Date(oneHourFromNow.getTime() + 5 * 60 * 1000); // 1h + 5min

    let h1Sent = 0;
    let h0Sent = 0;
    const errors: string[] = [];

    // =====================================
    // H-1 REMINDERS (24 hours before)
    // =====================================
    const h1LiveClasses = await db.liveClass.findMany({
      where: {
        scheduledAt: {
          gte: h1Start,
          lte: h1End,
        },
      },
      include: {
        class: {
          include: {
            enrollments: {
              where: {
                status: "ACTIVE",
              },
              include: {
                student: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log(`Found ${h1LiveClasses.length} live classes for H-1 reminders`);

    for (const liveClass of h1LiveClasses) {
      for (const enrollment of liveClass.class.enrollments) {
        try {
          await sendLiveClassReminderH1({
            to: enrollment.student.user.email,
            studentName: enrollment.student.user.name,
            className: liveClass.class.name,
            liveClassTitle: liveClass.title,
            scheduledAt: liveClass.scheduledAt,
            meetingUrl: liveClass.meetingUrl,
            duration: liveClass.duration,
          });

          // Create in-app notification
          await db.notification.create({
            data: {
              userId: enrollment.student.userId,
              title: "Pengingat Kelas Live Besok",
              message: `Kelas "${
                liveClass.title
              }" akan dimulai besok pada ${liveClass.scheduledAt.toLocaleString(
                "id-ID"
              )}`,
              type: "LIVE_CLASS",
            },
          });

          h1Sent++;
        } catch (error: any) {
          console.error(
            `Failed to send H-1 reminder to ${enrollment.student.user.email}:`,
            error
          );
          errors.push(`H-1 ${enrollment.student.user.email}: ${error.message}`);
        }
      }
    }

    // =====================================
    // H-0 REMINDERS (1 hour before)
    // =====================================
    const h0LiveClasses = await db.liveClass.findMany({
      where: {
        scheduledAt: {
          gte: h0Start,
          lte: h0End,
        },
      },
      include: {
        class: {
          include: {
            enrollments: {
              where: {
                status: "ACTIVE",
              },
              include: {
                student: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log(`Found ${h0LiveClasses.length} live classes for H-0 reminders`);

    for (const liveClass of h0LiveClasses) {
      for (const enrollment of liveClass.class.enrollments) {
        try {
          await sendLiveClassReminderH0({
            to: enrollment.student.user.email,
            studentName: enrollment.student.user.name,
            className: liveClass.class.name,
            liveClassTitle: liveClass.title,
            scheduledAt: liveClass.scheduledAt,
            meetingUrl: liveClass.meetingUrl,
            duration: liveClass.duration,
          });

          // Create in-app notification
          await db.notification.create({
            data: {
              userId: enrollment.student.userId,
              title: "⏰ Kelas Live dalam 1 Jam!",
              message: `Kelas "${liveClass.title}" akan dimulai dalam 1 jam. Bersiaplah!`,
              type: "LIVE_CLASS",
            },
          });

          h0Sent++;
        } catch (error: any) {
          console.error(
            `Failed to send H-0 reminder to ${enrollment.student.user.email}:`,
            error
          );
          errors.push(`H-0 ${enrollment.student.user.email}: ${error.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        h1Sent,
        h0Sent,
        totalSent: h1Sent + h0Sent,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error: any) {
    console.error("Live class reminders cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
