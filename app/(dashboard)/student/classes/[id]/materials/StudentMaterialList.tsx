"use client";

/**
 * Student Material List Component
 * Displays materials with view and download actions
 */

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

interface StudentMaterialListProps {
  materials: Material[];
}

export default function StudentMaterialList({
  materials,
}: StudentMaterialListProps) {
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

  const handleDownload = async (fileUrl: string, title: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = title;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert("Gagal mengunduh file");
    }
  };

  return (
    <div className="space-y-4">
      {materials.map((material) => (
        <div
          key={material.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl shrink-0">
              {getFileIcon(material.fileType)}
            </span>

            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 text-lg mb-1">
                {material.title}
              </h4>
              <p className="text-sm text-gray-500 mb-2">
                {material.fileType} • {formatDate(material.createdAt)}
              </p>

              {material.description && (
                <p className="text-gray-600 text-sm mb-3">
                  {material.description}
                </p>
              )}

              {/* Video Preview */}
              {material.fileType === "VIDEO" && material.videoUrl && (
                <div className="mb-4">
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

              {/* Actions */}
              <div className="flex gap-3">
                {material.fileUrl && material.fileType !== "VIDEO" && (
                  <>
                    <a
                      href={material.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      👁️ Lihat
                    </a>
                    <button
                      onClick={() =>
                        handleDownload(material.fileUrl!, material.title)
                      }
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      ⬇️ Download
                    </button>
                  </>
                )}
                {material.videoUrl && material.fileType === "VIDEO" && (
                  <a
                    href={material.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    ▶️ Buka di YouTube/Vimeo
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
