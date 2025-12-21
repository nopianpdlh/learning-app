import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PaymentHistoryClient } from "@/components/features/student/PaymentHistoryClient";

export default async function StudentPaymentsPage() {
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

  // Get all payments for this student
  const enrollments = await db.enrollment.findMany({
    where: { studentId: studentProfile.id },
    include: {
      section: {
        include: {
          template: true,
        },
      },
      payment: true,
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Transform data
  const paymentsData = enrollments
    .filter((e) => e.payment)
    .map((enrollment) => ({
      id: enrollment.payment!.id,
      enrollmentId: enrollment.id,
      programName: enrollment.section?.template.name || "Unknown Program",
      sectionLabel: enrollment.section?.sectionLabel || "",
      amount: enrollment.payment!.amount,
      status: enrollment.payment!.status,
      paymentMethod: enrollment.payment!.paymentMethod,
      createdAt: enrollment.payment!.createdAt.toISOString(),
      paidAt: enrollment.payment!.paidAt?.toISOString() || null,
      expiredAt: enrollment.payment!.expiredAt?.toISOString() || null,
      invoiceNumber: enrollment.invoices[0]?.invoiceNumber || null,
      invoiceId: enrollment.invoices[0]?.id || null,
    }));

  return <PaymentHistoryClient payments={paymentsData} />;
}
