"use client";

/**
 * Assignment Form Component
 * Used for creating and editing assignments
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AssignmentFormProps {
  classId: string;
  initialData?: {
    id: string;
    title: string;
    instructions: string;
    dueDate: Date;
    maxPoints: number;
    attachmentUrl: string | null;
    status: "DRAFT" | "PUBLISHED";
  };
}

export default function AssignmentForm({
  classId,
  initialData,
}: AssignmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [title, setTitle] = useState(initialData?.title || "");
  const [instructions, setInstructions] = useState(
    initialData?.instructions || ""
  );
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate
      ? new Date(initialData.dueDate).toISOString().slice(0, 16)
      : ""
  );
  const [maxPoints, setMaxPoints] = useState(initialData?.maxPoints || 100);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(
    initialData?.status || "DRAFT"
  );
  const [attachmentUrl, setAttachmentUrl] = useState(
    initialData?.attachmentUrl || ""
  );
  const [fileName, setFileName] = useState("");

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
      formData.append("type", "attachment");
      formData.append("assignmentId", initialData?.id || "temp");

      const response = await fetch("/api/assignments/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload file");
      }

      const data = await response.json();
      setAttachmentUrl(data.fileUrl);
      setFileName(data.fileName);
      setSuccess("File berhasil diupload!");
    } catch (err: any) {
      setError(err.message || "Gagal mengupload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        classId,
        title,
        instructions,
        dueDate: new Date(dueDate).toISOString(),
        maxPoints: Number(maxPoints),
        attachmentUrl: attachmentUrl || undefined,
        status,
      };

      const url = initialData
        ? `/api/assignments/${initialData.id}`
        : "/api/assignments";
      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save assignment");
      }

      setSuccess(
        initialData ? "Tugas berhasil diupdate!" : "Tugas berhasil dibuat!"
      );

      // Redirect after short delay
      setTimeout(() => {
        router.push(`/tutor/classes/${classId}/assignments`);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan tugas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {success}
        </div>
      )}

      {/* Title */}
      <div>
        <Label htmlFor="title">Judul Tugas *</Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: Essay tentang Algoritma Sorting"
          required
          minLength={3}
          maxLength={200}
          className="mt-1"
        />
        <p className="text-sm text-gray-500 mt-1">
          3-200 karakter ({title.length}/200)
        </p>
      </div>

      {/* Instructions */}
      <div>
        <Label htmlFor="instructions">Instruksi Tugas *</Label>
        <textarea
          id="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Jelaskan detail tugas yang harus dikerjakan siswa..."
          required
          minLength={10}
          maxLength={5000}
          rows={8}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          10-5000 karakter ({instructions.length}/5000)
        </p>
      </div>

      {/* Due Date */}
      <div>
        <Label htmlFor="dueDate">Deadline *</Label>
        <Input
          id="dueDate"
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
          min={new Date().toISOString().slice(0, 16)}
          className="mt-1"
        />
        <p className="text-sm text-gray-500 mt-1">
          Tanggal dan waktu batas pengumpulan tugas
        </p>
      </div>

      {/* Max Points */}
      <div>
        <Label htmlFor="maxPoints">Nilai Maksimal *</Label>
        <Input
          id="maxPoints"
          type="number"
          value={maxPoints}
          onChange={(e) => setMaxPoints(Number(e.target.value))}
          required
          min={1}
          max={1000}
          className="mt-1"
        />
        <p className="text-sm text-gray-500 mt-1">
          Nilai maksimal untuk tugas ini (1-1000)
        </p>
      </div>

      {/* File Attachment */}
      <div>
        <Label htmlFor="attachment">Lampiran (Opsional)</Label>
        <Input
          id="attachment"
          type="file"
          onChange={handleFileUpload}
          accept=".pdf,.docx,.jpeg,.jpg,.png"
          disabled={uploadingFile}
          className="mt-1"
        />
        <p className="text-sm text-gray-500 mt-1">
          PDF, DOCX, JPEG, PNG (Maksimal 20MB)
        </p>
        {uploadingFile && (
          <p className="text-sm text-blue-600 mt-2">Mengupload file...</p>
        )}
        {fileName && (
          <p className="text-sm text-green-600 mt-2">✓ {fileName}</p>
        )}
      </div>

      {/* Status */}
      <div>
        <Label htmlFor="status">Status *</Label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="DRAFT">Draft (Belum terlihat siswa)</option>
          <option value="PUBLISHED">
            Published (Siswa dapat melihat & mengerjakan)
          </option>
        </select>
        <p className="text-sm text-gray-500 mt-1">
          {status === "PUBLISHED"
            ? "⚠️ Siswa akan mendapat notifikasi saat tugas dipublish"
            : "Simpan sebagai draft untuk mengedit nanti"}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading || uploadingFile}
          className="flex-1"
        >
          {loading
            ? "Menyimpan..."
            : initialData
            ? "Update Tugas"
            : "Buat Tugas"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
