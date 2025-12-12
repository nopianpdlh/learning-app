"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconSearch,
  IconReceipt,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconExternalLink,
  IconCreditCard,
} from "@tabler/icons-react";

interface PaymentRecord {
  id: string;
  enrollmentId: string;
  programName: string;
  sectionLabel: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  paidAt: string | null;
  expiredAt: string | null;
  invoiceNumber: string | null;
  invoiceId: string | null;
}

interface PaymentHistoryClientProps {
  payments: PaymentRecord[];
}

export function PaymentHistoryClient({ payments }: PaymentHistoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

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
      month: "short",
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
            <IconClock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <IconAlertCircle className="h-3 w-3 mr-1" /> Gagal
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <IconAlertCircle className="h-3 w-3 mr-1" /> Kadaluarsa
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: payments.length,
    paid: payments.filter((p) => p.status === "PAID").length,
    pending: payments.filter((p) => p.status === "PENDING").length,
    totalAmount: payments
      .filter((p) => p.status === "PAID")
      .reduce((acc, p) => acc + p.amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Riwayat Pembayaran</h1>
        <p className="text-muted-foreground">
          Lihat semua riwayat pembayaran dan invoice Anda
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <IconCreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transaksi</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <IconCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lunas</p>
                <p className="text-2xl font-bold">{stats.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <IconClock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <IconReceipt className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Dibayar</p>
                <p className="text-lg font-bold">
                  {formatPrice(stats.totalAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari program atau invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="PAID">Lunas</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Gagal</SelectItem>
                <SelectItem value="EXPIRED">Kadaluarsa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <IconReceipt className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                Belum ada riwayat pembayaran
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.programName}</p>
                        <p className="text-sm text-muted-foreground">
                          Section {payment.sectionLabel}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {payment.invoiceNumber || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{formatDate(payment.createdAt)}</p>
                        {payment.paidAt && (
                          <p className="text-sm text-green-600">
                            Dibayar: {formatDate(payment.paidAt)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(payment.amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {payment.status === "PENDING" && (
                          <Button size="sm" asChild>
                            <Link
                              href={`/student/payment/${payment.enrollmentId}`}
                            >
                              Bayar
                            </Link>
                          </Button>
                        )}
                        {payment.invoiceId && (
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/student/invoice/${payment.invoiceId}`}
                            >
                              <IconExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
