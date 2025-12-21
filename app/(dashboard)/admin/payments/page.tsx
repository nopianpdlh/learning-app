import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { PaymentManagementClient } from "@/components/features/admin/PaymentManagementClient";

async function getPayments() {
  const payments = await db.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      enrollment: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
          section: {
            include: {
              template: true,
            },
          },
        },
      },
    },
  });

  // Convert dates to serializable format for client component
  return payments.map((payment) => ({
    ...payment,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    paidAt: payment.paidAt?.toISOString() ?? null,
  }));
}

async function getPaymentStats() {
  const [
    totalRevenue,
    completedPayments,
    pendingPayments,
    pendingRevenue,
    failedPayments,
    recentRevenue,
  ] = await Promise.all([
    db.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PAID" },
    }),
    db.payment.count({ where: { status: "PAID" } }),
    db.payment.count({ where: { status: "PENDING" } }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PENDING" },
    }),
    db.payment.count({ where: { status: "FAILED" } }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: "PAID",
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
    }),
  ]);

  return {
    totalRevenue: totalRevenue._sum?.amount ?? 0,
    completedPayments,
    pendingPayments,
    pendingRevenue: pendingRevenue._sum?.amount ?? 0,
    failedPayments,
    recentRevenue: recentRevenue._sum?.amount ?? 0,
  };
}

export default async function AdminPayments() {
  const payments = await getPayments();
  const stats = await getPaymentStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Payment Management
        </h1>
        <p className="text-muted-foreground">
          Track and manage all payment transactions
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" suppressHydrationWarning>
              Rp {stats.totalRevenue.toLocaleString("id-ID")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedPayments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {" "}
              Rp {stats.pendingRevenue.toLocaleString("id-ID")}
            </div>
            <p
              className="text-xs text-muted-foreground mt-1"
              suppressHydrationWarning
            >
              {stats.pendingPayments} transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" suppressHydrationWarning>
              Rp {stats.recentRevenue.toLocaleString("id-ID")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table with Client-side Features */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments ({payments.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PaymentManagementClient payments={payments} />
        </CardContent>
      </Card>
    </div>
  );
}
