import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/executive/reports
 * Get report data with filters for executive dashboard
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is EXECUTIVE
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== "EXECUTIVE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "revenue";
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const program = searchParams.get("program");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Date filters
    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    let data: any[] = [];
    let total = 0;

    switch (type) {
      case "revenue": {
        // Revenue report - payment data
        const where: any = { status: "PAID" };
        if (from || to) where.createdAt = dateFilter;

        const [payments, count] = await Promise.all([
          db.payment.findMany({
            where,
            include: {
              enrollment: {
                include: {
                  student: { include: { user: { select: { name: true } } } },
                  section: {
                    include: {
                      template: { select: { name: true, subject: true } },
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
          db.payment.count({ where }),
        ]);

        data = payments.map((p) => ({
          id: p.id,
          date: p.createdAt.toISOString(),
          program: p.enrollment.section.template.name,
          section: p.enrollment.section.sectionLabel,
          student: p.enrollment.student.user.name,
          amount: p.amount,
          status: p.status,
          method: p.paymentMethod || "-",
        }));
        total = count;
        break;
      }

      case "enrollment": {
        // Enrollment report
        const where: any = {};
        if (from || to) where.enrolledAt = dateFilter;
        if (status) where.status = status;

        const [enrollments, count] = await Promise.all([
          db.enrollment.findMany({
            where,
            include: {
              student: {
                include: { user: { select: { name: true, email: true } } },
              },
              section: {
                include: {
                  template: { select: { name: true, subject: true } },
                },
              },
            },
            orderBy: { enrolledAt: "desc" },
            skip,
            take: limit,
          }),
          db.enrollment.count({ where }),
        ]);

        data = enrollments.map((e) => ({
          id: e.id,
          date: e.enrolledAt.toISOString(),
          student: e.student.user.name,
          email: e.student.user.email,
          program: e.section.template.name,
          section: e.section.sectionLabel,
          status: e.status,
          expiryDate: e.expiryDate?.toISOString() || null,
        }));
        total = count;
        break;
      }

      case "tutor": {
        // Tutor performance report
        const tutors = await db.tutorProfile.findMany({
          include: {
            user: { select: { name: true, email: true, avatar: true } },
            sections: {
              where: { status: "ACTIVE" },
              include: {
                template: { select: { name: true } },
                enrollments: { where: { status: "ACTIVE" } },
                materials: { select: { id: true } },
                assignments: { select: { id: true } },
                meetings: { where: { status: "COMPLETED" } },
              },
            },
          },
        });

        data = tutors.map((t) => ({
          id: t.id,
          name: t.user.name,
          email: t.user.email,
          avatar: t.user.avatar,
          sections: t.sections.length,
          students: t.sections.reduce(
            (sum: number, s) => sum + s.enrollments.length,
            0
          ),
          materials: t.sections.reduce(
            (sum: number, s) => sum + s.materials.length,
            0
          ),
          assignments: t.sections.reduce(
            (sum: number, s) => sum + s.assignments.length,
            0
          ),
          completedMeetings: t.sections.reduce(
            (sum: number, s) => sum + s.meetings.length,
            0
          ),
        }));
        total = tutors.length;
        break;
      }

      case "program": {
        // Program performance report
        const templates = await db.classTemplate.findMany({
          include: {
            sections: {
              include: {
                enrollments: { where: { status: "ACTIVE" } },
                _count: {
                  select: { materials: true, assignments: true, quizzes: true },
                },
              },
            },
          },
        });

        // Get revenue per program
        const programRevenue: Record<string, number> = {};
        const payments = await db.payment.findMany({
          where: { status: "PAID" },
          include: {
            enrollment: {
              include: { section: { include: { template: true } } },
            },
          },
        });

        payments.forEach((p) => {
          const name = p.enrollment.section.template.name;
          programRevenue[name] = (programRevenue[name] || 0) + p.amount;
        });

        data = templates.map((t) => ({
          id: t.id,
          name: t.name,
          subject: t.subject,
          sections: t.sections.length,
          activeSections: t.sections.filter((s) => s.status === "ACTIVE")
            .length,
          students: t.sections.reduce(
            (sum, s) => sum + s.enrollments.length,
            0
          ),
          revenue: programRevenue[t.name] || 0,
          materials: t.sections.reduce((sum, s) => sum + s._count.materials, 0),
        }));
        total = templates.length;
        break;
      }
    }

    // Get programs for filter dropdown
    const programs = await db.classTemplate.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        programs: programs.map((p) => ({ id: p.id, name: p.name })),
      },
    });
  } catch (error) {
    console.error("GET /api/executive/reports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
