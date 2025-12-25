"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Search,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface ReportData {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    programs: { id: string; name: string }[];
  };
}

export default function ExecutiveReportsPage() {
  const [reportType, setReportType] = useState("revenue");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [reportType, page, statusFilter, dateFrom, dateTo]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        page: page.toString(),
        limit: "10",
      });
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/executive/reports?${params}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        toast.error(result.error || "Failed to load reports");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (exportFormat: "excel" | "pdf") => {
    if (!data || data.data.length === 0) {
      toast.error("Tidak ada data untuk di-export");
      return;
    }

    setExporting(true);
    try {
      const headers = getTableHeaders();
      const reportTitle = getReportTitle();
      const dateStr = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      // Prepare data for export
      const exportData = data.data.map((row, index) => {
        const rowData: Record<string, any> = { No: index + 1 };
        headers.forEach((h) => {
          const value = row[h.key];
          if (h.key === "date" || h.key === "expiryDate") {
            rowData[h.label] = value
              ? new Date(value).toLocaleDateString("id-ID")
              : "-";
          } else if (h.key === "amount" || h.key === "revenue") {
            rowData[h.label] = `Rp ${(value || 0).toLocaleString("id-ID")}`;
          } else {
            rowData[h.label] = value || "-";
          }
        });
        return rowData;
      });

      if (exportFormat === "excel") {
        // Use xlsx library for professional Excel export
        const XLSX = await import("xlsx");

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();

        // Add header row with report info
        const wsData = [
          ["LAPORAN " + reportTitle.toUpperCase()],
          ["Tutor Nomor Satu - Executive Dashboard"],
          ["Tanggal Export: " + dateStr],
          [], // Empty row
          ["No", ...headers.map((h) => h.label)], // Column headers
          ...exportData.map((row) => [
            row.No,
            ...headers.map((h) => row[h.label]),
          ]),
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        const colWidths = [{ wch: 5 }]; // No column
        headers.forEach(() => colWidths.push({ wch: 20 }));
        ws["!cols"] = colWidths;

        // Merge title cells
        ws["!merges"] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length } },
          { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length } },
        ];

        XLSX.utils.book_append_sheet(wb, ws, reportTitle);

        // Generate and download file
        XLSX.writeFile(
          wb,
          `Laporan_${reportTitle}_${
            new Date().toISOString().split("T")[0]
          }.xlsx`
        );

        toast.success("Export Excel berhasil!");
      } else if (exportFormat === "pdf") {
        // Use jspdf + jspdf-autotable for professional PDF export
        const { default: jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");

        const doc = new jsPDF({
          orientation: headers.length > 5 ? "landscape" : "portrait",
          unit: "mm",
          format: "a4",
        });

        // Title
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("LAPORAN " + reportTitle.toUpperCase(), 14, 20);

        // Subtitle
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Tutor Nomor Satu - Executive Dashboard", 14, 28);
        doc.text("Tanggal Export: " + dateStr, 14, 34);

        // Table
        autoTable(doc, {
          startY: 42,
          head: [["No", ...headers.map((h) => h.label)]],
          body: exportData.map((row) => [
            row.No,
            ...headers.map((h) => row[h.label]),
          ]),
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          margin: { left: 14, right: 14 },
        });

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(128);
          doc.text(
            `Halaman ${i} dari ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" }
          );
        }

        // Save PDF
        doc.save(
          `Laporan_${reportTitle}_${new Date().toISOString().split("T")[0]}.pdf`
        );

        toast.success("Export PDF berhasil!");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export gagal: " + (error as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const getReportTitle = () => {
    switch (reportType) {
      case "revenue":
        return "Pendapatan";
      case "enrollment":
        return "Pendaftaran";
      case "tutor":
        return "Performa Tutor";
      case "program":
        return "Program";
      default:
        return "Report";
    }
  };

  const formatCurrency = (value: number) => {
    return `Rp ${value?.toLocaleString("id-ID") || 0}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd MMM yyyy", { locale: localeId });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      PAID: "default",
      ACTIVE: "default",
      PENDING: "secondary",
      EXPIRED: "destructive",
      CANCELLED: "destructive",
      COMPLETED: "default",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getTableHeaders = () => {
    switch (reportType) {
      case "revenue":
        return [
          { key: "date", label: "Tanggal" },
          { key: "program", label: "Program" },
          { key: "section", label: "Section" },
          { key: "student", label: "Siswa" },
          { key: "amount", label: "Jumlah" },
          { key: "method", label: "Metode" },
          { key: "status", label: "Status" },
        ];
      case "enrollment":
        return [
          { key: "date", label: "Tanggal" },
          { key: "student", label: "Siswa" },
          { key: "email", label: "Email" },
          { key: "program", label: "Program" },
          { key: "section", label: "Section" },
          { key: "status", label: "Status" },
          { key: "expiryDate", label: "Exp. Date" },
        ];
      case "tutor":
        return [
          { key: "name", label: "Nama Tutor" },
          { key: "email", label: "Email" },
          { key: "sections", label: "Sections" },
          { key: "students", label: "Siswa" },
          { key: "materials", label: "Materi" },
          { key: "assignments", label: "Tugas" },
          { key: "completedMeetings", label: "Meetings" },
        ];
      case "program":
        return [
          { key: "name", label: "Program" },
          { key: "subject", label: "Subject" },
          { key: "sections", label: "Sections" },
          { key: "activeSections", label: "Active" },
          { key: "students", label: "Siswa" },
          { key: "revenue", label: "Revenue" },
          { key: "materials", label: "Materi" },
        ];
      default:
        return [];
    }
  };

  const renderTableCell = (
    row: any,
    header: { key: string; label: string }
  ) => {
    const value = row[header.key];

    if (header.key === "date" || header.key === "expiryDate") {
      return formatDate(value);
    }
    if (header.key === "amount" || header.key === "revenue") {
      return formatCurrency(value);
    }
    if (header.key === "status") {
      return getStatusBadge(value);
    }
    return value || "-";
  };

  // Filter data by search
  const filteredData =
    data?.data.filter((row) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return Object.values(row).some((val) =>
        String(val).toLowerCase().includes(searchLower)
      );
    }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Laporan</h1>
          <p className="text-muted-foreground mt-1">
            Data laporan lengkap dengan filter profesional
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport("excel")}
            disabled={exporting || loading}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("pdf")}
            disabled={exporting || loading}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <Tabs
        value={reportType}
        onValueChange={(val) => {
          setReportType(val);
          setPage(1);
        }}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Pendapatan</TabsTrigger>
          <TabsTrigger value="enrollment">Pendaftaran</TabsTrigger>
          <TabsTrigger value="tutor">Tutor</TabsTrigger>
          <TabsTrigger value="program">Program</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[150px]"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[150px]"
              />
            </div>

            {/* Status Filter (for enrollment) */}
            {reportType === "enrollment" && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Refresh */}
            <Button variant="outline" size="icon" onClick={fetchReports}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">#</TableHead>
                      {getTableHeaders().map((header) => (
                        <TableHead key={header.key}>{header.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={getTableHeaders().length + 1}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Tidak ada data ditemukan
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((row, index) => (
                        <TableRow
                          key={row.id || index}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium text-muted-foreground">
                            {(page - 1) * 10 + index + 1}
                          </TableCell>
                          {getTableHeaders().map((header) => (
                            <TableCell key={header.key}>
                              {renderTableCell(row, header)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * 10 + 1}-
                    {Math.min(page * 10, data.pagination.total)} of{" "}
                    {data.pagination.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Prev
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, data.pagination.totalPages) },
                        (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                              className="w-8"
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) =>
                          Math.min(data.pagination.totalPages, p + 1)
                        )
                      }
                      disabled={page === data.pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
