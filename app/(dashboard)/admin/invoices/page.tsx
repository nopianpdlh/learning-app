import { prisma } from "@/lib/db";
import InvoiceManagementClient from "@/components/features/admin/InvoiceManagementClient";

export default async function AdminInvoicesPage() {
  // Fetch all invoices with payment info
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      payment: {
        select: {
          id: true,
          status: true,
          paymentType: true,
          redirectUrl: true,
        },
      },
    },
  });

  return <InvoiceManagementClient invoices={invoices} />;
}
