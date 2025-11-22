"use client";

/**
 * Material Upload Form Component
 * Handles file uploads and video URL submissions
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MaterialUploadFormProps {
  classId: string;
}

export default function MaterialUploadForm({
  classId,
}: MaterialUploadFormProps) {
  const [uploadType, setUploadType] = useState<"file" | "video">("file");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [session, setSession] = useState("1");

  // Video upload state
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoSession, setVideoSession] = useState("1");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-populate title from filename if empty
      if (!title) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Pilih file terlebih dahulu");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("classId", classId);
      formData.append("session", session);
      formData.append("title", title);
      if (description) formData.append("description", description);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload gagal");
      }

      setSuccess("File berhasil diupload!");
      // Reset form
      setFile(null);
      setTitle("");
      setDescription("");
      setSession("1");
      // Reset file input
      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Refresh page after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) {
      setError("Masukkan URL video");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId,
          title: videoTitle,
          description: videoDescription || null,
          session: parseInt(videoSession),
          fileType: "VIDEO",
          videoUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menambahkan video");
      }

      setSuccess("Video berhasil ditambahkan!");
      // Reset form
      setVideoUrl("");
      setVideoTitle("");
      setVideoDescription("");
      setVideoSession("1");

      // Refresh page after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Materi</h2>

      {/* Type Selector */}
      <div className="flex gap-4 mb-6">
        <Button
          type="button"
          variant={uploadType === "file" ? "default" : "outline"}
          onClick={() => setUploadType("file")}
        >
          Upload File
        </Button>
        <Button
          type="button"
          variant={uploadType === "video" ? "default" : "outline"}
          onClick={() => setUploadType("video")}
        >
          Tambah Video
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">
          {success}
        </div>
      )}

      {/* File Upload Form */}
      {uploadType === "file" && (
        <form onSubmit={handleFileSubmit} className="space-y-4">
          <div>
            <Label htmlFor="session">Pertemuan *</Label>
            <Input
              id="session"
              type="number"
              min="1"
              max="100"
              value={session}
              onChange={(e) => setSession(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="file-upload">File *</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Format: PDF, DOCX, PPTX, JPG, PNG, WEBP (Max 50MB)
            </p>
          </div>

          <div>
            <Label htmlFor="title">Judul *</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nama materi"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <textarea
              id="description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi materi (opsional)"
            />
          </div>

          <Button type="submit" disabled={loading || !file}>
            {loading ? "Mengupload..." : "Upload File"}
          </Button>
        </form>
      )}

      {/* Video URL Form */}
      {uploadType === "video" && (
        <form onSubmit={handleVideoSubmit} className="space-y-4">
          <div>
            <Label htmlFor="video-session">Pertemuan *</Label>
            <Input
              id="video-session"
              type="number"
              min="1"
              max="100"
              value={videoSession}
              onChange={(e) => setVideoSession(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="video-url">URL Video *</Label>
            <Input
              id="video-url"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              required
            />
            <p className="text-sm text-gray-500 mt-1">YouTube atau Vimeo URL</p>
          </div>

          <div>
            <Label htmlFor="video-title">Judul *</Label>
            <Input
              id="video-title"
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Nama video"
              required
            />
          </div>

          <div>
            <Label htmlFor="video-description">Deskripsi</Label>
            <textarea
              id="video-description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={videoDescription}
              onChange={(e) => setVideoDescription(e.target.value)}
              placeholder="Deskripsi video (opsional)"
            />
          </div>

          <Button type="submit" disabled={loading || !videoUrl}>
            {loading ? "Menambahkan..." : "Tambah Video"}
          </Button>
        </form>
      )}
    </div>
  );
}
