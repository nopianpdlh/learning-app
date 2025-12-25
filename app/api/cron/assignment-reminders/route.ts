// /**
//  * Cron Job: Send Assignment Due Reminders
//  * Runs every 6 hours to send reminders for assignments due in 24h or 6h
//  *
//  * Setup in vercel.json:
//  * {
//  *   "crons": [{
//  *     "path": "/api/cron/assignment-reminders",
//  *     "schedule": "0 */6 * * *"
// //  *   }]
// //  * }
// //  */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendAssignmentDueReminder } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const twentyFourHoursFromNow = new Date(
      now.getTime() + 24 * 60 * 60 * 1000
    );
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

    let sent = 0;
    const errors: string[] = [];

    // =====================================
    // 24-HOUR REMINDERS
    // =====================================
    const h24Window = {
      start: new Date(twentyFourHoursFromNow.getTime() - 30 * 60 * 1000),
      end: new Date(twentyFourHoursFromNow.getTime() + 30 * 60 * 1000),
    };

    const assignments24h = await db.assignment.findMany({
      where: {
        status: "PUBLISHED",
        dueDate: {
          gte: h24Window.start,
          lte: h24Window.end,
        },
      },
      include: {
        section: {
          include: {
            template: true,
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
        submissions: true,
      },
    });

    console.log(`Found ${assignments24h.length} assignments due in 24h`);

    for (const assignment of assignments24h) {
      for (const enrollment of assignment.section.enrollments) {
        // Check if student already submitted
        const hasSubmitted = assignment.submissions.some(
          (sub) => sub.studentId === enrollment.studentId
        );

        if (hasSubmitted) continue;

        try {
          await sendAssignmentDueReminder({
            to: enrollment.student.user.email,
            studentName: enrollment.student.user.name,
            assignmentTitle: assignment.title,
            className: assignment.section.template.name,
            dueDate: assignment.dueDate,
            assignmentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/student/sections/${assignment.sectionId}/assignments/${assignment.id}`,
            hoursUntilDue: 24,
          });

          // Create in-app notification
          await db.notification.create({
            data: {
              userId: enrollment.student.userId,
              title: "Pengingat: Tugas Deadline Besok",
              message: `Tugas "${assignment.title}" akan jatuh tempo besok. Jangan lupa kumpulkan!`,
              type: "ASSIGNMENT",
            },
          });

          sent++;
        } catch (error: any) {
          console.error(
            `Failed to send 24h reminder to ${enrollment.student.user.email}:`,
            error
          );
          errors.push(`24h ${enrollment.student.user.email}: ${error.message}`);
        }
      }
    }

    // =====================================
    // 6-HOUR REMINDERS (URGENT)
    // =====================================
    const h6Window = {
      start: new Date(sixHoursFromNow.getTime() - 15 * 60 * 1000),
      end: new Date(sixHoursFromNow.getTime() + 15 * 60 * 1000),
    };

    const assignments6h = await db.assignment.findMany({
      where: {
        status: "PUBLISHED",
        dueDate: {
          gte: h6Window.start,
          lte: h6Window.end,
        },
      },
      include: {
        section: {
          include: {
            template: true,
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
        submissions: true,
      },
    });

    console.log(`Found ${assignments6h.length} assignments due in 6h`);

    for (const assignment of assignments6h) {
      for (const enrollment of assignment.section.enrollments) {
        const hasSubmitted = assignment.submissions.some(
          (sub) => sub.studentId === enrollment.studentId
        );

        if (hasSubmitted) continue;

        try {
          await sendAssignmentDueReminder({
            to: enrollment.student.user.email,
            studentName: enrollment.student.user.name,
            assignmentTitle: assignment.title,
            className: assignment.section.template.name,
            dueDate: assignment.dueDate,
            assignmentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/student/sections/${assignment.sectionId}/assignments/${assignment.id}`,
            hoursUntilDue: 6,
          });

          // Create in-app notification
          await db.notification.create({
            data: {
              userId: enrollment.student.userId,
              title: "🚨 URGENT: Tugas Deadline 6 Jam Lagi!",
              message: `Tugas "${assignment.title}" akan jatuh tempo dalam 6 jam. Segera kumpulkan!`,
              type: "ASSIGNMENT",
            },
          });

          sent++;
        } catch (error: any) {
          console.error(
            `Failed to send 6h reminder to ${enrollment.student.user.email}:`,
            error
          );
          errors.push(`6h ${enrollment.student.user.email}: ${error.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        sent,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error: any) {
    console.error("Assignment reminders cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
