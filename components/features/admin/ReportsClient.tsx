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
  TrendingUp,
  Users,
  DollarSign,
  GraduationCap,
  Calendar as CalendarIcon,
  Loader2,
  BookOpen,
  Video,
} from "lucide-react";
import { useState, useRef } from "react";
import { format, subDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import {
  getRevenueReportData,
  RevenueReportData,
  getEnrollmentReportData,
  EnrollmentReportData,
  getClassAnalyticsData,
  ClassAnalyticsData,
  getMeetingReportData,
  MeetingReportData,
} from "@/lib/reports";

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

  // Chart Capture States
  const [chartData, setChartData] = useState<any[]>([]);
  const [showHiddenChart, setShowHiddenChart] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

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

      let reportData: any = null;

      switch (selectedReport) {
        case "financial":
          reportData = await getRevenueReportData(dateFrom, dateTo);
          break;
        case "enrollment":
          reportData = await getEnrollmentReportData(dateFrom, dateTo);
          break;
        case "analytics":
          reportData = await getClassAnalyticsData(dateFrom, dateTo);
          break;
        case "meetings":
          reportData = await getMeetingReportData(dateFrom, dateTo);
          break;
      }

      // Handle Chart Generation for Analytics
      let chartImage: string | null = null;
      if (selectedReport === "analytics" && reportData) {
        const d = reportData as ClassAnalyticsData;

        // Group by program for chart (Revenue by Program)
        const programRevenue: Record<string, number> = {};
        d.sections.forEach((s) => {
          programRevenue[s.programName] =
            (programRevenue[s.programName] || 0) + s.revenue;
        });

        // Transform to array
        const chartD = Object.entries(programRevenue)
          .map(([name, val]) => ({
            name: name,
            value: val,
          }))
          .sort((a, b) => b.value - a.value); // Sort desc

        if (chartD.length > 0) {
          setChartData(chartD);
          setShowHiddenChart(true);

          // Wait for render (crucial)
          await new Promise((resolve) => setTimeout(resolve, 800));

          if (chartRef.current) {
            try {
              const canvas = await html2canvas(chartRef.current, {
                scale: 2, // Better quality
                logging: false,
                backgroundColor: "#ffffff",
              } as any);
              chartImage = canvas.toDataURL("image/png");
            } catch (e) {
              console.error("Chart capture failed", e);
            }
          }
          setShowHiddenChart(false);
        }
      }

      if (exportFormat === "pdf") {
        generatePDF(reportName, dateRange, reportData, chartImage);
      } else if (exportFormat === "excel") {
        generateExcel(reportName, dateRange, reportData);
      } else {
        generateCSV(reportName, dateRange, reportData);
      }

      toast.success(`${reportName} berhasil di-generate`);
    } catch (error) {
      console.error(error);
      toast.error("Gagal generate report");
    } finally {
      setShowHiddenChart(false);
      setIsGenerating(false);
    }
  };

  const generatePDF = (
    reportName: string,
    dateRange: string,
    data: any,
    chartImage: string | null
  ) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- Header Section ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(10, 38, 71); // Brand Blue
    doc.text("Tutor Nomor Satu", 14, 20);

    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text(reportName.toUpperCase(), 14, 29);

    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(14, 33, pageWidth - 14, 33);

    doc.setFontSize(9);
    doc.setTextColor(100);
    const dateStr = `Generated: ${format(new Date(), "dd MMM yyyy HH:mm", {
      locale: idLocale,
    })}`;
    const periodStr = `Period: ${dateRange}`;

    doc.text(periodStr, 14, 40);
    doc.text(dateStr, 14, 45);

    let currentY = 55;

    // --- Content Section ---
    switch (selectedReport) {
      case "financial": {
        const d = data as RevenueReportData;
        if (!d) return;

        // Summary Box
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(14, currentY, pageWidth - 28, 25, 3, 3, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text("Financial Summary", 20, currentY + 8);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text("Total Revenue", 20, currentY + 18);
        doc.text("Transactions", 90, currentY + 18);
        doc.text("Avg. Transaction", 160, currentY + 18);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(10, 38, 71);
        doc.text(formatPrice(d.summary.totalRevenue), 20, currentY + 23);
        doc.text(d.summary.transactionCount.toString(), 90, currentY + 23);
        doc.text(formatPrice(d.summary.averageTransaction), 160, currentY + 23);

        currentY += 35;

        // Details Table
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("Transaction Details", 14, currentY - 5);

        autoTable(doc, {
          startY: currentY,
          head: [["ID", "Date", "Student", "Program", "Method", "Amount"]],
          body: d.payments.map((p) => [
            p.id.substring(0, 8),
            format(new Date(p.date), "dd/MM/yyyy"),
            p.studentName,
            p.programName,
            p.paymentMethod,
            formatPrice(p.amount),
          ]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [10, 38, 71], textColor: 255 },
          foot: [
            [
              {
                content: "TOTAL",
                colSpan: 5,
                styles: { halign: "right", fontStyle: "bold" },
              },
              {
                content: formatPrice(d.summary.totalRevenue),
                styles: { halign: "right", fontStyle: "bold" },
              },
            ],
          ],
        });
        break;
      }

      case "enrollment": {
        const d = data as EnrollmentReportData;
        if (!d) return;

        // Summary
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(14, currentY, pageWidth - 28, 25, 3, 3, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text("Enrollment Summary", 20, currentY + 8);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text("New Enrollments", 20, currentY + 18);
        doc.text("Total Active Students", 90, currentY + 18);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(79, 70, 229);
        doc.text(d.summary.totalNewEnrollments.toString(), 20, currentY + 23);
        doc.text(d.summary.activeEnrollments.toString(), 90, currentY + 23);

        currentY += 35;

        // List
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("New Student Enrollments", 14, currentY - 5);

        autoTable(doc, {
          startY: currentY,
          head: [
            ["Date", "Student Name", "Email", "Program", "Section", "Status"],
          ],
          body: d.enrollments.map((e) => [
            format(new Date(e.enrolledAt), "dd/MM/yyyy"),
            e.studentName,
            e.studentEmail,
            e.programName,
            e.sectionLabel,
            e.status,
          ]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        });
        break;
      }

      case "analytics": {
        const d = data as ClassAnalyticsData;
        if (!d) return;

        // Summary
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(14, currentY, pageWidth - 28, 25, 3, 3, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text("Performance Summary", 20, currentY + 8);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text("Active Classes", 20, currentY + 18);
        doc.text("Period Revenue", 90, currentY + 18);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(10, 38, 71);
        doc.text(d.summary.totalSections.toString(), 20, currentY + 23);
        doc.text(formatPrice(d.summary.totalRevenue), 90, currentY + 23);

        currentY += 35;

        // CHART IN PDF
        if (chartImage) {
          doc.setFontSize(12);
          doc.setTextColor(0);
          doc.text("Revenue by Program", 14, currentY - 5);

          // Add image (x, y, w, h)
          doc.addImage(chartImage, "PNG", 14, currentY, 180, 80);
          currentY += 90;
        }

        // Table
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("Class Performance", 14, currentY - 5);

        autoTable(doc, {
          startY: currentY,
          head: [["Program", "Section", "Tutor", "Students", "New", "Revenue"]],
          body: d.sections.map((s) => [
            s.programName,
            s.sectionLabel,
            s.tutorName,
            s.totalStudents,
            s.newStudents,
            formatPrice(s.revenue),
          ]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [10, 38, 71], textColor: 255 },
          columnStyles: { 5: { halign: "right" } },
        });
        break;
      }

      case "meetings": {
        const d = data as MeetingReportData;
        if (!d) return;

        // Summary
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(14, currentY, pageWidth - 28, 25, 3, 3, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text("Meeting Summary", 20, currentY + 8);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text("Scheduled", 20, currentY + 18);
        doc.text("Completed", 90, currentY + 18);
        doc.text("Completion Rate", 160, currentY + 18);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(249, 115, 22);
        doc.text(d.summary.totalScheduled.toString(), 20, currentY + 23);
        doc.text(d.summary.totalCompleted.toString(), 90, currentY + 23);
        doc.text(d.summary.completionRate + "%", 160, currentY + 23);

        currentY += 35;

        // Table
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("Meeting Schedule", 14, currentY - 5);

        autoTable(doc, {
          startY: currentY,
          head: [["Date", "Title", "Program", "Section", "Status", "Attend"]],
          body: d.meetings.map((m) => [
            format(new Date(m.scheduledAt), "dd/MM/yyyy HH:mm"),
            m.title,
            m.programName,
            m.sectionLabel,
            m.status,
            m.attendanceCount,
          ]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [249, 115, 22], textColor: 255 },
        });
        break;
      }
    }

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - 20,
        doc.internal.pageSize.height - 10
      );
      doc.text(
        "Tutor Nomor Satu - Confidential",
        14,
        doc.internal.pageSize.height - 10
      );
    }

    doc.save(
      `${reportName.replace(/\s+/g, "_")}_${format(
        new Date(),
        "yyyyMMdd_HHmmss"
      )}.pdf`
    );
  };

  const generateExcel = (reportName: string, dateRange: string, data: any) => {
    const wb = XLSX.utils.book_new();
    const headerData = [
      ["Tutor Nomor Satu - " + reportName],
      ["Period: " + dateRange],
      ["Generated: " + format(new Date(), "dd MMM yyyy HH:mm")],
      [],
    ];

    switch (selectedReport) {
      case "financial": {
        const d = data as RevenueReportData;
        if (!d) return;

        const summary = [
          ["SUMMARY"],
          ["Total Revenue", d.summary.totalRevenue],
          ["Transactions", d.summary.transactionCount],
          ["Avg Transaction", d.summary.averageTransaction],
          [],
        ];

        const rows = d.payments.map((p) => [
          p.id,
          format(new Date(p.date), "yyyy-MM-dd HH:mm"),
          p.studentName,
          p.programName,
          p.paymentMethod,
          p.amount,
          p.status,
        ]);

        const ws = XLSX.utils.aoa_to_sheet([
          ...headerData,
          ...summary,
          ["ID", "Date", "Student", "Program", "Method", "Amount", "Status"],
          ...rows,
          [],
          ["TOTAL", "", "", "", "", d.summary.totalRevenue],
        ]);
        XLSX.utils.book_append_sheet(wb, ws, "Financial Report");
        break;
      }

      case "enrollment": {
        const d = data as EnrollmentReportData;
        if (!d) return;

        const summary = [
          ["SUMMARY"],
          ["New Enrollments", d.summary.totalNewEnrollments],
          ["Total Active Students", d.summary.activeEnrollments],
          [],
        ];

        const rows = d.enrollments.map((e) => [
          format(new Date(e.enrolledAt), "yyyy-MM-dd"),
          e.studentName,
          e.studentEmail,
          e.programName,
          e.sectionLabel,
          e.status,
        ]);

        const ws = XLSX.utils.aoa_to_sheet([
          ...headerData,
          ...summary,
          ["Date", "Student Name", "Email", "Program", "Section", "Status"],
          ...rows,
        ]);
        XLSX.utils.book_append_sheet(wb, ws, "Enrollments");
        break;
      }

      case "analytics": {
        const d = data as ClassAnalyticsData;
        if (!d) return;

        const summary = [
          ["SUMMARY"],
          ["Total Sections", d.summary.totalSections],
          ["Total Period Revenue", d.summary.totalRevenue],
          [],
        ];

        const rows = d.sections.map((s) => [
          s.programName,
          s.sectionLabel,
          s.tutorName,
          s.totalStudents,
          s.newStudents,
          s.revenue,
        ]);

        const ws = XLSX.utils.aoa_to_sheet([
          ...headerData,
          ...summary,
          [
            "Program",
            "Section",
            "Tutor",
            "Total Students",
            "New Students",
            "Revenue",
          ],
          ...rows,
        ]);
        XLSX.utils.book_append_sheet(wb, ws, "Class Analytics");
        break;
      }

      case "meetings": {
        const d = data as MeetingReportData;
        if (!d) return;

        const summary = [
          ["SUMMARY"],
          ["Total Scheduled", d.summary.totalScheduled],
          ["Total Completed", d.summary.totalCompleted],
          ["Completion Rate (%)", d.summary.completionRate],
          [],
        ];

        const rows = d.meetings.map((m) => [
          format(new Date(m.scheduledAt), "yyyy-MM-dd HH:mm"),
          m.title,
          m.programName,
          m.sectionLabel,
          m.status,
          m.attendanceCount,
        ]);

        const ws = XLSX.utils.aoa_to_sheet([
          ...headerData,
          ...summary,
          ["Date", "Title", "Program", "Section", "Status", "Attendance"],
          ...rows,
        ]);
        XLSX.utils.book_append_sheet(wb, ws, "Meeting Report");
        break;
      }
    }

    XLSX.writeFile(
      wb,
      `${reportName.replace(/\s+/g, "_")}_${format(
        new Date(),
        "yyyyMMdd_HHmmss"
      )}.xlsx`
    );
  };

  const generateCSV = (reportName: string, dateRange: string, data: any) => {
    toast.info("For detailed reports, please use Excel or PDF format.");
  };

  return (
    <div className="space-y-6">
      {/* Hidden Chart Container for Capture */}
      {showHiddenChart && (
        <div
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            width: "800px",
            height: "400px",
            background: "white",
            zIndex: -1,
          }}
          ref={chartRef}
        >
          <div
            className="p-8 bg-white"
            style={{ width: "800px", height: "400px" }}
          >
            <h3 className="text-2xl font-bold mb-4 text-center text-[#0A2647] font-sans">
              Revenue Breakdown by Program
            </h3>
            <div style={{ width: "100%", height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    fontSize={14}
                    tick={{ fill: "#333" }}
                    tickMargin={10}
                  />
                  <YAxis
                    tickFormatter={(val) => `Rp${val / 1000}k`}
                    fontSize={14}
                    tick={{ fill: "#333" }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#0A2647"
                    name="Revenue"
                    radius={[4, 4, 0, 0]}
                    barSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0A2647]">
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground">
          Generate comprehensive reports with real-time data
        </p>
      </div>

      {/* Quick Stats Grid */}
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
