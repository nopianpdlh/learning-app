"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, FileText, Download, CheckCircle, Clock } from "lucide-react";

const submissions = [
  {
    id: 1,
    studentName: "Ahmad Rizki",
    assignment: "Tugas Integral Tak Tentu",
    class: "Matematika XII",
    submittedDate: "2024-03-20",
    status: "pending",
    file: "tugas_ahmad.pdf",
  },
  {
    id: 2,
    studentName: "Siti Nurhaliza",
    assignment: "Analisis Gelombang Elektromagnetik",
    class: "Fisika XII",
    submittedDate: "2024-03-19",
    status: "pending",
    file: "tugas_siti.pdf",
  },
  {
    id: 3,
    studentName: "Budi Santoso",
    assignment: "Tugas Integral Tak Tentu",
    class: "Matematika XII",
    submittedDate: "2024-03-21",
    status: "pending",
    file: "tugas_budi.pdf",
  },
  {
    id: 4,
    studentName: "Dewi Lestari",
    assignment: "Laporan Praktikum Dinamika",
    class: "Fisika XI",
    submittedDate: "2024-03-18",
    status: "graded",
    score: 88,
    feedback:
      "Laporan sudah baik, namun perlu lebih detail pada bagian analisis data.",
    file: "tugas_dewi.pdf",
  },
  {
    id: 5,
    studentName: "Eko Prasetyo",
    assignment: "Tugas Limit Fungsi",
    class: "Matematika XII",
    submittedDate: "2024-03-17",
    status: "graded",
    score: 92,
    feedback: "Excellent work! Pemahaman konsep sangat baik.",
    file: "tugas_eko.pdf",
  },
];

export default function TutorGrading() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState<number | null>(
    null
  );
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.studentName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      submission.assignment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.class.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || submission.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    return status === "pending" ? (
      <Badge
        variant="outline"
        className="bg-orange-500/10 text-orange-700 border-orange-500/20"
      >
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-green-500/10 text-green-700 border-green-500/20"
      >
        <CheckCircle className="h-3 w-3 mr-1" />
        Dinilai
      </Badge>
    );
  };

  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const gradedCount = submissions.filter((s) => s.status === "graded").length;
  const avgScore =
    submissions.filter((s) => s.score).length > 0
      ? Math.round(
          submissions
            .filter((s) => s.score)
            .reduce((acc, s) => acc + (s.score || 0), 0) /
            submissions.filter((s) => s.score).length
        )
      : 0;

  const handleGrade = (id: number) => {
    setSelectedSubmission(id);
    const submission = submissions.find((s) => s.id === id);
    if (submission && submission.score) {
      setScore(submission.score.toString());
      setFeedback(submission.feedback || "");
    } else {
      setScore("");
      setFeedback("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Penilaian Tugas</h1>
        <p className="text-muted-foreground mt-1">
          Review dan nilai submission siswa
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Perlu Dinilai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pendingCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sudah Dinilai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {gradedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rata-rata Nilai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{avgScore}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari submission..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs
          value={filter}
          onValueChange={setFilter}
          className="w-full sm:w-auto"
        >
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="graded">Dinilai</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Submissions List */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Daftar Submission</h3>
          {filteredSubmissions.map((submission) => (
            <Card
              key={submission.id}
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                selectedSubmission === submission.id
                  ? "ring-2 ring-primary"
                  : ""
              }`}
              onClick={() => handleGrade(submission.id)}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {submission.studentName}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {submission.assignment}
                      </p>
                    </div>
                    {getStatusBadge(submission.status)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{submission.class}</span>
                    <span>•</span>
                    <span>
                      {new Date(submission.submittedDate).toLocaleDateString(
                        "id-ID"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    <span>{submission.file}</span>
                  </div>
                  {submission.score && (
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      Nilai: {submission.score}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Grading Panel */}
        <Card className="h-fit sticky top-6">
          <CardHeader>
            <CardTitle>Form Penilaian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedSubmission ? (
              <>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm font-medium">
                      {
                        submissions.find((s) => s.id === selectedSubmission)
                          ?.studentName
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {
                        submissions.find((s) => s.id === selectedSubmission)
                          ?.assignment
                      }
                    </p>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download File Submission
                </Button>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Nilai (0-100)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Masukkan nilai..."
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Feedback</label>
                  <Textarea
                    placeholder="Berikan feedback untuk siswa..."
                    rows={6}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>

                <Button className="w-full">Simpan Penilaian</Button>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Pilih submission untuk dinilai</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
