import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * CRON JOB: Send meeting reminders
 * Run every 30 minutes
 *
 * This cron job:
 * 1. Finds scheduled meetings starting in 30-60 minutes
 * 2. Sends reminder notifications to enrolled students
 */
export async function GET() {
  try {
    const now = new Date();
    const thirtyMinsLater = new Date(now.getTime() + 30 * 60 * 1000);
    const sixtyMinsLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Find upcoming meetings
    const upcomingMeetings = await prisma.scheduledMeeting.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: {
          gte: thirtyMinsLater,
          lte: sixtyMinsLater,
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
      },
    });

    console.log(`Found ${upcomingMeetings.length} upcoming meetings`);

    let notificationsSent = 0;
    const errors: string[] = [];

    for (const meeting of upcomingMeetings) {
      try {
        const minutesUntil = Math.ceil(
          (new Date(meeting.scheduledAt).getTime() - now.getTime()) /
            (60 * 1000)
        );

        for (const enrollment of meeting.section.enrollments) {
          try {
            await prisma.notification.create({
              data: {
                userId: enrollment.student.userId,
                title: "Meeting Segera Dimulai",
                message: `Kelas "${meeting.title}" akan dimulai dalam ${minutesUntil} menit. Jangan lupa bergabung!`,
                type: "CLASS",
                link: meeting.meetingUrl || undefined,
              },
            });
            notificationsSent++;
          } catch (notifError) {
            console.error(
              `Error creating notification for student ${enrollment.studentId}:`,
              notifError
            );
          }
        }

        console.log(
          `Sent reminders for meeting ${meeting.id} to ${meeting.section.enrollments.length} students`
        );
      } catch (error) {
        console.error(`Error processing meeting ${meeting.id}:`, error);
        errors.push(meeting.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${notificationsSent} meeting reminders`,
      meetingsProcessed: upcomingMeetings.length,
      notificationsSent,
      errors,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Meeting reminder cron error:", error);
    return NextResponse.json(
      { error: "Failed to process meeting reminders" },
      { status: 500 }
    );
  }
}
