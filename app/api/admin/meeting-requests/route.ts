import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

// GET - List all meeting requests for admin
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING";

    // Get meeting requests
    const requests = await db.scheduledMeeting.findMany({
      where: {
        requestedBy: { not: null },
        ...(status !== "ALL" && { requestStatus: status }),
      },
      include: {
        section: {
          include: {
            template: true,
            tutor: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get student info and availability check for each request
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const studentProfile = request.requestedBy
          ? await db.studentProfile.findUnique({
              where: { id: request.requestedBy },
              include: {
                user: { select: { name: true, email: true, phone: true } },
              },
            })
          : null;

        // Check tutor availability for requested time
        const requestedTime = new Date(request.scheduledAt);
        const dayOfWeek = requestedTime.getDay();
        const requestedHour = requestedTime.getHours();
        const requestedMinute = requestedTime.getMinutes();
        const requestedTimeStr = `${String(requestedHour).padStart(
          2,
          "0"
        )}:${String(requestedMinute).padStart(2, "0")}`;
        const endTimeDate = new Date(
          requestedTime.getTime() + request.duration * 60000
        );
        const endHour = endTimeDate.getHours();
        const endMinute = endTimeDate.getMinutes();
        const endTimeStr = `${String(endHour).padStart(2, "0")}:${String(
          endMinute
        ).padStart(2, "0")}`;

        const tutorAvailability = await db.tutorAvailability.findMany({
          where: {
            tutorId: request.section.tutorId,
            dayOfWeek,
            isActive: true,
          },
        });

        const isWithinAvailability = tutorAvailability.some((slot) => {
          return (
            requestedTimeStr >= slot.startTime && endTimeStr <= slot.endTime
          );
        });

        // Check for conflicts with other meetings
        const conflictMeeting = await db.scheduledMeeting.findFirst({
          where: {
            id: { not: request.id },
            section: { tutorId: request.section.tutorId },
            status: { in: ["SCHEDULED", "LIVE"] },
            OR: [
              { requestStatus: { in: ["PENDING", "APPROVED"] } },
              { requestStatus: null },
            ],
            AND: [
              { scheduledAt: { lte: endTimeDate } },
              {
                scheduledAt: {
                  gte: new Date(
                    requestedTime.getTime() - request.duration * 60000
                  ),
                },
              },
            ],
          },
        });

        return {
          ...request,
          student: studentProfile?.user || null,
          availabilityCheck: {
            isWithinAvailability,
            hasConflict: !!conflictMeeting,
            tutorAvailability: tutorAvailability.map((slot) => ({
              startTime: slot.startTime,
              endTime: slot.endTime,
            })),
          },
        };
      })
    );

    return NextResponse.json(enrichedRequests);
  } catch (error) {
    console.error("Error fetching meeting requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
