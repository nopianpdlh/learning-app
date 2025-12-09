"use client";

/**
 * AssignmentsClient Component
 * Client-side component for student assignments with submit and view functionality
 */

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  FileText,
  Calendar,
  Eye,
  Download,
  Loader2,
  File,
  AlertTriangle,
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
}

interface Assignment {
  id: string;
  title: string;
  instructions: string;
  dueDate: string;
  maxPoints: number;
  attachmentUrl: string | null;
  createdAt: string;
  class: {
    id: string;
    name: string;
    subject: string;
  };
  isPastDue: boolean;
  effectiveStatus: string;
  submission: Submission | null;
}

interface Stats {
  total: number;
  pending: number;
  submitted: number;
  graded: number;
  late: number;
}

interface AssignmentsClientProps {
  initialAssignments: Assignment[];
  initialStats: Stats;
}

// Allowed file types
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png"];
const MAX_FILE_SIZE_MB = 10;

export default function AssignmentsClient({
  initialAssignments,
  initialStats,
}: AssignmentsClientProps) {
  const [assignments, setAssignments] =
    useState<Assignment[]>(initialAssignments);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [filter, setFilter] = useState<string>("all");

  // Submit dialog state
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detail dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailAssignment, setDetailAssignment] = useState<Assignment | null>(
    null
  );
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingSignedUrl, setLoadingSignedUrl] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
          >
            Belum Dikerjakan
          </Badge>
        );
      case "SUBMITTED":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-700 border-blue-500/20"
          >
            Sudah Submit
          </Badge>
        );
      case "GRADED":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-700 border-green-500/20"
          >
            Sudah Dinilai
          </Badge>
        );
      case "LATE":
        return (
          <Badge
            variant="outline"
            className="bg-orange-500/10 text-orange-700 border-orange-500/20"
          >
            Submit Terlambat
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-700 border-red-500/20"
          >
            Terlambat
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "SUBMITTED":
        return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
      case "GRADED":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "LATE":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case "OVERDUE":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getFilteredAssignments = () => {
    if (filter === "all") return assignments;
    if (filter === "pending")
      return assignments.filter((a) => a.effectiveStatus === "PENDING");
    if (filter === "submitted")
      return assignments.filter((a) => a.effectiveStatus === "SUBMITTED");
    if (filter === "graded")
      return assignments.filter((a) => a.effectiveStatus === "GRADED");
    if (filter === "late")
      return assignments.filter(
        (a) => a.effectiveStatus === "LATE" || a.effectiveStatus === "OVERDUE"
      );
    return assignments;
  };

  const openSubmitDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSelectedFile(null);
    setSubmitDialogOpen(true);
  };

  const openDetailDialog = async (assignment: Assignment) => {
    setDetailAssignment(assignment);
    setDetailDialogOpen(true);
    setSignedUrl(null);

    // Get signed URL for submitted file
    if (assignment.submission?.fileUrl) {
      setLoadingSignedUrl(true);
      try {
        const response = await fetch(
          `/api/submissions/${assignment.submission.id}/signed-url`,
          {
            method: "POST",
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.url) {
            setSignedUrl(data.url);
          }
        }
      } catch (error) {
        console.error("Failed to get signed URL:", error);
      } finally {
        setLoadingSignedUrl(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Ukuran file melebihi ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    // Validate file type
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(
        `Tipe file tidak didukung. Gunakan: ${ALLOWED_EXTENSIONS.join(", ")}`
      );
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedAssignment || !selectedFile) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        `/api/student/assignments/${selectedAssignment.id}/submit`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit");
      }

      const result = await response.json();

      // Refresh assignments
      const refreshResponse = await fetch("/api/student/assignments");
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setAssignments(data.assignments);
        setStats(data.stats);
      }

      toast.success(result.message);
      setSubmitDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal submit tugas"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID");
  };

  const getTimeRemaining = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();

    if (diff < 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} hari ${hours} jam lagi`;
    if (hours > 0) return `${hours} jam lagi`;
    return "Segera berakhir!";
  };

  const filteredAssignments = getFilteredAssignments();

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tugas</h1>
          <p className="text-muted-foreground mt-1">
            Kelola dan submit tugas Anda
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tugas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Belum Dikerjakan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sudah Submit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.submitted}
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
        </div>

        {/* Tabs Filter */}
        <Tabs defaultValue="all" className="w-full" onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">Semua ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">
              Belum Dikerjakan ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="submitted">
              Sudah Submit ({stats.submitted})
            </TabsTrigger>
            <TabsTrigger value="graded">
              Sudah Dinilai ({stats.graded})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6 space-y-4">
            {filteredAssignments.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Tidak ada tugas</p>
                </CardContent>
              </Card>
            ) : (
              filteredAssignments.map((assignment) => (
                <Card
                  key={assignment.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="shrink-0">
                          {getStatusIcon(assignment.effectiveStatus)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">
                              {assignment.title}
                            </h3>
                            {getStatusBadge(assignment.effectiveStatus)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {assignment.class.name} • {assignment.class.subject}
                          </p>
                          {assignment.instructions && (
                            <p className="text-sm text-foreground/80 line-clamp-2">
                              {assignment.instructions}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Deadline: {formatShortDate(assignment.dueDate)}
                              </span>
                              {!assignment.isPastDue && (
                                <span className="text-orange-600 font-medium ml-2">
                                  ({getTimeRemaining(assignment.dueDate)})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span>{assignment.maxPoints} poin</span>
                            </div>
                          </div>
                          {assignment.submission?.submittedAt && (
                            <p className="text-sm text-muted-foreground">
                              Submit:{" "}
                              {formatShortDate(
                                assignment.submission.submittedAt
                              )}
                            </p>
                          )}
                          {assignment.submission &&
                            assignment.submission.score !== null && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  Nilai:
                                </span>
                                <Badge className="bg-primary/10 text-primary border-primary/20">
                                  {assignment.submission.score}/
                                  {assignment.maxPoints}
                                </Badge>
                              </div>
                            )}
                          {assignment.submission?.feedback && (
                            <div className="bg-muted/50 p-3 rounded-md">
                              <p className="text-sm font-medium mb-1">
                                Feedback dari Tutor:
                              </p>
                              <p className="text-sm text-foreground/80">
                                {assignment.submission.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 lg:shrink-0">
                        {(assignment.effectiveStatus === "PENDING" ||
                          assignment.effectiveStatus === "OVERDUE") && (
                          <Button
                            className="w-full lg:w-auto"
                            variant={
                              assignment.effectiveStatus === "OVERDUE"
                                ? "destructive"
                                : "default"
                            }
                            onClick={() => openSubmitDialog(assignment)}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {assignment.effectiveStatus === "OVERDUE"
                              ? "Submit Terlambat"
                              : "Submit Tugas"}
                          </Button>
                        )}
                        {(assignment.effectiveStatus === "SUBMITTED" ||
                          assignment.effectiveStatus === "LATE") && (
                          <>
                            <Button
                              variant="outline"
                              className="w-full lg:w-auto"
                              onClick={() => openDetailDialog(assignment)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Lihat Detail
                            </Button>
                            {!assignment.isPastDue && (
                              <Button
                                variant="secondary"
                                className="w-full lg:w-auto"
                                onClick={() => openSubmitDialog(assignment)}
                              >
                                <Upload className="mr-2 h-4 w-4" />
                                Submit Ulang
                              </Button>
                            )}
                          </>
                        )}
                        {assignment.effectiveStatus === "GRADED" && (
                          <Button
                            variant="outline"
                            className="w-full lg:w-auto"
                            onClick={() => openDetailDialog(assignment)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Lihat Detail
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Submit Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Tugas</DialogTitle>
            <DialogDescription>{selectedAssignment?.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedAssignment?.isPastDue && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">
                    Perhatian: Deadline sudah lewat
                  </span>
                </div>
                <p className="text-sm text-orange-600 mt-1">
                  Tugas ini akan tercatat sebagai submit terlambat
                </p>
              </div>
            )}

            {selectedAssignment?.submission && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">
                    Anda akan melakukan submit ulang
                  </span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  File sebelumnya akan digantikan dengan file baru
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Instructions</Label>
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg max-h-32 overflow-y-auto">
                {selectedAssignment?.instructions}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Upload File</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={ALLOWED_EXTENSIONS.join(",")}
              />
              <p className="text-xs text-muted-foreground">
                Format: {ALLOWED_EXTENSIONS.join(", ")} • Max:{" "}
                {MAX_FILE_SIZE_MB}MB
              </p>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <File className="h-4 w-4 text-primary" />
                <span className="text-sm flex-1 truncate">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSubmitDialogOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedFile || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengunggah...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detailAssignment?.title}</DialogTitle>
            <DialogDescription>
              {detailAssignment?.class.name} • {detailAssignment?.class.subject}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Assignment Details */}
            <div className="space-y-2">
              <Label>Instructions</Label>
              <div className="text-sm bg-muted p-3 rounded-lg">
                {detailAssignment?.instructions}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Deadline</Label>
                <p className="text-sm mt-1">
                  {detailAssignment && formatDate(detailAssignment.dueDate)}
                </p>
              </div>
              <div>
                <Label>Poin Maksimal</Label>
                <p className="text-sm mt-1">{detailAssignment?.maxPoints}</p>
              </div>
            </div>

            {/* Submission Details */}
            {detailAssignment?.submission && (
              <>
                <hr />
                <div className="space-y-4">
                  <h4 className="font-semibold">Submission Anda</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Status</Label>
                      <div className="mt-1">
                        {getStatusBadge(detailAssignment.submission.status)}
                      </div>
                    </div>
                    <div>
                      <Label>Waktu Submit</Label>
                      <p className="text-sm mt-1">
                        {formatDate(detailAssignment.submission.submittedAt)}
                      </p>
                    </div>
                  </div>

                  {/* File Preview */}
                  <div>
                    <Label>File yang Disubmit</Label>
                    <div className="mt-2">
                      {loadingSignedUrl ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Memuat file...
                        </div>
                      ) : signedUrl ? (
                        <Button
                          variant="outline"
                          onClick={() => window.open(signedUrl, "_blank")}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Lihat/Download File
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          File tidak tersedia
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  {detailAssignment.submission.score !== null && (
                    <div>
                      <Label>Nilai</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary">
                          {detailAssignment.submission.score}
                        </span>
                        <span className="text-muted-foreground">
                          / {detailAssignment.maxPoints}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  {detailAssignment.submission.feedback && (
                    <div>
                      <Label>Feedback dari Tutor</Label>
                      <div className="mt-2 bg-muted p-3 rounded-lg">
                        <p className="text-sm">
                          {detailAssignment.submission.feedback}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailDialogOpen(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
