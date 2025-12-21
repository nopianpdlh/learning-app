"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Download,
  Eye,
  CalendarIcon,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  FileDown,
  User,
  CreditCard,
  Clock,
  Receipt,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PaymentData {
  id: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  enrollment: {
    student: {
      user: {
        name: string;
      };
    };
    section: {
      template: {
        name: string;
      };
    };
  };
}

interface PaymentManagementClientProps {
  payments: PaymentData[];
}

export function PaymentManagementClient({
  payments,
}: PaymentManagementClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const itemsPerPage = 10;

  // Export functions
  const exportToCSV = () => {
    const csvData = filteredPayments.map((payment) => ({
      "Payment ID": payment.id,
      Student: payment.enrollment.student.user.name,
      Class: payment.enrollment.section.template.name,
      Amount: payment.amount,
      Method: payment.paymentMethod,
      Status: payment.status,
      Date: format(new Date(payment.createdAt), "yyyy-MM-dd HH:mm:ss"),
    }));

    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, `payments_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
  };

  const exportToExcel = () => {
    const excelData = filteredPayments.map((payment) => ({
      "Payment ID": payment.id,
      Student: payment.enrollment.student.user.name,
      Class: payment.enrollment.section.template.name,
      Amount: payment.amount,
      Method: payment.paymentMethod,
      Status: payment.status,
      Date: format(new Date(payment.createdAt), "yyyy-MM-dd HH:mm:ss"),
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(
      wb,
      `payments_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`
    );
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text("Payment Report", 14, 20);

    // Add filter info
    doc.setFontSize(10);
    let yPos = 30;
    if (statusFilter !== "ALL") {
      doc.text(`Status: ${statusFilter}`, 14, yPos);
      yPos += 5;
    }
    if (startDate) {
      doc.text(`From: ${format(startDate, "yyyy-MM-dd")}`, 14, yPos);
      yPos += 5;
    }
    if (endDate) {
      doc.text(`To: ${format(endDate, "yyyy-MM-dd")}`, 14, yPos);
      yPos += 5;
    }
    doc.text(
      `Generated: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`,
      14,
      yPos
    );
    yPos += 5;
    doc.text(`Total Records: ${filteredPayments.length}`, 14, yPos);

    // Add table
    const tableData = filteredPayments.map((payment) => [
      payment.id.slice(0, 8) + "...",
      payment.enrollment.student.user.name,
      payment.enrollment.section.template.name,
      `Rp ${payment.amount.toLocaleString("id-ID")}`,
      payment.paymentMethod,
      payment.status,
      format(new Date(payment.createdAt), "yyyy-MM-dd"),
    ]);

    autoTable(doc, {
      startY: yPos + 5,
      head: [["ID", "Student", "Class", "Amount", "Method", "Status", "Date"]],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Add summary
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 10;
    const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    doc.setFontSize(10);
    doc.text(
      `Total Amount: Rp ${totalAmount.toLocaleString("id-ID")}`,
      14,
      finalY + 10
    );

    doc.save(`payment_report_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`);
  };

  // Filter payments based on search, status, and date range
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.enrollment.student.user.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      payment.enrollment.section.template.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || payment.status === statusFilter;

    // Date range filter
    const paymentDate = new Date(payment.createdAt);
    const matchesStartDate = !startDate || paymentDate >= startDate;
    const matchesEndDate =
      !endDate || paymentDate <= new Date(endDate.setHours(23, 59, 59, 999));

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by payment ID, student, or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filters */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[140px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "MMM dd") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[140px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "MMM dd") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
              >
                Clear Dates
              </Button>
            )}

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white">
                <DropdownMenuItem onClick={exportToCSV}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Active Filters Display */}
        {(statusFilter !== "ALL" || startDate || endDate) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Active filters:</span>
            {statusFilter !== "ALL" && (
              <Badge variant="secondary">Status: {statusFilter}</Badge>
            )}
            {startDate && (
              <Badge variant="secondary">
                From: {format(startDate, "MMM dd, yyyy")}
              </Badge>
            )}
            {endDate && (
              <Badge variant="secondary">
                To: {format(endDate, "MMM dd, yyyy")}
              </Badge>
            )}
            <span className="ml-2">• {filteredPayments.length} results</span>
          </div>
        )}
      </div>

      {/* Payments Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payment ID</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedPayments.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center text-muted-foreground py-8"
              >
                No payments found
              </TableCell>
            </TableRow>
          ) : (
            paginatedPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-mono text-sm">
                  {payment.id.slice(0, 8)}...
                </TableCell>
                <TableCell>{payment.enrollment.student.user.name}</TableCell>
                <TableCell>
                  {payment.enrollment.section.template.name}
                </TableCell>
                <TableCell suppressHydrationWarning>
                  Rp {payment.amount.toLocaleString("id-ID")}
                </TableCell>
                <TableCell className="capitalize">
                  {payment.paymentMethod.replace("_", " ")}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      payment.status === "PAID"
                        ? "default"
                        : payment.status === "PENDING"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell suppressHydrationWarning>
                  {formatDistanceToNow(new Date(payment.createdAt), {
                    addSuffix: true,
                    locale: id,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setSelectedPayment(payment);
                      setIsDetailOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredPayments.length)} of{" "}
            {filteredPayments.length} results
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                }
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      setCurrentPage(currentPage + 1);
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Payment Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this payment transaction.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              {/* Payment ID */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Payment ID</p>
                <p className="font-mono text-sm">{selectedPayment.id}</p>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={
                    selectedPayment.status === "PAID"
                      ? "default"
                      : selectedPayment.status === "PENDING"
                      ? "secondary"
                      : "destructive"
                  }
                  className="text-sm"
                >
                  {selectedPayment.status}
                </Badge>
              </div>

              <Separator />

              {/* Student Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4" />
                  Student Information
                </div>
                <div className="pl-6 space-y-1">
                  <p className="font-medium">
                    {selectedPayment.enrollment.student.user.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPayment.enrollment.section.template.name}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Payment Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="h-4 w-4" />
                  Payment Information
                </div>
                <div className="pl-6 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-bold text-lg">
                      Rp {selectedPayment.amount.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span className="capitalize">
                      {selectedPayment.paymentMethod.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Timestamp */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  Timestamp
                </div>
                <div className="pl-6 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>
                      {format(
                        new Date(selectedPayment.createdAt),
                        "dd MMM yyyy, HH:mm"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Relative</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(
                        new Date(selectedPayment.createdAt),
                        {
                          addSuffix: true,
                          locale: id,
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
