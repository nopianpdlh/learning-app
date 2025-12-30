"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentStatus {
  enrollment: {
    id: string;
    status: string;
    class: {
      name: string;
      subject: string;
      thumbnail: string;
    };
  };
  payment: {
    id: string;
    amount: number;
    status: string;
    paymentMethod: string;
    paymentUrl: string | null;
    paidAt: string | null;
  };
}

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const enrollmentId = searchParams.get("enrollmentId");

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const fetchPaymentStatus = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const response = await fetch(
        `/api/payments/status?enrollmentId=${enrollmentId}`
      );
      if (!response.ok) throw new Error("Gagal mengambil status pembayaran");

      const data = await response.json();
      setStatus(data);
    } catch (err: unknown) {
      if (!silent)
        setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (enrollmentId) {
      fetchPaymentStatus();

      // Auto-refresh every 5 seconds to check payment status
      const interval = setInterval(() => {
        fetchPaymentStatus(true);
      }, 5000);

      return () => clearInterval(interval);
    } else {
      setError("ID enrollment tidak ditemukan");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollmentId]);

  const handleCheckStatus = async () => {
    setChecking(true);
    await fetchPaymentStatus();
    setChecking(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const getStatusInfo = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "PAID":
        return {
          icon: "✅",
          title: "Pembayaran Berhasil",
          description:
            "Pembayaran Anda telah dikonfirmasi. Anda sekarang dapat mengakses kelas ini.",
          color: "bg-green-50 border-green-200 text-green-800",
          buttonText: "Buka Dashboard",
          buttonAction: () => router.push("/student/dashboard"),
        };
      case "PENDING":
        return {
          icon: "⏳",
          title: "Menunggu Pembayaran",
          description:
            "Silakan selesaikan pembayaran Anda. Status akan diperbarui secara otomatis.",
          color: "bg-yellow-50 border-yellow-200 text-yellow-800",
          buttonText: "Bayar Sekarang",
          buttonAction: () => {
            if (status?.payment.paymentUrl) {
              window.location.href = status.payment.paymentUrl;
            }
          },
        };
      case "FAILED":
        return {
          icon: "❌",
          title: "Pembayaran Gagal",
          description: "Pembayaran tidak dapat diproses. Silakan coba lagi.",
          color: "bg-red-50 border-red-200 text-red-800",
          buttonText: "Coba Lagi",
          buttonAction: () => router.push("/student/sections"),
        };
      default:
        return {
          icon: "❓",
          title: "Status Tidak Diketahui",
          description: "Status pembayaran tidak dapat ditentukan.",
          color: "bg-gray-50 border-gray-200 text-gray-800",
          buttonText: "Kembali",
          buttonAction: () => router.push("/student/dashboard"),
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat status pembayaran...</p>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Terjadi Kesalahan
            </h1>
            <p className="text-gray-600 mb-6">
              {error || "Data tidak ditemukan"}
            </p>
            <Button onClick={() => router.push("/student/dashboard")}>
              Kembali ke Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(status.payment.status);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Status Card */}
        <Card className={`p-8 mb-6 border-2 ${statusInfo.color}`}>
          <div className="text-center">
            <div className="text-6xl mb-4">{statusInfo.icon}</div>
            <h1 className="text-3xl font-bold mb-2">{statusInfo.title}</h1>
            <p className="text-lg mb-6">{statusInfo.description}</p>

            {status.payment.status === "PENDING" && (
              <div className="bg-white rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-600 mb-2">
                  💡 <strong>Tips:</strong> Status pembayaran akan diperbarui
                  secara otomatis setiap 5 detik. Jangan menutup halaman ini
                  sampai pembayaran selesai.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Payment Details */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Detail Pembayaran</h2>

          <div className="space-y-4">
            {/* Class Info */}
            <div className="flex items-start gap-4">
              {status.enrollment.class.thumbnail && (
                <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={status.enrollment.class.thumbnail}
                    alt={status.enrollment.class.name}
                    fill
                    className="object-cover object-top"
                  />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">
                  {status.enrollment.class.name}
                </h3>
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {status.enrollment.class.subject}
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <table className="w-full">
                <tbody className="space-y-2">
                  <tr>
                    <td className="text-gray-600 py-2">Jumlah Pembayaran</td>
                    <td className="text-right font-semibold text-xl text-blue-600">
                      {formatCurrency(status.payment.amount)}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 py-2">Metode Pembayaran</td>
                    <td className="text-right font-medium">
                      {status.payment.paymentMethod}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 py-2">Status Pembayaran</td>
                    <td className="text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          status.payment.status === "PAID"
                            ? "bg-green-100 text-green-800"
                            : status.payment.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {status.payment.status === "PAID"
                          ? "Lunas"
                          : status.payment.status === "PENDING"
                          ? "Menunggu"
                          : "Gagal"}
                      </span>
                    </td>
                  </tr>
                  {status.payment.paidAt && (
                    <tr>
                      <td className="text-gray-600 py-2">Tanggal Pembayaran</td>
                      <td className="text-right font-medium">
                        {new Date(status.payment.paidAt).toLocaleDateString(
                          "id-ID",
                          {
                            dateStyle: "long",
                          }
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={statusInfo.buttonAction}
            className="flex-1"
            size="lg"
          >
            {statusInfo.buttonText}
          </Button>

          {status.payment.status === "PENDING" && (
            <Button
              onClick={handleCheckStatus}
              variant="outline"
              size="lg"
              disabled={checking}
            >
              {checking ? "Memeriksa..." : "🔄 Cek Status"}
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Butuh bantuan? Hubungi kami melalui WhatsApp atau email.</p>
        </div>
      </div>
    </div>
  );
}

function PaymentStatusSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 mb-6">
          <div className="text-center">
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-64 mx-auto mb-2" />
            <Skeleton className="h-4 w-80 mx-auto" />
          </div>
        </Card>
        <Card className="p-6 mb-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<PaymentStatusSkeleton />}>
      <PaymentStatusContent />
    </Suspense>
  );
}
