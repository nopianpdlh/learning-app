import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { InvoiceClient } from "@/components/features/student/InvoiceClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentInvoicePage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get student profile
  const studentProfile = await db.studentProfile.findUnique({
    where: { userId: user.id },
  });

  if (!studentProfile) {
    redirect("/login");
  }

  // Get invoice details
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      enrollment: {
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true, phone: true } },
            },
          },
          section: {
            include: {
              template: true,
              tutor: {
                include: { user: { select: { name: true } } },
              },
            },
          },
        },
      },
      payment: true,
    },
  });

  if (!invoice) {
    notFound();
  }

  // Verify student owns this invoice
  if (invoice.enrollment.studentId !== studentProfile.id) {
    redirect("/student/payments");
  }

  // Transform data
  const invoiceData = {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    createdAt: invoice.createdAt.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    paidAt: invoice.paidAt?.toISOString() || null,
    // Student info
    studentName: invoice.studentName,
    studentEmail: invoice.studentEmail,
    studentPhone: invoice.studentPhone,
    // Program info
    programName: invoice.programName,
    sectionLabel: invoice.sectionLabel,
    tutorName: invoice.enrollment.section?.tutor.user.name || "",
    // Period
    periodStart: invoice.periodStart.toISOString(),
    periodEnd: invoice.periodEnd.toISOString(),
    // Amount
    amount: invoice.amount,
    discount: invoice.discount,
    totalAmount: invoice.totalAmount,
    // Notes
    notes: invoice.notes,
    // Payment
    paymentStatus: invoice.payment?.status || null,
    paymentMethod: invoice.payment?.paymentMethod || null,
    enrollmentId: invoice.enrollmentId,
  };

  return <InvoiceClient invoice={invoiceData} />;
}
