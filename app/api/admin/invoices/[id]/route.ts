import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Get single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        payment: true,
        enrollment: {
          include: {
            student: {
              include: { user: true },
            },
            section: {
              include: { template: true },
            },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

// PATCH - Update invoice
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.discount !== undefined) {
      updateData.discount = body.discount;
      // Recalculate total
      const invoice = await prisma.invoice.findUnique({ where: { id } });
      if (invoice) {
        updateData.totalAmount = invoice.amount + invoice.tax - body.discount;
      }
    }
    if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate);

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Failed to update invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json(
        { error: "Cannot cancel paid invoice" },
        { status: 400 }
      );
    }

    // Cancel invoice
    await prisma.invoice.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    // Cancel associated payment if exists
    if (invoice.payment) {
      await prisma.payment.update({
        where: { id: invoice.payment.id },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to cancel invoice:", error);
    return NextResponse.json(
      { error: "Failed to cancel invoice" },
      { status: 500 }
    );
  }
}
