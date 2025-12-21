"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  IconArrowLeft,
  IconDownload,
  IconPrinter,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconCreditCard,
  IconLoader2,
} from "@tabler/icons-react";

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  status: string;
  createdAt: string;
  dueDate: string;
  paidAt: string | null;
  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  programName: string;
  sectionLabel: string;
  tutorName: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  discount: number;
  totalAmount: number;
  notes: string | null;
  paymentStatus: string | null;
  paymentMethod: string | null;
  enrollmentId: string;
}

interface InvoiceClientProps {
  invoice: InvoiceData;
}

export function InvoiceClient({ invoice }: InvoiceClientProps) {
  const [isClient, setIsClient] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
      case "OVERDUE":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <IconAlertCircle className="h-3 w-3 mr-1" /> Jatuh Tempo
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Dibatalkan
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!isClient) return;

    setIsGeneratingPdf(true);
    try {
      // Dynamic import to avoid SSR issues
      const { pdf } = await import("@react-pdf/renderer");
      const { InvoicePDF } = await import(
        "@/components/features/student/InvoicePDF"
      );

      const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal membuat PDF. Silakan coba lagi.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/student/payments">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <IconPrinter className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || !isClient}
          >
            {isGeneratingPdf ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <IconDownload className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Invoice Card */}
      <Card className="max-w-4xl mx-auto" id="invoice-content">
        <CardHeader className="border-b">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-primary">INVOICE</h1>
              <p className="text-lg font-mono mt-1">{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">Tutor Nomor Satu</p>
              <p className="text-sm text-muted-foreground">
                Platform E-Learning
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Status & Dates */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {getStatusBadge(invoice.status)}
              {invoice.paidAt && (
                <span className="text-sm text-green-600">
                  Dibayar: {formatDate(invoice.paidAt)}
                </span>
              )}
            </div>
            <div className="text-right text-sm">
              <p>Tanggal: {formatDate(invoice.createdAt)}</p>
              <p className="text-muted-foreground">
                Jatuh Tempo: {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Bill To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                Ditagihkan Kepada
              </h3>
              <p className="font-medium">{invoice.studentName}</p>
              <p className="text-sm text-muted-foreground">
                {invoice.studentEmail}
              </p>
              {invoice.studentPhone && (
                <p className="text-sm text-muted-foreground">
                  {invoice.studentPhone}
                </p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                Detail Program
              </h3>
              <p className="font-medium">{invoice.programName}</p>
              <p className="text-sm text-muted-foreground">
                Section {invoice.sectionLabel} • Tutor: {invoice.tutorName}
              </p>
              <p className="text-sm text-muted-foreground">
                Periode: {formatDate(invoice.periodStart)} -{" "}
                {formatDate(invoice.periodEnd)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div>
            <h3 className="font-semibold mb-4">Rincian</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium">
                    Deskripsi
                  </th>
                  <th className="text-right py-2 text-sm font-medium">
                    Jumlah
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3">
                    <p className="font-medium">{invoice.programName}</p>
                    <p className="text-sm text-muted-foreground">
                      Biaya bulanan - Section {invoice.sectionLabel}
                    </p>
                  </td>
                  <td className="py-3 text-right">
                    {formatPrice(invoice.amount)}
                  </td>
                </tr>
                {invoice.discount > 0 && (
                  <tr className="border-b">
                    <td className="py-3 text-green-600">Diskon</td>
                    <td className="py-3 text-right text-green-600">
                      -{formatPrice(invoice.discount)}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td className="py-4 font-bold text-lg">Total</td>
                  <td className="py-4 text-right font-bold text-lg text-primary">
                    {formatPrice(invoice.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  Catatan
                </h3>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            </>
          )}

          {/* Payment Action */}
          {invoice.status === "PENDING" && (
            <>
              <Separator />
              <div className="flex justify-center print:hidden">
                <Button size="lg" asChild>
                  <Link href={`/student/payment/${invoice.enrollmentId}`}>
                    <IconCreditCard className="mr-2 h-4 w-4" />
                    Bayar Sekarang
                  </Link>
                </Button>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-6 border-t">
            <p>Terima kasih atas kepercayaan Anda!</p>
            <p>Jika ada pertanyaan, silakan hubungi admin@tutornomorsatu.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
