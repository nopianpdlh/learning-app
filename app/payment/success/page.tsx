import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    order_id?: string;
    status_code?: string;
    transaction_status?: string;
  }>;
}

export default async function PaymentSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { order_id, status_code, transaction_status } = params;

  // Determine status
  const isSuccess =
    transaction_status === "settlement" || transaction_status === "capture";
  const isPending = transaction_status === "pending";
  const isFailed =
    transaction_status === "deny" ||
    transaction_status === "cancel" ||
    transaction_status === "expire";

  const getStatusContent = () => {
    if (isSuccess) {
      return {
        icon: <CheckCircle className="h-16 w-16 text-green-500" />,
        title: "Pembayaran Berhasil! 🎉",
        description: "Terima kasih! Pembayaran Anda telah berhasil diproses.",
        color: "bg-green-50 border-green-200",
      };
    }
    if (isPending) {
      return {
        icon: <Clock className="h-16 w-16 text-yellow-500" />,
        title: "Menunggu Pembayaran",
        description:
          "Pembayaran Anda sedang diproses. Silakan selesaikan pembayaran sesuai instruksi.",
        color: "bg-yellow-50 border-yellow-200",
      };
    }
    if (isFailed) {
      return {
        icon: <XCircle className="h-16 w-16 text-red-500" />,
        title: "Pembayaran Gagal",
        description: "Maaf, pembayaran Anda tidak berhasil. Silakan coba lagi.",
        color: "bg-red-50 border-red-200",
      };
    }
    return {
      icon: <AlertCircle className="h-16 w-16 text-gray-500" />,
      title: "Status Pembayaran",
      description: "Silakan cek status pembayaran di halaman Kelas Saya.",
      color: "bg-gray-50 border-gray-200",
    };
  };

  const status = getStatusContent();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className={`max-w-md w-full ${status.color}`}>
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          <div className="flex justify-center">{status.icon}</div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{status.title}</h1>
            <p className="text-muted-foreground">{status.description}</p>
          </div>

          {order_id && (
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-mono font-medium">{order_id}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <Button asChild size="lg">
              <Link href="/student/sections">Lihat Kelas Saya</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/student/payments">Riwayat Pembayaran</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
