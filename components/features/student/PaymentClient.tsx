"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  IconArrowLeft,
  IconCreditCard,
  IconReceipt,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconLoader2,
  IconExternalLink,
} from "@tabler/icons-react";

declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        callbacks: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

interface PaymentData {
  enrollmentId: string;
  enrollmentStatus: string;
  program: {
    name: string;
    subject: string;
    classType: string;
    pricePerMonth: number;
  };
  section: {
    label: string;
    tutorName: string;
  };
  payment: {
    id: string;
    amount: number;
    status: string;
    snapToken: string | null;
    redirectUrl: string | null;
    expiredAt: string | null;
    paidAt: string | null;
  } | null;
  invoice: {
    id: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    status: string;
  } | null;
  periodStart: string | null;
  periodEnd: string | null;
}

interface PaymentClientProps {
  paymentData: PaymentData;
}

export function PaymentClient({ paymentData }: PaymentClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [snapReady, setSnapReady] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <IconCheck className="h-3 w-3 mr-1" /> Lunas
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <IconClock className="h-3 w-3 mr-1" /> Menunggu Pembayaran
          </Badge>
        );
      case "FAILED":
      case "EXPIRED":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <IconAlertCircle className="h-3 w-3 mr-1" />
            {status === "FAILED" ? "Gagal" : "Kadaluarsa"}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handlePayNow = () => {
    if (!paymentData.payment?.snapToken) {
      toast.error("Token pembayaran tidak tersedia");
      return;
    }

    if (!window.snap) {
      toast.error("Midtrans belum siap. Silakan refresh halaman.");
      return;
    }

    setIsLoading(true);

    window.snap.pay(paymentData.payment.snapToken, {
      onSuccess: (result) => {
        console.log("Payment success:", result);
        toast.success("Pembayaran berhasil!");
        router.push("/student/sections");
        router.refresh();
      },
      onPending: (result) => {
        console.log("Payment pending:", result);
        toast.info("Pembayaran sedang diproses");
        router.refresh();
      },
      onError: (result) => {
        console.error("Payment error:", result);
        toast.error("Pembayaran gagal");
        setIsLoading(false);
      },
      onClose: () => {
        console.log("Payment popup closed");
        setIsLoading(false);
      },
    });
  };

  const isExpired = paymentData.payment?.expiredAt
    ? new Date(paymentData.payment.expiredAt) < new Date()
    : false;

  const canPay =
    paymentData.payment?.status === "PENDING" &&
    paymentData.payment?.snapToken &&
    !isExpired;

  return (
    <>
      {/* Midtrans Snap.js */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        onReady={() => setSnapReady(true)}
      />

      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild>
          <Link href="/student/sections">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Kelas Saya
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <IconCreditCard className="h-5 w-5" />
                    Detail Pembayaran
                  </CardTitle>
                  {paymentData.payment &&
                    getStatusBadge(paymentData.payment.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Program Info */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-lg">
                    {paymentData.program.name}
                  </h3>
                  <p className="text-muted-foreground">
                    Section {paymentData.section.label} • Tutor:{" "}
                    {paymentData.section.tutorName}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">
                      {paymentData.program.subject}
                    </Badge>
                    <Badge variant="secondary">
                      {paymentData.program.classType === "PRIVATE"
                        ? "Private"
                        : "Semi-Private"}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Payment Details */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Biaya Bulanan</span>
                    <span className="font-medium">
                      {formatPrice(paymentData.program.pricePerMonth)}
                    </span>
                  </div>
                  {paymentData.periodStart && paymentData.periodEnd && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Periode</span>
                      <span className="font-medium">
                        {new Date(paymentData.periodStart).toLocaleDateString(
                          "id-ID"
                        )}{" "}
                        -{" "}
                        {new Date(paymentData.periodEnd).toLocaleDateString(
                          "id-ID"
                        )}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary">
                      {formatPrice(
                        paymentData.payment?.amount ||
                          paymentData.program.pricePerMonth
                      )}
                    </span>
                  </div>
                </div>

                {/* Expiry Warning */}
                {paymentData.payment?.expiredAt &&
                  paymentData.payment.status === "PENDING" && (
                    <div
                      className={`p-3 rounded-lg ${
                        isExpired
                          ? "bg-red-50 text-red-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      <p className="text-sm">
                        {isExpired ? (
                          <>
                            Pembayaran sudah kadaluarsa. Silakan hubungi admin
                            untuk membuat invoice baru.
                          </>
                        ) : (
                          <>
                            Batas waktu pembayaran:{" "}
                            {formatDate(paymentData.payment.expiredAt)}
                          </>
                        )}
                      </p>
                    </div>
                  )}

                {/* Payment Success */}
                {paymentData.payment?.status === "PAID" &&
                  paymentData.payment.paidAt && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-700">
                        <IconCheck className="h-5 w-5" />
                        <span className="font-medium">
                          Pembayaran berhasil!
                        </span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Dibayar pada: {formatDate(paymentData.payment.paidAt)}
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Invoice Card */}
            {paymentData.invoice && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconReceipt className="h-5 w-5" />
                    Invoice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Nomor Invoice
                      </span>
                      <span className="font-mono">
                        {paymentData.invoice.invoiceNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jatuh Tempo</span>
                      <span>{formatDate(paymentData.invoice.dueDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      {getStatusBadge(paymentData.invoice.status)}
                    </div>
                    <Separator />
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/student/invoice/${paymentData.invoice.id}`}>
                        <IconExternalLink className="mr-2 h-4 w-4" />
                        Lihat Invoice Lengkap
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Payment Action */}
          <div>
            <Card className="sticky top-6">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Pembayaran
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {formatPrice(
                        paymentData.payment?.amount ||
                          paymentData.program.pricePerMonth
                      )}
                    </p>
                  </div>

                  {canPay ? (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handlePayNow}
                      disabled={isLoading || !snapReady}
                    >
                      {isLoading ? (
                        <>
                          <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <IconCreditCard className="mr-2 h-4 w-4" />
                          Bayar Sekarang
                        </>
                      )}
                    </Button>
                  ) : paymentData.payment?.status === "PAID" ? (
                    <Button className="w-full bg-green-600" size="lg" disabled>
                      <IconCheck className="mr-2 h-4 w-4" />
                      Sudah Dibayar
                    </Button>
                  ) : (
                    <Button className="w-full" size="lg" disabled>
                      <IconAlertCircle className="mr-2 h-4 w-4" />
                      {isExpired ? "Kadaluarsa" : "Tidak Tersedia"}
                    </Button>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Pembayaran aman dengan Midtrans. Mendukung berbagai metode
                    pembayaran.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
