"use client";

/**
 * GradesClient Component
 * Client-side component for student grades with tabs
 */

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Award, Target, BookOpen, Download } from "lucide-react";

interface ClassGrade {
  classId: string;
  className: string;
  subject: string;
  tutorName: string;
  assignmentAvg: number | null;
  quizAvg: number | null;
  overallAvg: number | null;
  assignmentCount: number;
  quizCount: number;
  status: string;
}

interface RecentScore {
  type: string;
  subject: string;
  title: string;
  date: string;
  score: number;
  maxScore: number;
}

interface Stats {
  overallAverage: number;
  highestScore: number;
  lowestScore: number;
  highestSubject: string;
  lowestSubject: string;
  totalClasses: number;
}

interface GradesClientProps {
  classGrades: ClassGrade[];
  recentScores: RecentScore[];
  stats: Stats;
  studentName: string;
}

export default function GradesClient({
  classGrades,
  recentScores,
  stats,
  studentName,
}: GradesClientProps) {
  const [isExporting, setIsExporting] = useState(false);
  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "good":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "fair":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "poor":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "excellent":
        return "Sangat Baik";
      case "good":
        return "Baik";
      case "fair":
        return "Cukup";
      case "poor":
        return "Perlu Perbaikan";
      default:
        return "Belum Ada Nilai";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID");
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("LAPORAN NILAI SISWA", pageWidth / 2, 20, { align: "center" });

      // Student Info
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Nama: ${studentName}`, 14, 35);
      doc.text(
        `Tanggal: ${new Date().toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        14,
        42
      );

      // Stats Summary
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Ringkasan", 14, 55);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Rata-rata Keseluruhan: ${stats.overallAverage || "-"}`, 14, 63);
      doc.text(
        `Nilai Tertinggi: ${stats.highestScore || "-"} (${
          stats.highestSubject || "-"
        })`,
        14,
        70
      );
      doc.text(
        `Nilai Terendah: ${stats.lowestScore || "-"} (${
          stats.lowestSubject || "-"
        })`,
        14,
        77
      );
      doc.text(`Total Mata Pelajaran: ${stats.totalClasses}`, 14, 84);

      // Grades Table
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Detail Nilai Per Mata Pelajaran", 14, 98);

      const tableData = classGrades.map((grade) => [
        grade.subject,
        grade.tutorName,
        grade.assignmentAvg !== null
          ? `${grade.assignmentAvg} (${grade.assignmentCount})`
          : "-",
        grade.quizAvg !== null ? `${grade.quizAvg} (${grade.quizCount})` : "-",
        grade.overallAvg ?? "-",
        getStatusLabel(grade.status),
      ]);

      autoTable(doc, {
        startY: 103,
        head: [
          ["Mata Pelajaran", "Tutor", "Tugas", "Kuis", "Nilai Akhir", "Status"],
        ],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: { fontStyle: "bold" },
          4: { halign: "center", fontStyle: "bold" },
          5: { halign: "center" },
        },
      });

      // Footer
      const finalY =
        (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
          .finalY || 150;
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Dokumen ini di-generate secara otomatis pada ${new Date().toLocaleString(
          "id-ID"
        )}`,
        pageWidth / 2,
        finalY + 15,
        { align: "center" }
      );

      // Save PDF
      doc.save(
        `Laporan_Nilai_${studentName.replace(/\s+/g, "_")}_${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`
      );
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rapor & Nilai</h1>
          <p className="text-muted-foreground mt-1">
            Pantau perkembangan akademik Anda
          </p>
        </div>
        <Button
          onClick={handleExportPDF}
          disabled={isExporting || classGrades.length === 0}
          className="w-full sm:w-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Mengexport..." : "Export PDF"}
        </Button>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rata-rata Keseluruhan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.overallAverage || "-"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dari {stats.totalClasses} mata pelajaran
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nilai Tertinggi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.highestScore || "-"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.highestSubject || "Belum ada nilai"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nilai Terendah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.lowestScore || "-"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.lowestSubject || "Belum ada nilai"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85</div>
            <p className="text-xs text-muted-foreground mt-1">
              Rata-rata minimal
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="detailed">Detail Per Mata Pelajaran</TabsTrigger>
          <TabsTrigger value="recent">Nilai Terbaru</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-6">
          {classGrades.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Belum ada kelas yang terdaftar
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {classGrades.map((grade) => (
                <Card key={grade.classId}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {grade.subject}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {grade.tutorName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={getStatusColor(grade.status)}
                            >
                              {getStatusLabel(grade.status)}
                            </Badge>
                            {grade.overallAvg !== null &&
                              grade.overallAvg >= 70 && (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Progress
                            </span>
                            <span className="font-semibold">
                              {grade.overallAvg ?? 0}%
                            </span>
                          </div>
                          <Progress
                            value={grade.overallAvg ?? 0}
                            className="h-2"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-6 lg:shrink-0">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">
                            {grade.overallAvg ?? "-"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Nilai Akhir
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Detailed Tab */}
        <TabsContent value="detailed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Detail Nilai Per Mata Pelajaran</CardTitle>
              <CardDescription>
                Breakdown nilai berdasarkan komponen penilaian
              </CardDescription>
            </CardHeader>
            <CardContent>
              {classGrades.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada data nilai
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead className="text-center">Tugas</TableHead>
                      <TableHead className="text-center">Kuis</TableHead>
                      <TableHead className="text-center">Akhir</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classGrades.map((grade) => (
                      <TableRow key={grade.classId}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{grade.subject}</div>
                            <div className="text-xs text-muted-foreground">
                              {grade.tutorName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {grade.assignmentAvg ?? "-"}
                          {grade.assignmentCount > 0 && (
                            <div className="text-xs text-muted-foreground">
                              ({grade.assignmentCount} tugas)
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {grade.quizAvg ?? "-"}
                          {grade.quizCount > 0 && (
                            <div className="text-xs text-muted-foreground">
                              ({grade.quizCount} kuis)
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-primary border-primary/20"
                          >
                            {grade.overallAvg ?? "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusColor(grade.status)}
                          >
                            {getStatusLabel(grade.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Scores Tab */}
        <TabsContent value="recent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Nilai Terbaru</CardTitle>
              <CardDescription>
                Nilai terbaru dari tugas dan kuis Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentScores.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada nilai terbaru
                </p>
              ) : (
                <div className="space-y-4">
                  {recentScores.map((score, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg ${
                            score.type === "Kuis"
                              ? "bg-blue-500/10 text-blue-700"
                              : "bg-green-500/10 text-green-700"
                          }`}
                        >
                          {score.type === "Kuis" ? (
                            <Target className="h-5 w-5" />
                          ) : (
                            <Award className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">{score.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {score.subject} • {formatDate(score.date)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {score.score}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          dari {score.maxScore}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
