"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  FileText,
  Download,
  CheckCircle,
  Clock,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface Submission {
  id: string;
  fileUrl: string;
  status: string;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
  student: {
    user: {
      name: string;
      email: string;
      avatar: string | null;
    };
  };
  assignment: {
    id: string;
    title: string;
    maxPoints: number;
    dueDate: string;
    class: {
      id: string;
      name: string;
      subject: string;
    };
  };
}

interface Stats {
  total: number;
  pending: number;
  graded: number;
  avgScore: number;
}

export default function TutorGradingClient() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    graded: 0,
    avgScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(
    null
  );
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");

  // Fetch submissions
  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("status", filter);
      }

      const response = await fetch(`/api/tutor/submissions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSubmissions(data.submissions);
        setStats(data.stats);
      } else {
        toast.error(data.error || "Gagal memuat submissions");
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  // Filter submissions by search query
  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.student.user.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      submission.assignment.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      submission.assignment.class.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    return status === "SUBMITTED" ? (
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

  const handleSelectSubmission = (submissionId: string) => {
    setSelectedSubmission(submissionId);
    const submission = submissions.find((s) => s.id === submissionId);
    if (submission) {
      setScore(submission.score?.toString() || "");
      setFeedback(submission.feedback || "");
    }
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return;

    const submission = submissions.find((s) => s.id === selectedSubmission);
    if (!submission) return;

    // Validation
    const scoreNum = parseInt(score);
    if (
      isNaN(scoreNum) ||
      scoreNum < 0 ||
      scoreNum > submission.assignment.maxPoints
    ) {
      toast.error(
        `Nilai harus antara 0 dan ${submission.assignment.maxPoints}`
      );
      return;
    }

    if (!feedback.trim()) {
      toast.error("Feedback harus diisi");
      return;
    }

    setGrading(true);
    try {
      const response = await fetch(
        `/api/assignments/${submission.assignment.id}/submissions/${selectedSubmission}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            score: scoreNum,
            feedback: feedback.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Penilaian berhasil disimpan");
        // Refresh submissions
        await fetchSubmissions();
        // Reset form
        setSelectedSubmission(null);
        setScore("");
        setFeedback("");
      } else {
        toast.error(data.error || "Gagal menyimpan penilaian");
      }
    } catch (error) {
      console.error("Error grading submission:", error);
      toast.error("Terjadi kesalahan saat menyimpan penilaian");
    } finally {
      setGrading(false);
    }
  };

  const handleDownloadFile = async (submissionId: string) => {
    try {
      const response = await fetch(
        `/api/submissions/${submissionId}/signed-url`,
        {
          method: "POST",
        }
      );
      const data = await response.json();

      if (response.ok && data.url) {
        window.open(data.url, "_blank");
      } else {
        toast.error(data.error || "Gagal membuka file");
      }
    } catch (error) {
      console.error("Error getting signed URL:", error);
      toast.error("Gagal membuka file");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <div className="text-2xl font-bold">{stats.total}</div>
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
              {stats.pending}
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
              {stats.graded}
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
            <div className="text-2xl font-bold text-primary">
              {stats.avgScore}
            </div>
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
          {filteredSubmissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Tidak ada submission ditemukan</p>
              </CardContent>
            </Card>
          ) : (
            filteredSubmissions.map((submission) => (
              <Card
                key={submission.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  selectedSubmission === submission.id
                    ? "ring-2 ring-primary"
                    : ""
                }`}
                onClick={() => handleSelectSubmission(submission.id)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">
                          {submission.student.user.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {submission.assignment.title}
                        </p>
                      </div>
                      {getStatusBadge(submission.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{submission.assignment.class.name}</span>
                      <span>•</span>
                      <span>
                        {new Date(submission.submittedAt).toLocaleDateString(
                          "id-ID"
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4" />
                      <span className="truncate">
                        {submission.fileUrl.split("/").pop()}
                      </span>
                    </div>
                    {submission.score !== null && (
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        Nilai: {submission.score}/
                        {submission.assignment.maxPoints}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Grading Panel */}
        <Card className="h-fit sticky top-6">
          <CardHeader>
            <CardTitle>Form Penilaian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedSubmission ? (
              <>
                {(() => {
                  const submission = submissions.find(
                    (s) => s.id === selectedSubmission
                  );
                  if (!submission) return null;

                  return (
                    <>
                      <div className="space-y-2">
                        <div className="p-3 rounded-lg bg-muted">
                          <p className="text-sm font-medium">
                            {submission.student.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {submission.assignment.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {submission.assignment.class.name} •{" "}
                            {submission.assignment.class.subject}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleDownloadFile(submission.id)}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Lihat File Submission
                      </Button>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Nilai (0-{submission.assignment.maxPoints})
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max={submission.assignment.maxPoints}
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

                      <Button
                        className="w-full"
                        onClick={handleGradeSubmission}
                        disabled={grading}
                      >
                        {grading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          "Simpan Penilaian"
                        )}
                      </Button>
                    </>
                  );
                })()}
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
