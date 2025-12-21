"use client";

/**
 * TutorMaterialsClient Component
 * Client-side component for managing learning materials with full CRUD operations
 * Features: file upload, video URL embedding, reference linking, analytics tracking
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Video,
  Link as LinkIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  Eye,
  Upload,
  Copy,
  Image as ImageIcon,
  FileUp,
  AlertCircle,
} from "lucide-react";

// Types
type Material = {
  id: string;
  classId: string;
  title: string;
  description: string | null;
  session: number;
  fileType: string;
  fileUrl: string | null;
  videoUrl: string | null;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  class: {
    id: string;
    name: string;
  };
};

type Class = {
  id: string;
  name: string;
};

type Stats = {
  total: number;
  byFileType: {
    PDF: number;
    VIDEO: number;
    LINK: number;
    DOCUMENT: number;
    IMAGE: number;
  };
  totalViews: number;
  totalDownloads: number;
};

type Props = {
  materials: Material[];
  classes: Class[];
  stats: Stats;
};

type FormData = {
  classId: string;
  title: string;
  description: string;
  session: number;
  fileType: string;
  file: File | null;
  videoUrl: string;
};

const ALLOWED_FILE_TYPES = {
  PDF: [".pdf"],
  DOCUMENT: [".doc", ".docx", ".ppt", ".pptx"],
  IMAGE: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
};

const MAX_FILE_SIZE_MB = 50;

export default function TutorMaterialsClient({
  materials: initialMaterials,
  classes,
  stats: initialStats,
}: Props) {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    classId: "",
    title: "",
    description: "",
    session: 1,
    fileType: "PDF",
    file: null,
    videoUrl: "",
  });

  // Copy material state
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Filter materials
  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.class.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === "all" || material.fileType === filterType.toUpperCase();
    return matchesSearch && matchesType;
  });

  // Helper functions
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <FileText className="h-5 w-5 text-red-600" />;
      case "VIDEO":
      case "LINK":
        return <Video className="h-5 w-5 text-purple-600" />;
      case "DOCUMENT":
        return <FileUp className="h-5 w-5 text-blue-600" />;
      case "IMAGE":
        return <ImageIcon className="h-5 w-5 text-green-600" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      PDF: "bg-red-500/10 text-red-700 border-red-500/20",
      VIDEO: "bg-purple-500/10 text-purple-700 border-purple-500/20",
      LINK: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      DOCUMENT: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
      IMAGE: "bg-green-500/10 text-green-700 border-green-500/20",
    };
    return (
      <Badge variant="outline" className={variants[type] || ""}>
        {type}
      </Badge>
    );
  };

  const resetForm = () => {
    setFormData({
      classId: "",
      title: "",
      description: "",
      session: 1,
      fileType: "PDF",
      file: null,
      videoUrl: "",
    });
    setError(null);
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`;
    }

    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
    const allowedExts =
      ALLOWED_FILE_TYPES[formData.fileType as keyof typeof ALLOWED_FILE_TYPES];

    if (allowedExts && !allowedExts.includes(fileExt)) {
      return `Invalid file type. Allowed: ${allowedExts.join(", ")}`;
    }

    return null;
  };

  // CRUD Handlers
  const handleCreateMaterial = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }
      if (!formData.classId) {
        throw new Error("Class is required");
      }
      if (formData.session < 1 || formData.session > 100) {
        throw new Error("Session must be between 1 and 100");
      }

      // Check file or video URL based on fileType
      if (formData.fileType === "VIDEO" || formData.fileType === "LINK") {
        if (!formData.videoUrl.trim()) {
          throw new Error("Video URL is required for VIDEO/LINK type");
        }
      } else {
        if (!formData.file) {
          throw new Error("File is required for this material type");
        }
        const fileError = validateFile(formData.file);
        if (fileError) {
          throw new Error(fileError);
        }
      }

      let result;

      // If file upload, use /api/upload (handles both upload and create material)
      if (formData.file) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", formData.file);
        uploadFormData.append("classId", formData.classId);
        uploadFormData.append("title", formData.title);
        uploadFormData.append("description", formData.description || "");
        uploadFormData.append("session", formData.session.toString());

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          throw new Error(uploadError.error || "Failed to upload file");
        }

        result = await uploadResponse.json();
      } else {
        // For video/link, use /api/materials
        const response = await fetch("/api/materials", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classId: formData.classId,
            title: formData.title,
            description: formData.description || null,
            session: formData.session,
            fileType: formData.fileType,
            fileUrl: null,
            videoUrl: formData.videoUrl,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.details && Array.isArray(errorData.details)) {
            const errorMessages = errorData.details
              .map(
                (detail: { field: string; message: string }) => detail.message
              )
              .join(", ");
            throw new Error(errorMessages);
          }
          throw new Error(errorData.error || "Failed to create material");
        }

        result = await response.json();
      }

      // Update local state
      const newMaterial = {
        ...result.data,
        class: classes.find((c) => c.id === formData.classId)!,
      };
      setMaterials([newMaterial, ...materials]);

      // Update stats
      const newStats = {
        ...stats,
        total: stats.total + 1,
        byFileType: {
          ...stats.byFileType,
          [formData.fileType as keyof typeof stats.byFileType]:
            stats.byFileType[
              formData.fileType as keyof typeof stats.byFileType
            ] + 1,
        },
      };
      setStats(newStats);

      // Reset and close
      resetForm();
      setIsCreateDialogOpen(false);
      router.refresh();

      toast.success("Materi berhasil dibuat", {
        description: `${formData.title} telah ditambahkan ke kelas`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("Gagal membuat materi", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMaterial = async () => {
    if (!selectedMaterial) return;

    setIsLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }
      if (formData.session < 1 || formData.session > 100) {
        throw new Error("Session must be between 1 and 100");
      }

      let fileUrl = selectedMaterial.fileUrl;

      // Upload new file if provided
      if (formData.file) {
        const fileError = validateFile(formData.file);
        if (fileError) {
          throw new Error(fileError);
        }

        const uploadFormData = new FormData();
        uploadFormData.append("file", formData.file);
        uploadFormData.append("bucket", "materials");
        uploadFormData.append("folder", `class-${selectedMaterial.classId}`);

        const uploadResponse = await fetch("/api/upload/file", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          throw new Error(uploadError.error || "Failed to upload file");
        }

        const uploadData = await uploadResponse.json();
        // Use path for private bucket
        fileUrl = uploadData.data.path || uploadData.data.publicUrl;
      }

      // Update material
      const response = await fetch(`/api/materials/${selectedMaterial.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          session: formData.session,
          fileType: formData.fileType,
          fileUrl:
            formData.fileType === "VIDEO" || formData.fileType === "LINK"
              ? null // Clear fileUrl when switching to video/link
              : fileUrl,
          videoUrl:
            formData.fileType === "VIDEO" || formData.fileType === "LINK"
              ? formData.videoUrl
              : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details
            .map((detail: { field: string; message: string }) => detail.message)
            .join(", ");
          throw new Error(errorMessages);
        }
        throw new Error(errorData.error || "Failed to update material");
      }

      const result = await response.json();

      // Update local state
      const updatedMaterial = {
        ...result.data,
        class: selectedMaterial.class,
      };
      setMaterials(
        materials.map((m) =>
          m.id === selectedMaterial.id ? updatedMaterial : m
        )
      );

      // Update stats if fileType changed
      if (selectedMaterial.fileType !== formData.fileType) {
        const newStats = {
          ...stats,
          byFileType: {
            ...stats.byFileType,
            [selectedMaterial.fileType as keyof typeof stats.byFileType]:
              stats.byFileType[
                selectedMaterial.fileType as keyof typeof stats.byFileType
              ] - 1,
            [formData.fileType as keyof typeof stats.byFileType]:
              stats.byFileType[
                formData.fileType as keyof typeof stats.byFileType
              ] + 1,
          },
        };
        setStats(newStats);
      }

      // Reset and close
      resetForm();
      setIsEditDialogOpen(false);
      setSelectedMaterial(null);
      router.refresh();

      toast.success("Materi berhasil diperbarui", {
        description: `${formData.title} telah diperbarui`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("Gagal memperbarui materi", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMaterial = async () => {
    if (!selectedMaterial) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/materials/${selectedMaterial.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete material");
      }

      // Update local state
      setMaterials(materials.filter((m) => m.id !== selectedMaterial.id));

      // Update stats
      const newStats = {
        ...stats,
        total: stats.total - 1,
        byFileType: {
          ...stats.byFileType,
          [selectedMaterial.fileType as keyof typeof stats.byFileType]:
            stats.byFileType[
              selectedMaterial.fileType as keyof typeof stats.byFileType
            ] - 1,
        },
        totalViews: stats.totalViews - selectedMaterial.viewCount,
        totalDownloads: stats.totalDownloads - selectedMaterial.downloadCount,
      };
      setStats(newStats);

      // Reset and close
      setIsDeleteDialogOpen(false);
      setSelectedMaterial(null);
      router.refresh();

      toast.success("Materi berhasil dihapus", {
        description: "Materi telah dihapus dari kelas",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("Gagal menghapus materi", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMaterial = async () => {
    if (!selectedMaterial || selectedClasses.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create material copies for each selected class
      const promises = selectedClasses.map(async (classId) => {
        const response = await fetch("/api/materials", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classId: classId,
            title: selectedMaterial.title,
            description: selectedMaterial.description,
            session: selectedMaterial.session,
            fileType: selectedMaterial.fileType,
            fileUrl: selectedMaterial.fileUrl, // Reference same file
            videoUrl: selectedMaterial.videoUrl,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to copy material");
        }

        return response.json();
      });

      const results = await Promise.all(promises);

      // Update local state with new materials
      const newMaterials = results.map((result) => ({
        ...result.data,
        class: classes.find((c) => c.id === result.data.classId)!,
      }));
      setMaterials([...newMaterials, ...materials]);

      // Update stats
      const newStats = {
        ...stats,
        total: stats.total + newMaterials.length,
        byFileType: {
          ...stats.byFileType,
          [selectedMaterial.fileType as keyof typeof stats.byFileType]:
            stats.byFileType[
              selectedMaterial.fileType as keyof typeof stats.byFileType
            ] + newMaterials.length,
        },
      };
      setStats(newStats);

      // Reset and close
      setSelectedClasses([]);
      setIsCopyDialogOpen(false);
      setSelectedMaterial(null);
      router.refresh();

      toast.success("Materi berhasil disalin", {
        description: `Materi telah disalin ke ${selectedClasses.length} kelas`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("Gagal menyalin materi", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (material: Material) => {
    if (!material.fileUrl) return;

    try {
      // Get signed URL from server (bypasses RLS)
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
      fetch(`/api/materials/${material.id}/download`, {
        method: "POST",
      }).catch((err) => console.error("Failed to update download count:", err));
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Gagal mengunduh", {
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
    }
  };

  // Dialog handlers
  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (material: Material) => {
    setSelectedMaterial(material);
    setFormData({
      classId: material.classId,
      title: material.title,
      description: material.description || "",
      session: material.session,
      fileType: material.fileType,
      file: null,
      videoUrl: material.videoUrl || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (material: Material) => {
    setSelectedMaterial(material);
    setIsDeleteDialogOpen(true);
  };

  const openCopyDialog = (material: Material) => {
    setSelectedMaterial(material);
    setSelectedClasses([]);
    setIsCopyDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Materi Pembelajaran
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola materi untuk kelas Anda
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Upload Materi
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Materi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              PDF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.byFileType.PDF}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Video/Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.byFileType.VIDEO + stats.byFileType.LINK}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalViews}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Downloads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalDownloads}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari materi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs
          value={filterType}
          onValueChange={setFilterType}
          className="w-full sm:w-auto"
        >
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="pdf">PDF</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="document">Dokumen</TabsTrigger>
            <TabsTrigger value="image">Gambar</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Materials List */}
      <div className="space-y-4">
        {filteredMaterials.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum ada materi</h3>
              <p className="text-muted-foreground">
                {searchQuery || filterType !== "all"
                  ? "Tidak ada materi yang sesuai dengan pencarian"
                  : "Upload materi pembelajaran pertama Anda"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMaterials.map((material) => (
            <Card
              key={material.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className="shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      {getTypeIcon(material.fileType)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">
                          {material.title}
                        </h3>
                        {getTypeBadge(material.fileType)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {material.class.name} • Session {material.session}
                      </p>
                      {material.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {material.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {material.viewCount} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {material.downloadCount} downloads
                        </span>
                        <span>
                          {new Date(material.createdAt).toLocaleDateString(
                            "id-ID"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 lg:shrink-0">
                    {material.fileUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(material)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCopyDialog(material)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(material)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(material)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Material Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          key="create-dialog"
        >
          <DialogHeader>
            <DialogTitle>Upload Materi Baru</DialogTitle>
            <DialogDescription>
              Upload file atau tambahkan link video untuk materi pembelajaran
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="class">Kelas *</Label>
              <Select
                value={formData.classId}
                onValueChange={(value) =>
                  setFormData({ ...formData, classId: value })
                }
              >
                <SelectTrigger
                  id="class"
                  className="z-100 bg-white dark:bg-gray-950"
                >
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent className="z-100 bg-white dark:bg-gray-950">
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Judul Materi *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Masukkan judul materi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Deskripsi materi (opsional)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session">Session *</Label>
                <Input
                  id="session"
                  type="number"
                  min={1}
                  max={100}
                  value={formData.session}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      session: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fileType">Tipe Materi *</Label>
                <Select
                  value={formData.fileType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, fileType: value, file: null })
                  }
                >
                  <SelectTrigger
                    id="fileType"
                    className="z-100 bg-white dark:bg-gray-950"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-100 bg-white dark:bg-gray-950">
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="DOCUMENT">
                      Document (DOC, PPT)
                    </SelectItem>
                    <SelectItem value="IMAGE">Gambar</SelectItem>
                    <SelectItem value="VIDEO">Video Link</SelectItem>
                    <SelectItem value="LINK">External Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.fileType === "VIDEO" || formData.fileType === "LINK" ? (
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL *</Label>
                <Input
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, videoUrl: e.target.value })
                  }
                  placeholder="https://youtube.com/watch?v=... atau https://vimeo.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Supported: YouTube, Vimeo, Google Drive
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="file">Upload File *</Label>
                <Input
                  key={`file-${formData.fileType}`}
                  id="file"
                  type="file"
                  accept={
                    ALLOWED_FILE_TYPES[
                      formData.fileType as keyof typeof ALLOWED_FILE_TYPES
                    ]?.join(",") || "*"
                  }
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData({ ...formData, file });
                    if (file) {
                      const validationError = validateFile(file);
                      if (validationError) {
                        setError(validationError);
                      } else {
                        setError(null);
                      }
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Max size: {MAX_FILE_SIZE_MB}MB •{" "}
                  {ALLOWED_FILE_TYPES[
                    formData.fileType as keyof typeof ALLOWED_FILE_TYPES
                  ]?.join(", ")}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button onClick={handleCreateMaterial} disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              Upload Materi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Material Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          key={selectedMaterial?.id || "edit-dialog"}
        >
          <DialogHeader>
            <DialogTitle>Edit Materi</DialogTitle>
            <DialogDescription>
              Update informasi materi pembelajaran
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-title">Judul Materi *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Masukkan judul materi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Deskripsi materi (opsional)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-session">Session *</Label>
                <Input
                  id="edit-session"
                  type="number"
                  min={1}
                  max={100}
                  value={formData.session}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      session: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-fileType">Tipe Materi *</Label>
                <Select
                  value={formData.fileType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, fileType: value })
                  }
                >
                  <SelectTrigger
                    id="edit-fileType"
                    className="z-100 bg-white dark:bg-gray-950"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-100 bg-white dark:bg-gray-950">
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="DOCUMENT">
                      Document (DOC, PPT)
                    </SelectItem>
                    <SelectItem value="IMAGE">Gambar</SelectItem>
                    <SelectItem value="VIDEO">Video Link</SelectItem>
                    <SelectItem value="LINK">External Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.fileType === "VIDEO" || formData.fileType === "LINK" ? (
              <div className="space-y-2">
                <Label htmlFor="edit-videoUrl">Video URL</Label>
                <Input
                  id="edit-videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, videoUrl: e.target.value })
                  }
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="edit-file">Upload File Baru (Opsional)</Label>
                <Input
                  key={`edit-file-${selectedMaterial?.id}-${formData.fileType}`}
                  id="edit-file"
                  type="file"
                  accept={
                    ALLOWED_FILE_TYPES[
                      formData.fileType as keyof typeof ALLOWED_FILE_TYPES
                    ]?.join(",") || "*"
                  }
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData({ ...formData, file });
                    if (file) {
                      const validationError = validateFile(file);
                      if (validationError) {
                        setError(validationError);
                      } else {
                        setError(null);
                      }
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Biarkan kosong jika tidak ingin mengubah file
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedMaterial(null);
              }}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button onClick={handleUpdateMaterial} disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white dark:bg-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
              Hapus Materi?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 dark:text-gray-300">
              Apakah Anda yakin ingin menghapus materi &quot;
              {selectedMaterial?.title}&quot;? File akan dihapus dari storage.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isLoading}
              className="text-gray-900 dark:text-gray-100"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMaterial}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Copy Material Dialog */}
      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent key={selectedMaterial?.id || "copy-dialog"}>
          <DialogHeader>
            <DialogTitle>Copy Materi ke Kelas Lain</DialogTitle>
            <DialogDescription>
              Pilih kelas tujuan untuk copy materi &quot;
              {selectedMaterial?.title}&quot;. File akan direferensikan, tidak
              diduplikasi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Pilih Kelas Tujuan</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {classes
                  .filter((c) => c.id !== selectedMaterial?.classId)
                  .map((cls) => (
                    <div key={cls.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`class-${cls.id}`}
                        checked={selectedClasses.includes(cls.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClasses([...selectedClasses, cls.id]);
                          } else {
                            setSelectedClasses(
                              selectedClasses.filter((id) => id !== cls.id)
                            );
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label
                        htmlFor={`class-${cls.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {cls.name}
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCopyDialogOpen(false);
                setSelectedMaterial(null);
                setSelectedClasses([]);
              }}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleCopyMaterial}
              disabled={isLoading || selectedClasses.length === 0}
            >
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              Copy ke {selectedClasses.length} Kelas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
