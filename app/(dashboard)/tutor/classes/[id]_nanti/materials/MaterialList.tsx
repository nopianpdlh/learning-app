"use client";

/**
 * Material List Component
 * Displays materials with edit and delete actions
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/storage";
import { getEmbedUrl } from "@/lib/validations/material.schema";

interface Material {
  id: string;
  title: string;
  description: string | null;
  session: number;
  fileType: string;
  fileUrl: string | null;
  videoUrl: string | null;
  createdAt: Date;
}

interface MaterialListProps {
  materials: Material[];
  classId: string;
}

export default function MaterialList({
  materials,
  classId,
}: MaterialListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (materialId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus materi ini?")) {
      return;
    }

    setDeletingId(materialId);

    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal menghapus materi");
      }

      // Refresh page
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menghapus materi");
      setDeletingId(null);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "PDF":
        return "📄";
      case "VIDEO":
        return "🎥";
      case "IMAGE":
        return "🖼️";
      case "DOCUMENT":
        return "📝";
      default:
        return "📎";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {materials.map((material) => (
        <div
          key={material.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">
                  {getFileIcon(material.fileType)}
                </span>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {material.title}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {material.fileType} • {formatDate(material.createdAt)}
                  </p>
                </div>
              </div>

              {material.description && (
                <p className="text-gray-600 text-sm mb-3">
                  {material.description}
                </p>
              )}

              {/* Video Preview */}
              {material.fileType === "VIDEO" && material.videoUrl && (
                <div className="mb-3">
                  <div className="aspect-video rounded overflow-hidden bg-gray-100">
                    <iframe
                      src={getEmbedUrl(material.videoUrl) || ""}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {material.fileUrl && (
                  <a
                    href={material.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Lihat File
                  </a>
                )}
                {material.videoUrl && material.fileType === "VIDEO" && (
                  <a
                    href={material.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Buka di YouTube/Vimeo
                  </a>
                )}
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(material.id)}
                disabled={deletingId === material.id}
              >
                {deletingId === material.id ? "Menghapus..." : "Hapus"}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
