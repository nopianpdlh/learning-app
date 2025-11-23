"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Download,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getSignedUrl } from "@/lib/storage";

interface SubmissionData {
  id: string;
  fileUrl: string;
  status: string;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
  student: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    };
  };
}

interface StudentData {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface AssignmentDetailData {
  id: string;
  title: string;
  instructions: string;
  dueDate: string;
  maxPoints: number;
  attachmentUrl: string | null;
  status: string;
  class: {
    id: string;
    name: string;
    subject: string;
  };
  submissions: SubmissionData[];
  notSubmittedStudents: StudentData[];
  totalStudents: number;
  submittedCount: number;
  gradedCount: number;
}

interface AssignmentDetailClientProps {
  assignment: AssignmentDetailData;
}

export default function AssignmentDetailClient({
  assignment,
}: AssignmentDetailClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingAttachment, setDownloadingAttachment] = useState(false);
  const [downloadingSubmission, setDownloadingSubmission] = useState<
    string | null
  >(null);

  const [gradeData, setGradeData] = useState({
    score: 0,
    feedback: "",
  });

  // Extract file path from Supabase URL
  const extractPathFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(
        /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/
      );
      if (pathMatch) {
        return pathMatch[1];
      }
      return null;
    } catch {
      return null;
    }
  };

  // Handle attachment download with signed URL
  const handleDownloadAttachment = async () => {
    if (!assignment.attachmentUrl) return;

    setDownloadingAttachment(true);
    try {
      const filePath = extractPathFromUrl(assignment.attachmentUrl);
      if (!filePath) {
        toast.error("Invalid file URL");
        return;
      }

      const { url, error } = await getSignedUrl("assignments", filePath, 3600);

      if (error || !url) {
        toast.error(error || "Failed to get file URL");
        return;
      }

      // Open signed URL in new tab
      window.open(url, "_blank");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Gagal membuka file");
    } finally {
      setDownloadingAttachment(false);
    }
  };

  // Handle submission file download with signed URL
  const handleDownloadSubmission = async (
    fileUrl: string,
    submissionId: string
  ) => {
    setDownloadingSubmission(submissionId);
    try {
      const filePath = extractPathFromUrl(fileUrl);
      if (!filePath) {
        toast.error("Invalid file URL");
        return;
      }

      const { url, error } = await getSignedUrl("assignments", filePath, 3600);

      if (error || !url) {
        toast.error(error || "Failed to get file URL");
        return;
      }

      // Open signed URL in new tab
      window.open(url, "_blank");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Gagal membuka file");
    } finally {
      setDownloadingSubmission(null);
    }
  };

  const handleGradeClick = (submission: SubmissionData) => {
    setSelectedSubmission(submission);
    setGradeData({
      score: submission.score || 0,
      feedback: submission.feedback || "",
    });
    setIsGradeDialogOpen(true);
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return;

    try {
      setIsLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Unauthorized");
        return;
      }

      const response = await fetch(
        `/api/assignments/${assignment.id}/submissions/${selectedSubmission.id}/grade`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            score: parseInt(gradeData.score.toString()),
            feedback: gradeData.feedback,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to grade submission");
      }

      toast.success("Submission graded successfully");
      setIsGradeDialogOpen(false);
      setSelectedSubmission(null);
      router.refresh();
    } catch (error) {
      console.error("Error grading submission:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to grade submission"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-700 border-blue-500/20"
          >
            <Clock className="mr-1 h-3 w-3" />
            Belum Dinilai
          </Badge>
        );
      case "GRADED":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-700 border-green-500/20"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Sudah Dinilai
          </Badge>
        );
      case "LATE":
        return (
          <Badge
            variant="outline"
            className="bg-orange-500/10 text-orange-700 border-orange-500/20"
          >
            Terlambat
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-gray-500/10 text-gray-700 border-gray-500/20"
          >
            {status}
          </Badge>
        );
    }
  };

  const isDueDatePassed = new Date(assignment.dueDate) < new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/tutor/assignments")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">
            {assignment.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            {assignment.class.name} - {assignment.class.subject}
          </p>
        </div>
        {assignment.status === "PUBLISHED" ? (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-700 border-green-500/20"
          >
            Published
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-gray-500/10 text-gray-700 border-gray-500/20"
          >
            Draft
          </Badge>
        )}
      </div>

      {/* Assignment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Tugas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Instruksi</Label>
            <p className="mt-1 whitespace-pre-wrap">
              {assignment.instructions}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-muted-foreground">Batas Waktu</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(assignment.dueDate), "dd MMMM yyyy, HH:mm", {
                    locale: idLocale,
                  })}
                </span>
              </div>
              {isDueDatePassed && (
                <p className="text-sm text-red-600 mt-1">
                  Sudah lewat deadline
                </p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">Nilai Maksimal</Label>
              <p className="mt-1 font-semibold">{assignment.maxPoints}</p>
            </div>
            <div>
              {/* <Label className="text-muted-foreground">Lampiran</Label> */}
              {assignment.attachmentUrl ? (
                <Button
                  variant="link"
                  className="h-auto p-0 mt-1 text-blue-600"
                  onClick={handleDownloadAttachment}
                  disabled={downloadingAttachment}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {downloadingAttachment ? "Memuat..." : "Lihat Lampiran"}
                </Button>
              ) : (
                <p className="mt-1 text-muted-foreground">Tidak ada lampiran</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Siswa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignment.totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sudah Dikumpulkan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {assignment.submittedCount}
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
              {assignment.gradedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Belum Mengumpulkan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {assignment.notSubmittedStudents.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          {assignment.submissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada siswa yang mengumpulkan tugas
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Waktu Pengumpulan</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignment.submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={submission.student.user.avatar || undefined}
                          />
                          <AvatarFallback>
                            {submission.student.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {submission.student.user.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {submission.student.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell>
                      {format(
                        new Date(submission.submittedAt),
                        "dd MMM yyyy, HH:mm",
                        { locale: idLocale }
                      )}
                    </TableCell>
                    <TableCell>
                      {submission.score !== null ? (
                        <span className="font-semibold">
                          {submission.score}/{assignment.maxPoints}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownloadSubmission(
                              submission.fileUrl,
                              submission.id
                            )
                          }
                          disabled={downloadingSubmission === submission.id}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {downloadingSubmission === submission.id
                            ? "Memuat..."
                            : "Lihat File"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGradeClick(submission)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {submission.status === "GRADED"
                            ? "Edit Nilai"
                            : "Beri Nilai"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Not Submitted Students */}
      {assignment.notSubmittedStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Siswa Belum Mengumpulkan ({assignment.notSubmittedStudents.length}
              )
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assignment.notSubmittedStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <Avatar>
                    <AvatarImage src={student.user.avatar || undefined} />
                    <AvatarFallback>
                      {student.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{student.user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.user.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grade Dialog */}
      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Beri Nilai Submission</DialogTitle>
            <DialogDescription>
              Berikan nilai dan feedback untuk submission siswa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedSubmission && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium">
                  {selectedSubmission.student.user.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Dikumpulkan:{" "}
                  {format(
                    new Date(selectedSubmission.submittedAt),
                    "dd MMM yyyy, HH:mm",
                    { locale: idLocale }
                  )}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="score">Nilai (0-{assignment.maxPoints}) *</Label>
              <Input
                id="score"
                type="number"
                min="0"
                max={assignment.maxPoints}
                value={gradeData.score}
                onChange={(e) =>
                  setGradeData({
                    ...gradeData,
                    score: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                value={gradeData.feedback}
                onChange={(e) =>
                  setGradeData({ ...gradeData, feedback: e.target.value })
                }
                placeholder="Berikan feedback untuk siswa..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGradeDialogOpen(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button onClick={handleGradeSubmission} disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan Nilai"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
