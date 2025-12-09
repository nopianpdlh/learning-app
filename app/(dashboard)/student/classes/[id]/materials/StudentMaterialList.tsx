"use client";

/**
 * Student Material List Component
 * Displays materials with view and download actions
 * Uses signed URLs for Supabase Storage files
 */

import { useState } from "react";
import { getEmbedUrl } from "@/lib/validations/material.schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileText,
  Video,
  Image as ImageIcon,
  File,
  Download,
  Eye,
  ExternalLink,
} from "lucide-react";

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
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "PDF":
        return <FileText className="h-8 w-8 text-red-500" />;
      case "VIDEO":
        return <Video className="h-8 w-8 text-purple-500" />;
      case "IMAGE":
        return <ImageIcon className="h-8 w-8 text-green-500" />;
      case "DOCUMENT":
        return <File className="h-8 w-8 text-blue-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper to detect if URL is YouTube/Vimeo embed
  const isEmbedUrl = (url: string) => {
    return (
      url.includes("youtube.com") ||
      url.includes("youtu.be") ||
      url.includes("vimeo.com") ||
      url.includes("drive.google.com")
    );
  };

  const handleView = async (material: Material) => {
    setCurrentMaterial(material);
    setViewerOpen(true);
    setSignedUrl(null);
    setLoadingUrl(true);

    try {
      // For VIDEO/LINK type - use videoUrl directly (external URLs like YouTube)
      if (
        (material.fileType === "VIDEO" || material.fileType === "LINK") &&
        material.videoUrl
      ) {
        setSignedUrl(material.videoUrl);
        setLoadingUrl(false);
        return;
      }

      // For files in storage (PDF, DOCUMENT, IMAGE) - get signed URL
      if (material.fileUrl) {
        const response = await fetch(
          `/api/materials/${material.id}/signed-url`,
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
      }
    } catch (error) {
      console.error("Failed to get signed URL:", error);
      toast.error("Gagal memuat materi");
    } finally {
      setLoadingUrl(false);
    }
  };

  const handleDownload = async (material: Material) => {
    if (!material.fileUrl) {
      toast.error("Tidak ada file untuk diunduh");
      return;
    }

    try {
      const response = await fetch(`/api/materials/${material.id}/signed-url`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to get download URL");
      }

      const result = await response.json();

      if (!result.success || !result.url) {
        throw new Error("Invalid response from server");
      }

      window.open(result.url, "_blank");
      toast.success("Download dimulai");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Gagal mengunduh file");
    }
  };

  return (
    <>
      <div className="space-y-4">
        {materials.map((material) => (
          <div
            key={material.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 p-2 bg-gray-50 rounded-lg">
                {getFileIcon(material.fileType)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg mb-1">
                      {material.title}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Badge variant="outline">{material.fileType}</Badge>
                      <span>•</span>
                      <span>Pertemuan {material.session}</span>
                      <span>•</span>
                      <span>{formatDate(material.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {material.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {material.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleView(material)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Lihat
                  </Button>

                  {material.fileUrl && material.fileType !== "VIDEO" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(material)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}

                  {material.videoUrl && material.fileType === "VIDEO" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(material.videoUrl!, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Buka di YouTube
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Material Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{currentMaterial?.title}</DialogTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{currentMaterial?.fileType}</Badge>
              <span>Pertemuan {currentMaterial?.session}</span>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto rounded-lg bg-muted min-h-[400px]">
            {loadingUrl ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Memuat materi...</p>
                </div>
              </div>
            ) : signedUrl ? (
              <>
                {currentMaterial?.fileType === "VIDEO" ||
                currentMaterial?.fileType === "LINK" ? (
                  signedUrl && isEmbedUrl(signedUrl) ? (
                    <iframe
                      src={getEmbedUrl(signedUrl) || signedUrl}
                      className="w-full h-full border-0 min-h-[400px]"
                      title={currentMaterial?.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      controls
                      className="w-full h-full object-contain bg-black min-h-[400px]"
                      src={signedUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )
                ) : currentMaterial?.fileType === "IMAGE" ? (
                  <div className="flex items-center justify-center h-full min-h-[400px] p-4">
                    <img
                      src={signedUrl}
                      alt={currentMaterial.title}
                      className="max-w-full max-h-[60vh] object-contain rounded-lg"
                    />
                  </div>
                ) : currentMaterial?.fileType === "PDF" ? (
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(
                      signedUrl
                    )}&embedded=true`}
                    className="w-full h-full border-0 min-h-[400px]"
                    title={currentMaterial.title}
                  />
                ) : (
                  <div className="flex flex-col h-full min-h-[400px]">
                    <iframe
                      src={signedUrl}
                      className="w-full flex-1 border-0"
                      title={currentMaterial?.title}
                    />
                    <div className="p-3 bg-muted border-t text-center text-sm text-muted-foreground">
                      Jika dokumen tidak tampil, klik tombol "Download" untuk
                      mengunduh
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">File tidak tersedia</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Coba klik "Download" untuk mengunduh file
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {currentMaterial?.fileUrl &&
              currentMaterial.fileType !== "VIDEO" && (
                <Button
                  variant="default"
                  onClick={() => handleDownload(currentMaterial)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            {currentMaterial?.videoUrl &&
              currentMaterial.fileType === "VIDEO" && (
                <Button
                  variant="default"
                  onClick={() =>
                    window.open(currentMaterial.videoUrl!, "_blank")
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Buka di YouTube
                </Button>
              )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
