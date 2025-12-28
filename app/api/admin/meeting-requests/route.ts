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

    // Get student info for each request
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

        return {
          ...request,
          student: studentProfile?.user || null,
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
