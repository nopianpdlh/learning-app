import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PaymentClient } from "@/components/features/student/PaymentClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentPaymentPage({ params }: PageProps) {
  const { id } = await params; // id = enrollmentId

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

  // Get enrollment with payment details
  const enrollment = await db.enrollment.findUnique({
    where: { id },
    include: {
      section: {
        include: {
          template: true,
          tutor: {
            include: { user: { select: { name: true } } },
          },
        },
      },
      payment: true,
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!enrollment) {
    notFound();
  }

  // Verify student owns this enrollment
  if (enrollment.studentId !== studentProfile.id) {
    redirect("/student/sections");
  }

  // Transform data for client
  const paymentData = {
    enrollmentId: enrollment.id,
    enrollmentStatus: enrollment.status,
    program: {
      name: enrollment.section?.template.name || "Unknown Program",
      subject: enrollment.section?.template.subject || "",
      classType: enrollment.section?.template.classType || "",
      pricePerMonth: enrollment.section?.template.pricePerMonth || 0,
    },
    section: {
      label: enrollment.section?.sectionLabel || "",
      tutorName: enrollment.section?.tutor.user.name || "",
    },
    payment: enrollment.payment
      ? {
          id: enrollment.payment.id,
          amount: enrollment.payment.amount,
          status: enrollment.payment.status,
          snapToken: enrollment.payment.snapToken,
          redirectUrl: enrollment.payment.redirectUrl,
          expiredAt: enrollment.payment.expiredAt?.toISOString() || null,
          paidAt: enrollment.payment.paidAt?.toISOString() || null,
        }
      : null,
    invoice: enrollment.invoices[0]
      ? {
          id: enrollment.invoices[0].id,
          invoiceNumber: enrollment.invoices[0].invoiceNumber,
          amount: enrollment.invoices[0].totalAmount,
          dueDate: enrollment.invoices[0].dueDate.toISOString(),
          status: enrollment.invoices[0].status,
        }
      : null,
    periodStart: enrollment.startDate?.toISOString() || null,
    periodEnd: enrollment.expiryDate?.toISOString() || null,
  };

  return <PaymentClient paymentData={paymentData} />;
}
