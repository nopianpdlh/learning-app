"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Send,
  DollarSign,
  AlertCircle,
} from "lucide-react";

// Types
interface Invoice {
  id: string;
  invoiceNumber: string;
  enrollmentId: string;
  paymentId: string | null;
  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  programName: string;
  sectionLabel: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  amount: number;
  tax: number;
  discount: number;
  totalAmount: number;
  status: "UNPAID" | "PAID" | "OVERDUE" | "CANCELLED";
  dueDate: Date | string;
  paidAt: Date | string | null;
  createdAt: Date | string;
  payment: {
    id: string;
    status: string;
    paymentType: string | null;
    redirectUrl: string | null;
  } | null;
}

interface InvoiceManagementClientProps {
  invoices: Invoice[];
}

export default function InvoiceManagementClient({
  invoices: initialInvoices,
}: InvoiceManagementClientProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.programName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    unpaid: invoices.filter((i) => i.status === "UNPAID").length,
    paid: invoices.filter((i) => i.status === "PAID").length,
    overdue: invoices.filter((i) => i.status === "OVERDUE").length,
    totalPaid: invoices
      .filter((i) => i.status === "PAID")
      .reduce((sum, i) => sum + i.totalAmount, 0),
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateInput: Date | string | null) => {
    if (!dateInput) return "-";
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UNPAID":
        return <Badge className="bg-yellow-100 text-yellow-800">Unpaid</Badge>;
      case "PAID":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "OVERDUE":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case "CANCELLED":
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleResendInvoice = async (invoice: Invoice) => {
    setIsLoading(true);
    try {
      // Create new payment if not exists
      if (!invoice.payment) {
        const response = await fetch("/api/payments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enrollmentId: invoice.enrollmentId }),
        });

        if (!response.ok) throw new Error("Failed to create payment");

        toast.success("Payment link created. Email sent to student.");
      } else {
        toast.success("Invoice resent to student.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengirim invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvoice = async (invoice: Invoice) => {
    if (!confirm(`Batalkan invoice ${invoice.invoiceNumber}?`)) return;

    try {
      const response = await fetch(`/api/admin/invoices/${invoice.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to cancel invoice");

      setInvoices(
        invoices.map((i) =>
          i.id === invoice.id ? { ...i, status: "CANCELLED" as const } : i
        )
      );
      toast.success("Invoice dibatalkan");
      setIsDetailDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Gagal membatalkan invoice");
    }
  };

  const openDetailDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0A2647]">Manajemen Invoice</h1>
        <p className="text-muted-foreground">Lihat dan kelola semua invoice</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unpaid</p>
                <p className="text-2xl font-bold">{stats.unpaid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold">{stats.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#0A2647]/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-[#0A2647]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-xl font-bold">
                  {formatPrice(stats.totalPaid)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari invoice, nama, atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Siswa</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Tidak ada invoice
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">
                          {invoice.invoiceNumber}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{invoice.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.studentEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{invoice.programName}</p>
                        <p className="text-sm text-muted-foreground">
                          Section {invoice.sectionLabel}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(invoice.periodStart)} -{" "}
                      {formatDate(invoice.periodEnd)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(invoice.totalAmount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(invoice.dueDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDetailDialog(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {invoice.status === "UNPAID" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResendInvoice(invoice)}
                            disabled={isLoading}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Detail Invoice</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-mono text-lg">
                  {selectedInvoice.invoiceNumber}
                </span>
                {getStatusBadge(selectedInvoice.status)}
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Siswa</span>
                  <span>{selectedInvoice.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{selectedInvoice.studentEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Program</span>
                  <span>{selectedInvoice.programName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Section</span>
                  <span>{selectedInvoice.sectionLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Periode</span>
                  <span>
                    {formatDate(selectedInvoice.periodStart)} -{" "}
                    {formatDate(selectedInvoice.periodEnd)}
                  </span>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(selectedInvoice.amount)}</span>
                </div>
                {selectedInvoice.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatPrice(selectedInvoice.tax)}</span>
                  </div>
                )}
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(selectedInvoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatPrice(selectedInvoice.totalAmount)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p>{formatDate(selectedInvoice.dueDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Paid At</p>
                  <p>{formatDate(selectedInvoice.paidAt)}</p>
                </div>
              </div>

              {selectedInvoice.status === "UNPAID" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleCancelInvoice(selectedInvoice)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Batalkan
                  </Button>
                  {selectedInvoice.payment?.redirectUrl && (
                    <Button
                      className="flex-1 bg-[#FFB800] hover:bg-[#e6a600] text-black"
                      onClick={() =>
                        window.open(
                          selectedInvoice.payment!.redirectUrl!,
                          "_blank"
                        )
                      }
                    >
                      Buka Link Pembayaran
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
