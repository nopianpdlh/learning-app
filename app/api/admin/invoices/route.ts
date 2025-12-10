import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/midtrans";

// GET - List all invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          payment: {
            select: {
              id: true,
              status: true,
              paymentType: true,
              paidAt: true,
            },
          },
          enrollment: {
            select: {
              id: true,
              status: true,
              section: {
                select: {
                  sectionLabel: true,
                  template: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

// POST - Create invoice manually (for renewal, etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { enrollmentId, amount, dueDate, notes } = body;

    if (!enrollmentId || !amount) {
      return NextResponse.json(
        { error: "enrollmentId and amount are required" },
        { status: 400 }
      );
    }

    // Get enrollment details
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: {
          include: { user: true },
        },
        section: {
          include: { template: true },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    if (!enrollment.section) {
      return NextResponse.json(
        { error: "Enrollment has no section" },
        { status: 400 }
      );
    }

    const invoiceNumber = generateInvoiceNumber();
    const now = new Date();
    const defaultDueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        enrollmentId,
        studentName: enrollment.student.user.name,
        studentEmail: enrollment.student.user.email,
        studentPhone: enrollment.student.user.phone,
        programName: enrollment.section.template.name,
        sectionLabel: enrollment.section.sectionLabel,
        periodStart: now,
        periodEnd,
        amount,
        totalAmount: amount,
        dueDate: dueDate ? new Date(dueDate) : defaultDueDate,
        notes,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Failed to create invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
