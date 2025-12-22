"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Download,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  GraduationCap,
  Calendar as CalendarIcon,
  Loader2,
  BookOpen,
  Video,
} from "lucide-react";
import { useState } from "react";
import { format, subDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Types
interface ReportStats {
  totalRevenue: number;
  activeStudents: number;
  activeSections: number;
  completedMeetings: number;
  pendingPayments: number;
  monthlyRevenue: { month: string; amount: number }[];
  enrollmentsByProgram: { name: string; count: number }[];
  recentPayments: {
    id: string;
    amount: number;
    studentName: string;
    programName: string;
    paidAt: string;
  }[];
}

interface ReportsClientProps {
  stats: ReportStats;
}

const reportTemplates = [
  {
    id: 1,
    name: "Revenue Report",
    description: "Detailed breakdown of revenue by class and time period",
    icon: DollarSign,
    type: "financial",
  },
  {
    id: 2,
    name: "Enrollment Report",
    description: "Student enrollment trends and patterns",
    icon: TrendingUp,
    type: "enrollment",
  },
  {
    id: 3,
    name: "Class Analytics",
    description: "Comprehensive class performance metrics",
    icon: BookOpen,
    type: "analytics",
  },
  {
    id: 4,
    name: "Meeting Report",
    description: "Meeting schedules and attendance tracking",
    icon: Video,
    type: "meetings",
  },
];

export default function ReportsClient({ stats }: ReportsClientProps) {
  const [selectedReport, setSelectedReport] = useState("");
  const [exportFormat, setExportFormat] = useState("pdf");
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const generateReport = async () => {
    if (!selectedReport) {
      toast.error("Pilih jenis laporan terlebih dahulu");
      return;
    }

    setIsGenerating(true);

    try {
      const reportName =
        reportTemplates.find((t) => t.type === selectedReport)?.name ||
        "Report";
      const dateRange = `${format(dateFrom, "dd MMM yyyy", {
        locale: idLocale,
      })} - ${format(dateTo, "dd MMM yyyy", { locale: idLocale })}`;

      if (exportFormat === "pdf") {
        generatePDF(reportName, dateRange);
      } else if (exportFormat === "excel") {
        generateExcel(reportName, dateRange);
      } else {
        generateCSV(reportName, dateRange);
      }

      toast.success(`${reportName} berhasil di-generate`);
    } catch (error) {
      console.error(error);
      toast.error("Gagal generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDF = (reportName: string, dateRange: string) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(10, 38, 71); // #0A2647
    doc.text("Tutor Nomor Satu", 14, 20);

    doc.setFontSize(16);
    doc.text(reportName, 14, 32);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Period: ${dateRange}`, 14, 40);
    doc.text(
      `Generated: ${format(new Date(), "dd MMM yyyy HH:mm", {
        locale: idLocale,
      })}`,
      14,
      46
    );

    // Summary Stats
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Summary Statistics", 14, 58);

    autoTable(doc, {
      startY: 62,
      head: [["Metric", "Value"]],
      body: [
        ["Total Revenue", formatPrice(stats.totalRevenue)],
        ["Active Students", stats.activeStudents.toString()],
        ["Active Sections", stats.activeSections.toString()],
        ["Completed Meetings", stats.completedMeetings.toString()],
        ["Pending Payments", stats.pendingPayments.toString()],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [10, 38, 71] },
    });

    // Enrollments by Program
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.text("Enrollments by Program", 14, finalY + 15);

    autoTable(doc, {
      startY: finalY + 19,
      head: [["Program", "Enrollments"]],
      body: stats.enrollmentsByProgram.map((p) => [p.name, p.count.toString()]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [255, 184, 0], textColor: [0, 0, 0] },
    });

    // Recent Payments
    const finalY2 = (doc as any).lastAutoTable.finalY || 150;
    doc.text("Recent Payments", 14, finalY2 + 15);

    autoTable(doc, {
      startY: finalY2 + 19,
      head: [["Student", "Program", "Amount", "Date"]],
      body: stats.recentPayments
        .slice(0, 10)
        .map((p) => [
          p.studentName,
          p.programName,
          formatPrice(p.amount),
          format(new Date(p.paidAt), "dd MMM yyyy", { locale: idLocale }),
        ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [34, 197, 94] },
    });

    doc.save(
      `${reportName.replace(/\s+/g, "_")}_${format(
        new Date(),
        "yyyyMMdd_HHmmss"
      )}.pdf`
    );
  };

  const generateExcel = (reportName: string, dateRange: string) => {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ["Tutor Nomor Satu - " + reportName],
      ["Period: " + dateRange],
      ["Generated: " + format(new Date(), "dd MMM yyyy HH:mm")],
      [],
      ["Metric", "Value"],
      ["Total Revenue", stats.totalRevenue],
      ["Active Students", stats.activeStudents],
      ["Active Sections", stats.activeSections],
      ["Completed Meetings", stats.completedMeetings],
      ["Pending Payments", stats.pendingPayments],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Enrollments Sheet
    const enrollmentsData = [
      ["Program", "Enrollments"],
      ...stats.enrollmentsByProgram.map((p) => [p.name, p.count]),
    ];
    const enrollmentsWs = XLSX.utils.aoa_to_sheet(enrollmentsData);
    XLSX.utils.book_append_sheet(wb, enrollmentsWs, "Enrollments");

    // Payments Sheet
    const paymentsData = [
      ["Student", "Program", "Amount", "Date"],
      ...stats.recentPayments.map((p) => [
        p.studentName,
        p.programName,
        p.amount,
        format(new Date(p.paidAt), "yyyy-MM-dd"),
      ]),
    ];
    const paymentsWs = XLSX.utils.aoa_to_sheet(paymentsData);
    XLSX.utils.book_append_sheet(wb, paymentsWs, "Payments");

    XLSX.writeFile(
      wb,
      `${reportName.replace(/\s+/g, "_")}_${format(
        new Date(),
        "yyyyMMdd_HHmmss"
      )}.xlsx`
    );
  };

  const generateCSV = (reportName: string, dateRange: string) => {
    const csvData = [
      ["Student", "Program", "Amount", "Date"],
      ...stats.recentPayments.map((p) => [
        p.studentName,
        p.programName,
        p.amount.toString(),
        format(new Date(p.paidAt), "yyyy-MM-dd"),
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(
      wb,
      `${reportName.replace(/\s+/g, "_")}_${format(
        new Date(),
        "yyyyMMdd_HHmmss"
      )}.csv`
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0A2647]">
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground">
          Generate comprehensive reports with real-time data
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-lg md:text-xl font-bold truncate">
                  {formatPrice(stats.totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Students</p>
                <p className="text-xl font-bold">{stats.activeStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Sections</p>
                <p className="text-xl font-bold">{stats.activeSections}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Video className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Meetings Done</p>
                <p className="text-xl font-bold">{stats.completedMeetings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  {reportTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.type}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Date From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom
                      ? format(dateFrom, "PPP", { locale: idLocale })
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-lg">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(date) => date && setDateFrom(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Date To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo
                      ? format(dateTo, "PPP", { locale: idLocale })
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-lg">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(date) => date && setDateTo(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button
            className="w-full bg-[#FFB800] hover:bg-[#e6a600] text-black"
            size="lg"
            onClick={generateReport}
            disabled={isGenerating || !selectedReport}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Report Templates */}
      <div>
        <h2 className="text-xl font-bold mb-4">Report Templates</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {reportTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <Card
                key={template.id}
                className={`hover:border-[#FFB800] cursor-pointer transition-colors ${
                  selectedReport === template.type
                    ? "border-[#FFB800] bg-[#FFB800]/5"
                    : ""
                }`}
                onClick={() => setSelectedReport(template.type)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#0A2647]/10">
                      <Icon className="h-5 w-5 text-[#0A2647]" />
                    </div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Enrollments by Program */}
      {stats.enrollmentsByProgram.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Enrollments by Program</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.enrollmentsByProgram.map((program, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#0A2647]/10">
                      <GraduationCap className="h-4 w-4 text-[#0A2647]" />
                    </div>
                    <span className="font-medium">{program.name}</span>
                  </div>
                  <span className="text-lg font-bold">{program.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Payments */}
      {stats.recentPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentPayments.slice(0, 5).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{payment.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.programName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatPrice(payment.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(payment.paidAt), "dd MMM yyyy", {
                        locale: idLocale,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
