"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Video,
  Download,
  BookmarkPlus,
  Bookmark,
  Play,
  Eye,
  Search,
  Filter,
  Clock,
  FileType,
} from "lucide-react";
import { toast } from "sonner";

interface Material {
  id: string;
  title: string;
  description: string | null;
  session: number;
  fileType: string;
  fileUrl: string | null;
  videoUrl: string | null;
  thumbnail: string | null;
  viewCount: number;
  downloadCount: number;
  createdAt: Date;
  class: {
    id: string;
    name: string;
    subject: string;
  };
  bookmarked: boolean;
}

interface MaterialsClientProps {
  initialMaterials: Material[];
  initialStats: {
    total: number;
    byType: Record<string, number>;
    byClass: Record<string, number>;
  };
}

export default function MaterialsClient({
  initialMaterials,
  initialStats,
}: MaterialsClientProps) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);

  const toggleBookmark = async (id: string) => {
    try {
      const response = await fetch(`/api/student/materials/${id}/bookmark`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle bookmark");
      }

      const data = await response.json();

      // Update local state
      setMaterials(
        materials.map((mat) =>
          mat.id === id ? { ...mat, bookmarked: data.bookmarked } : mat
        )
      );

      toast.success(
        data.bookmarked ? "Materi ditambahkan ke bookmark" : "Bookmark dihapus"
      );
    } catch (error) {
      toast.error("Gagal mengubah bookmark");
    }
  };

  const handleDownload = async (material: Material) => {
    if (!material.fileUrl && !material.videoUrl) {
      toast.error("Tidak ada file untuk diunduh");
      return;
    }

    try {
      // Get signed URL from server
      const response = await fetch(`/api/materials/${material.id}/signed-url`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get download URL");
      }

      const result = await response.json();

      if (!result.success || !result.url) {
        throw new Error("Invalid response from server");
      }

      // Open signed URL in new tab
      window.open(result.url, "_blank");
      toast.success("Download dimulai", {
        description: "File sedang diunduh",
      });

      // Update download count in background
      fetch(`/api/student/materials/${material.id}/download`, {
        method: "POST",
      }).catch((err) => console.error("Failed to update download count:", err));
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Gagal mengunduh", {
        description:
          error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    }
  };

  const handleView = async (material: Material) => {
    setCurrentMaterial(material);
    setViewerOpen(true);
    setSignedUrl(null);
    setLoadingUrl(true);

    try {
      // Track view in background
      fetch(`/api/student/materials/${material.id}/view`, {
        method: "POST",
      }).catch((err) => console.error("Failed to track view:", err));

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
    } finally {
      setLoadingUrl(false);
    }
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

  // Convert YouTube URL to embed URL
  const getEmbedUrl = (url: string) => {
    // YouTube watch URL -> embed URL
    if (url.includes("youtube.com/watch")) {
      const videoId = new URL(url).searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    // YouTube short URL
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    // Already an embed URL or other provider
    return url;
  };

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (material.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ??
        false);
    const matchesSubject =
      selectedSubject === "all" || material.class.subject === selectedSubject;
    const matchesType =
      selectedType === "all" ||
      material.fileType.toLowerCase() === selectedType.toLowerCase();
    return matchesSearch && matchesSubject && matchesType;
  });

  const bookmarkedMaterials = filteredMaterials.filter((m) => m.bookmarked);
  const videoMaterials = filteredMaterials.filter(
    (m) => m.fileType.toLowerCase() === "video"
  );
  const pdfMaterials = filteredMaterials.filter(
    (m) => m.fileType.toLowerCase() === "pdf"
  );

  const subjects = Array.from(new Set(materials.map((m) => m.class.subject)));

  const MaterialCard = ({ material }: { material: Material }) => {
    // Generate thumbnail if not provided
    const thumbnail =
      material.thumbnail ||
      (material.fileType === "VIDEO"
        ? "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80"
        : "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&q=80");

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-video bg-muted">
          <Image
            src={thumbnail}
            alt={material.title}
            fill
            className="object-cover object-top"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Badge
              variant={material.fileType === "VIDEO" ? "default" : "secondary"}
            >
              {material.fileType === "VIDEO" ? (
                <Video className="h-3 w-3 mr-1" />
              ) : (
                <FileText className="h-3 w-3 mr-1" />
              )}
              {material.fileType}
            </Badge>
          </div>
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-14 w-14 rounded-full opacity-90 hover:opacity-100"
            onClick={() => handleView(material)}
          >
            {material.fileType === "VIDEO" ? (
              <Play className="h-6 w-6" />
            ) : (
              <Eye className="h-6 w-6" />
            )}
          </Button>
        </div>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2">
                {material.title}
              </CardTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">{material.class.subject}</Badge>
                <Badge variant="outline">Pertemuan {material.session}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {material.class.name}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleBookmark(material.id)}
            >
              {material.bookmarked ? (
                <Bookmark className="h-5 w-5 fill-primary text-primary" />
              ) : (
                <BookmarkPlus className="h-5 w-5" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {material.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                {material.downloadCount}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(material)}
            >
              <Download className="h-4 w-4 mr-1" />
              Unduh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Materi Pembelajaran
          </h1>
          <p className="text-muted-foreground mt-2">
            Akses semua materi pembelajaran dari kelas yang kamu ikuti
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari materi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:col-span-3">
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                >
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Mata Pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Mata Pelajaran</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <FileType className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tipe Materi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Materials Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="all">
              Semua ({filteredMaterials.length})
            </TabsTrigger>
            <TabsTrigger value="bookmarked">
              <Bookmark className="h-4 w-4 mr-2" />
              Bookmark ({bookmarkedMaterials.length})
            </TabsTrigger>
            <TabsTrigger value="video">
              <Video className="h-4 w-4 mr-2" />
              Video ({videoMaterials.length})
            </TabsTrigger>
            <TabsTrigger value="pdf">
              <FileText className="h-4 w-4 mr-2" />
              PDF ({pdfMaterials.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bookmarked" className="space-y-6">
            {bookmarkedMaterials.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada materi yang di-bookmark</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarkedMaterials.map((material) => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="video" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoMaterials.map((material) => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pdf" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pdfMaterials.map((material) => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Material Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{currentMaterial?.title}</DialogTitle>
            <div className="text-sm text-muted-foreground">
              <Badge variant="outline">{currentMaterial?.class.subject}</Badge>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto rounded-lg bg-muted min-h-[400px]">
            {loadingUrl ? (
              // Loading state
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Memuat materi...</p>
                </div>
              </div>
            ) : signedUrl ? (
              // Content viewer with signed URL - handle different file types
              <>
                {currentMaterial?.fileType === "VIDEO" ||
                currentMaterial?.fileType === "LINK" ? (
                  // Video/Link viewer - use iframe for YouTube/Vimeo, video tag for direct files
                  signedUrl && isEmbedUrl(signedUrl) ? (
                    <iframe
                      src={getEmbedUrl(signedUrl)}
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
                  // Image viewer - centered with proper sizing
                  <div className="flex items-center justify-center h-full min-h-[400px] p-4">
                    <img
                      src={signedUrl}
                      alt={currentMaterial.title}
                      className="max-w-full max-h-[60vh] object-contain rounded-lg"
                    />
                  </div>
                ) : currentMaterial?.fileType === "PDF" ? (
                  // PDF viewer - use Google Docs viewer for better compatibility
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(
                      signedUrl
                    )}&embedded=true`}
                    className="w-full h-full border-0 min-h-[400px]"
                    title={currentMaterial.title}
                  />
                ) : (
                  // Other documents (DOCUMENT, LINK) - try iframe, with fallback message
                  <div className="flex flex-col h-full min-h-[400px]">
                    <iframe
                      src={signedUrl}
                      className="w-full flex-1 border-0"
                      title={currentMaterial?.title}
                    />
                    <div className="p-3 bg-muted border-t text-center text-sm text-muted-foreground">
                      Jika dokumen tidak tampil, klik tombol "Unduh Materi"
                      untuk mengunduh
                    </div>
                  </div>
                )}
              </>
            ) : (
              // No URL available
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                  {currentMaterial?.fileType === "VIDEO" ? (
                    <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  ) : (
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  )}
                  <p className="text-muted-foreground">
                    {currentMaterial?.fileType === "VIDEO"
                      ? "URL video tidak tersedia"
                      : "File tidak tersedia"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Coba klik "Unduh Materi" untuk mengunduh file
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() =>
                currentMaterial && toggleBookmark(currentMaterial.id)
              }
            >
              {currentMaterial?.bookmarked ? (
                <>
                  <Bookmark className="h-4 w-4 mr-2 fill-primary text-primary" />
                  Hapus Bookmark
                </>
              ) : (
                <>
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  Tambah Bookmark
                </>
              )}
            </Button>
            <Button
              onClick={() => currentMaterial && handleDownload(currentMaterial)}
            >
              <Download className="h-4 w-4 mr-2" />
              Unduh Materi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
