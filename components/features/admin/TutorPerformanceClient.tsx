"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  BookOpen,
  FileText,
  Video,
  CheckCircle,
  Download,
  TrendingUp,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface TutorPerformanceData {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  education: string | null;
  experience: number | null;
  sections: {
    total: number;
    active: number;
  };
  materials: number;
  assignments: number;
  quizzes: number;
  meetings: {
    total: number;
    completed: number;
    cancelled: number;
  };
  students: {
    total: number;
    active: number;
  };
  submissionRate: number;
  passRate: number;
}

interface SummaryStats {
  totalTutors: number;
  activeSections: number;
  meetingCompletionRate: number;
}

interface TutorPerformanceClientProps {
  tutors: TutorPerformanceData[];
  summary: SummaryStats;
}

export default function TutorPerformanceClient({
  tutors,
  summary,
}: TutorPerformanceClientProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getMeetingCompletionRate = (tutor: TutorPerformanceData) => {
    const { completed, total } = tutor.meetings;
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 80) return <Badge className="bg-green-500">Excellent</Badge>;
    if (rate >= 60) return <Badge className="bg-yellow-500">Good</Badge>;
    if (rate >= 40) return <Badge className="bg-orange-500">Fair</Badge>;
    return <Badge className="bg-red-500">Needs Improvement</Badge>;
  };

  // Calculate averages
  const avgSubmissionRate =
    tutors.length > 0
      ? Math.round(
          tutors.reduce((sum, t) => sum + t.submissionRate, 0) / tutors.length
        )
      : 0;

  const avgPassRate =
    tutors.length > 0
      ? Math.round(
          tutors.reduce((sum, t) => sum + t.passRate, 0) / tutors.length
        )
      : 0;

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(10, 38, 71);
    doc.text("Tutor Nomor Satu", 14, 20);

    doc.setFontSize(16);
    doc.text("Laporan Kinerja Tutor", 14, 32);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Generated: ${format(new Date(), "dd MMM yyyy HH:mm", {
        locale: idLocale,
      })}`,
      14,
      40
    );

    // Summary
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Ringkasan", 14, 52);

    autoTable(doc, {
      startY: 56,
      head: [["Metric", "Value"]],
      body: [
        ["Total Tutor", summary.totalTutors.toString()],
        ["Section Aktif", summary.activeSections.toString()],
        ["Avg Submission Rate", `${avgSubmissionRate}%`],
        ["Avg Pass Rate", `${avgPassRate}%`],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [10, 38, 71] },
    });

    // Tutor details
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.text("Detail Kinerja Tutor", 14, finalY + 15);

    autoTable(doc, {
      startY: finalY + 19,
      head: [
        [
          "Nama",
          "Sections",
          "Materi",
          "Tugas",
          "Quiz",
          "Meetings",
          "Submission%",
          "Pass%",
        ],
      ],
      body: tutors.map((t) => [
        t.name,
        `${t.sections.active}/${t.sections.total}`,
        t.materials.toString(),
        t.assignments.toString(),
        t.quizzes.toString(),
        `${t.meetings.completed}/${t.meetings.total}`,
        `${t.submissionRate}%`,
        `${t.passRate}%`,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [255, 184, 0], textColor: [0, 0, 0] },
    });

    doc.save(`Tutor_Performance_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`);
    toast.success("PDF berhasil di-download");
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ["Laporan Kinerja Tutor - Tutor Nomor Satu"],
      [`Generated: ${format(new Date(), "dd MMM yyyy HH:mm")}`],
      [],
      ["Metric", "Value"],
      ["Total Tutor", summary.totalTutors],
      ["Section Aktif", summary.activeSections],
      ["Avg Submission Rate", `${avgSubmissionRate}%`],
      ["Avg Pass Rate", `${avgPassRate}%`],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Detail sheet
    const detailData = [
      [
        "Nama",
        "Email",
        "Pendidikan",
        "Pengalaman (tahun)",
        "Section Aktif",
        "Total Section",
        "Materi",
        "Tugas",
        "Quiz",
        "Meeting Completed",
        "Total Meeting",
        "Siswa Aktif",
        "Submission Rate",
        "Pass Rate",
      ],
      ...tutors.map((t) => [
        t.name,
        t.email,
        t.education || "-",
        t.experience || 0,
        t.sections.active,
        t.sections.total,
        t.materials,
        t.assignments,
        t.quizzes,
        t.meetings.completed,
        t.meetings.total,
        t.students.active,
        `${t.submissionRate}%`,
        `${t.passRate}%`,
      ]),
    ];
    const detailWs = XLSX.utils.aoa_to_sheet(detailData);
    XLSX.utils.book_append_sheet(wb, detailWs, "Detail Tutor");

    XLSX.writeFile(
      wb,
      `Tutor_Performance_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`
    );
    toast.success("Excel berhasil di-download");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0A2647]">
            Kinerja Tutor
          </h1>
          <p className="text-muted-foreground">
            Evaluasi dan analisis performa tutor berdasarkan aktivitas dan hasil
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tutor</p>
                <p className="text-2xl font-bold">{summary.totalTutors}</p>
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
                <p className="text-sm text-muted-foreground">Section Aktif</p>
                <p className="text-2xl font-bold">{summary.activeSections}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Submission</p>
                <p className="text-2xl font-bold">{avgSubmissionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <GraduationCap className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Pass Rate</p>
                <p className="text-2xl font-bold">{avgPassRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tutor Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Kinerja per Tutor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tutor</TableHead>
                  <TableHead className="text-center">Sections</TableHead>
                  <TableHead className="text-center">Materi</TableHead>
                  <TableHead className="text-center">Tugas</TableHead>
                  <TableHead className="text-center">Quiz</TableHead>
                  <TableHead className="text-center">Meetings</TableHead>
                  <TableHead className="text-center">Siswa</TableHead>
                  <TableHead className="text-center">Submission</TableHead>
                  <TableHead className="text-center">Pass Rate</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tutors.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-muted-foreground py-8"
                    >
                      Belum ada data tutor
                    </TableCell>
                  </TableRow>
                ) : (
                  tutors.map((tutor) => {
                    const meetingRate = getMeetingCompletionRate(tutor);
                    const overallScore = Math.round(
                      (tutor.submissionRate + tutor.passRate + meetingRate) / 3
                    );

                    return (
                      <TableRow key={tutor.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={tutor.avatar || ""} />
                              <AvatarFallback className="bg-[#0A2647] text-white">
                                {getInitials(tutor.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{tutor.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {tutor.education || tutor.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">
                            {tutor.sections.active}
                          </span>
                          <span className="text-muted-foreground">
                            /{tutor.sections.total}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {tutor.materials}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {tutor.assignments}
                        </TableCell>
                        <TableCell className="text-center">
                          {tutor.quizzes}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Video className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {tutor.meetings.completed}
                            </span>
                            <span className="text-muted-foreground">
                              /{tutor.meetings.total}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {tutor.students.active}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`font-medium ${
                              tutor.submissionRate >= 70
                                ? "text-green-600"
                                : tutor.submissionRate >= 50
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {tutor.submissionRate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`font-medium ${
                              tutor.passRate >= 70
                                ? "text-green-600"
                                : tutor.passRate >= 50
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {tutor.passRate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {getPerformanceBadge(overallScore)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-2">Keterangan Status:</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500">Excellent</Badge>
              <span>≥ 80%</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-500">Good</Badge>
              <span>60-79%</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-500">Fair</Badge>
              <span>40-59%</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-500">Needs Improvement</Badge>
              <span>&lt; 40%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
