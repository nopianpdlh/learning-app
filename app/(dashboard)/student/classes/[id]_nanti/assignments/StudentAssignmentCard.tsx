"use client";

/**
 * Student Assignment Card Component
 * Shows assignment details and submission status
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StudentAssignmentCardProps {
  assignment: {
    id: string;
    title: string;
    instructions: string;
    dueDate: Date;
    maxPoints: number;
    attachmentUrl: string | null;
  };
  submission: {
    id: string;
    fileUrl: string;
    status: string;
    score: number | null;
    feedback: string | null;
    submittedAt: Date;
  } | null;
  classId: string;
  studentId: string;
}

export default function StudentAssignmentCard({
  assignment,
  submission,
  classId,
  studentId,
}: StudentAssignmentCardProps) {
  const router = useRouter();
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");

  const now = new Date();
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = now > dueDate;
  const canSubmit = !submission || submission.status !== "GRADED";

  const getTimeRemaining = () => {
    if (isOverdue) return "Terlambat";

    const diff = dueDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} hari lagi`;
    if (hours > 0) return `${hours} jam lagi`;
    return "Kurang dari 1 jam";
  };

  const getStatusBadge = () => {
    if (!submission) {
      if (isOverdue) {
        return (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            Terlambat - Belum Dikumpulkan
          </span>
        );
      }
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          Belum Dikumpulkan
        </span>
      );
    }

    if (submission.status === "GRADED") {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          Sudah Dinilai
        </span>
      );
    }

    if (submission.status === "LATE") {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          Terlambat - Sudah Dikumpulkan
        </span>
      );
    }

    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
        Menunggu Penilaian
      </span>
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Format file tidak didukung. Gunakan PDF, DOCX, JPEG, atau PNG."
      );
      return;
    }

    // Validate file size (20MB max)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Ukuran file maksimal 20MB");
      return;
    }

    setUploadingFile(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "submission");
      formData.append("assignmentId", assignment.id);

      const response = await fetch("/api/assignments/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload file");
      }

      const data = await response.json();
      setFileUrl(data.fileUrl);
      setFileName(data.fileName);
      setSuccess("File berhasil diupload!");
    } catch (err: any) {
      setError(err.message || "Gagal mengupload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async () => {
    if (!fileUrl) {
      setError("Silakan upload file terlebih dahulu");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/assignments/${assignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit assignment");
      }

      setSuccess("Tugas berhasil dikumpulkan!");
      setTimeout(() => {
        router.refresh();
        setShowSubmitForm(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Gagal mengumpulkan tugas");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {assignment.title}
          </h3>
          <div className="flex gap-3 mb-3">
            {getStatusBadge()}
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isOverdue
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {getTimeRemaining()}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Nilai Maksimal</p>
          <p className="text-2xl font-bold text-gray-900">
            {assignment.maxPoints}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-4">
        <p className="text-gray-700 whitespace-pre-wrap">
          {assignment.instructions}
        </p>
      </div>

      {/* Deadline & Attachment */}
      <div className="flex gap-6 mb-4 text-sm text-gray-600">
        <div>
          <span className="font-medium">Deadline:</span>{" "}
          <span className={isOverdue ? "text-red-600" : ""}>
            {formatDate(assignment.dueDate)}
          </span>
        </div>
        {assignment.attachmentUrl && (
          <div>
            <a
              href={assignment.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              📎 Download Lampiran
            </a>
          </div>
        )}
      </div>

      {/* Submission Status */}
      {submission && (
        <div className="border-t border-gray-200 pt-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Pengumpulan Anda</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-gray-600">Dikumpulkan:</p>
                <p className="font-medium">
                  {formatDate(submission.submittedAt)}
                </p>
              </div>
              {submission.score !== null && (
                <div>
                  <p className="text-gray-600">Nilai:</p>
                  <p className="font-medium text-green-600">
                    {submission.score}/{assignment.maxPoints}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-3">
              <a
                href={submission.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                📄 Lihat File Anda
              </a>
            </div>
            {submission.feedback && (
              <div className="mt-3">
                <p className="text-gray-600 text-sm font-medium">Feedback:</p>
                <p className="text-gray-700 text-sm mt-1">
                  {submission.feedback}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Form */}
      {canSubmit && (
        <div className="border-t border-gray-200 pt-4">
          {!showSubmitForm ? (
            <Button onClick={() => setShowSubmitForm(true)} className="w-full">
              {submission ? "Kumpulkan Ulang" : "Kumpulkan Tugas"}
            </Button>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                  {success}
                </div>
              )}

              <div>
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.jpeg,.jpg,.png"
                  disabled={uploadingFile || submitting}
                />
                <p className="text-sm text-gray-500 mt-2">
                  PDF, DOCX, JPEG, PNG (Maksimal 20MB)
                </p>
                {uploadingFile && (
                  <p className="text-sm text-blue-600 mt-2">
                    Mengupload file...
                  </p>
                )}
                {fileName && (
                  <p className="text-sm text-green-600 mt-2">✓ {fileName}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={!fileUrl || submitting || uploadingFile}
                  className="flex-1"
                >
                  {submitting ? "Mengumpulkan..." : "Submit"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSubmitForm(false);
                    setFileUrl("");
                    setFileName("");
                    setError("");
                    setSuccess("");
                  }}
                  disabled={submitting || uploadingFile}
                >
                  Batal
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
