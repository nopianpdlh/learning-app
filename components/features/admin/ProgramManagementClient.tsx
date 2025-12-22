"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Users,
  Layers,
  Search,
  ImagePlus,
  X,
  Loader2,
} from "lucide-react";

// Types
interface ClassTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  gradeLevel: string;
  classType: "SEMI_PRIVATE" | "PRIVATE";
  pricePerMonth: number;
  maxStudentsPerSection: number;
  meetingsPerPeriod: number;
  periodDays: number;
  gracePeriodDays: number;
  thumbnail: string | null;
  published: boolean;
  createdAt: Date | string;
  _count?: {
    sections: number;
    waitingList: number;
  };
}

interface ProgramManagementClientProps {
  programs: ClassTemplate[];
}

export default function ProgramManagementClient({
  programs: initialPrograms,
}: ProgramManagementClientProps) {
  const [programs, setPrograms] = useState<ClassTemplate[]>(initialPrograms);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ClassTemplate | null>(
    null
  );
  const [deletingProgram, setDeletingProgram] = useState<ClassTemplate | null>(
    null
  );
  const [forceDeleteConfirm, setForceDeleteConfirm] = useState<{
    program: ClassTemplate;
    sections: number;
    enrollments: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subject: "",
    gradeLevel: "",
    classType: "SEMI_PRIVATE" as "SEMI_PRIVATE" | "PRIVATE",
    pricePerMonth: "",
    maxStudentsPerSection: "10",
    meetingsPerPeriod: "8",
    periodDays: "30",
    gracePeriodDays: "7",
    thumbnail: "",
    published: false,
  });

  // Thumbnail upload state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Supabase client for auth
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Handle thumbnail file selection
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error(
        "Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP."
      );
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file melebihi 5MB");
      return;
    }

    setThumbnailFile(file);
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setThumbnailPreview(previewUrl);
  };

  // Upload thumbnail to Supabase storage
  const uploadThumbnail = async (): Promise<string | null> => {
    if (!thumbnailFile) return formData.thumbnail || null;

    setIsUploading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const uploadFormData = new FormData();
      uploadFormData.append("file", thumbnailFile);
      uploadFormData.append("bucket", "thumbnails");
      uploadFormData.append("folder", "programs");

      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/upload/file", {
        method: "POST",
        headers,
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();
      return result.data?.publicUrl || null;
    } catch (error) {
      console.error("Thumbnail upload error:", error);
      toast.error("Gagal upload thumbnail");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Reset thumbnail state
  const resetThumbnailState = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Filter programs by search
  const filteredPrograms = programs.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    total: programs.length,
    published: programs.filter((p) => p.published).length,
    semiPrivate: programs.filter((p) => p.classType === "SEMI_PRIVATE").length,
    private: programs.filter((p) => p.classType === "PRIVATE").length,
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      subject: "",
      gradeLevel: "",
      classType: "SEMI_PRIVATE",
      pricePerMonth: "",
      maxStudentsPerSection: "10",
      meetingsPerPeriod: "8",
      periodDays: "30",
      gracePeriodDays: "7",
      thumbnail: "",
      published: false,
    });
  };

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Upload thumbnail if file is selected
      let thumbnailUrl = formData.thumbnail;
      if (thumbnailFile) {
        const uploadedUrl = await uploadThumbnail();
        if (uploadedUrl) {
          thumbnailUrl = uploadedUrl;
        }
      }

      const response = await fetch("/api/admin/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          thumbnail: thumbnailUrl,
          pricePerMonth: parseInt(formData.pricePerMonth),
          maxStudentsPerSection: parseInt(formData.maxStudentsPerSection),
          meetingsPerPeriod: parseInt(formData.meetingsPerPeriod),
          periodDays: parseInt(formData.periodDays),
          gracePeriodDays: parseInt(formData.gracePeriodDays),
        }),
      });

      if (!response.ok) throw new Error("Failed to create program");

      const newProgram = await response.json();
      setPrograms([newProgram, ...programs]);
      toast.success("Program berhasil ditambahkan");
      setIsAddDialogOpen(false);
      resetForm();
      resetThumbnailState();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menambahkan program");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram) return;
    setIsLoading(true);

    try {
      // Upload thumbnail if file is selected
      let thumbnailUrl = formData.thumbnail;
      if (thumbnailFile) {
        const uploadedUrl = await uploadThumbnail();
        if (uploadedUrl) {
          thumbnailUrl = uploadedUrl;
        }
      }

      const response = await fetch(`/api/admin/programs/${editingProgram.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          thumbnail: thumbnailUrl,
          pricePerMonth: parseInt(formData.pricePerMonth),
          maxStudentsPerSection: parseInt(formData.maxStudentsPerSection),
          meetingsPerPeriod: parseInt(formData.meetingsPerPeriod),
          periodDays: parseInt(formData.periodDays),
          gracePeriodDays: parseInt(formData.gracePeriodDays),
        }),
      });

      if (!response.ok) throw new Error("Failed to update program");

      const updatedProgram = await response.json();
      setPrograms(
        programs.map((p) => (p.id === editingProgram.id ? updatedProgram : p))
      );
      toast.success("Program berhasil diupdate");
      setIsEditDialogOpen(false);
      setEditingProgram(null);
      resetForm();
      resetThumbnailState();
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengupdate program");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProgram = async () => {
    if (!deletingProgram) return;

    try {
      const response = await fetch(
        `/api/admin/programs/${deletingProgram.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        // If can force delete, show force delete confirmation
        if (errorData.canForceDelete) {
          setDeletingProgram(null);
          setForceDeleteConfirm({
            program: deletingProgram,
            sections: errorData.details?.sections || 0,
            enrollments: errorData.details?.enrollments || 0,
          });
          return;
        }
        throw new Error(errorData.error || "Failed to delete program");
      }

      setPrograms(programs.filter((p) => p.id !== deletingProgram.id));
      toast.success("Program berhasil dihapus");
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus program";
      toast.error(errorMessage);
    } finally {
      setDeletingProgram(null);
    }
  };

  const handleForceDeleteProgram = async () => {
    if (!forceDeleteConfirm) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/programs/${forceDeleteConfirm.program.id}?force=true`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to force delete program");
      }

      const result = await response.json();
      setPrograms(
        programs.filter((p) => p.id !== forceDeleteConfirm.program.id)
      );
      toast.success(
        `Program berhasil dihapus beserta ${result.deletedSections} section dan ${result.deletedEnrollments} enrollment`
      );
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus program";
      toast.error(errorMessage);
    } finally {
      setForceDeleteConfirm(null);
      setIsLoading(false);
    }
  };

  const openEditDialog = (program: ClassTemplate) => {
    setEditingProgram(program);
    resetThumbnailState();
    // Set preview if existing thumbnail
    if (program.thumbnail) {
      setThumbnailPreview(program.thumbnail);
    }
    setFormData({
      name: program.name,
      description: program.description,
      subject: program.subject,
      gradeLevel: program.gradeLevel,
      classType: program.classType,
      pricePerMonth: program.pricePerMonth.toString(),
      maxStudentsPerSection: program.maxStudentsPerSection.toString(),
      meetingsPerPeriod: program.meetingsPerPeriod.toString(),
      periodDays: program.periodDays.toString(),
      gracePeriodDays: program.gracePeriodDays.toString(),
      thumbnail: program.thumbnail || "",
      published: program.published,
    });
    setIsEditDialogOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2647]">
            Manajemen Program
          </h1>
          <p className="text-muted-foreground">
            Kelola program/template kelas pembelajaran
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-[#FFB800] hover:bg-[#e6a600] text-black"
              onClick={resetForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Program
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Program Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProgram} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-name">Nama Program *</Label>
                  <Input
                    id="add-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Semi-Private Grammar"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-subject">Mata Pelajaran *</Label>
                  <Input
                    id="add-subject"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    placeholder="Bahasa Inggris"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-description">Deskripsi</Label>
                <Textarea
                  id="add-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Deskripsi program..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-gradeLevel">Level *</Label>
                  <Select
                    value={formData.gradeLevel}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gradeLevel: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih level" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Anak">Anak</SelectItem>
                      <SelectItem value="Dewasa">Dewasa</SelectItem>
                      <SelectItem value="Semua">Semua Usia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-classType">Tipe Kelas *</Label>
                  <Select
                    value={formData.classType}
                    onValueChange={(value: "SEMI_PRIVATE" | "PRIVATE") =>
                      setFormData({ ...formData, classType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="SEMI_PRIVATE">
                        Semi-Private (2-10 siswa)
                      </SelectItem>
                      <SelectItem value="PRIVATE">Private (1 siswa)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-pricePerMonth">Harga / Bulan *</Label>
                  <Input
                    id="add-pricePerMonth"
                    type="number"
                    value={formData.pricePerMonth}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePerMonth: e.target.value,
                      })
                    }
                    placeholder="500000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-maxStudentsPerSection">
                    Max Siswa / Section
                  </Label>
                  <Input
                    id="add-maxStudentsPerSection"
                    type="number"
                    value={formData.maxStudentsPerSection}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxStudentsPerSection: e.target.value,
                      })
                    }
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-meetingsPerPeriod">
                    Meetings / Periode
                  </Label>
                  <Input
                    id="add-meetingsPerPeriod"
                    type="number"
                    value={formData.meetingsPerPeriod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        meetingsPerPeriod: e.target.value,
                      })
                    }
                    placeholder="8"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-periodDays">Periode (hari)</Label>
                  <Input
                    id="add-periodDays"
                    type="number"
                    value={formData.periodDays}
                    onChange={(e) =>
                      setFormData({ ...formData, periodDays: e.target.value })
                    }
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-gracePeriodDays">
                    Grace Period (hari)
                  </Label>
                  <Input
                    id="add-gracePeriodDays"
                    type="number"
                    value={formData.gracePeriodDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gracePeriodDays: e.target.value,
                      })
                    }
                    placeholder="7"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Thumbnail (Optional)</Label>
                <div className="space-y-3">
                  {/* Preview */}
                  {(thumbnailPreview || formData.thumbnail) && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={thumbnailPreview || formData.thumbnail}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => {
                          resetThumbnailState();
                          setFormData({ ...formData, thumbnail: "" });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {/* Upload button */}
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleThumbnailChange}
                      className="hidden"
                      id="add-thumbnail-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <ImagePlus className="h-4 w-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </Button>
                  </div>
                  {/* URL input fallback */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Atau masukkan URL:
                    </p>
                    <Input
                      id="add-thumbnail"
                      placeholder="https://..."
                      value={formData.thumbnail}
                      onChange={(e) => {
                        resetThumbnailState();
                        setFormData({ ...formData, thumbnail: e.target.value });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="add-published"
                  checked={formData.published}
                  onChange={(e) =>
                    setFormData({ ...formData, published: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="add-published" className="cursor-pointer">
                  Published (Tampilkan ke siswa)
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Loading..." : "Tambah Program"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#0A2647]/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-[#0A2647]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Program</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{stats.published}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Semi-Private</p>
                <p className="text-2xl font-bold">{stats.semiPrivate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Private</p>
                <p className="text-2xl font-bold">{stats.private}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari program..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Programs Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Max Siswa</TableHead>
                <TableHead>Meetings</TableHead>
                <TableHead>Sections</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrograms.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {searchQuery
                      ? "Tidak ada program yang cocok"
                      : "Belum ada program"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrograms.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {program.thumbnail ? (
                            <img
                              src={program.thumbnail}
                              alt={program.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                // Hide broken image and show fallback
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML =
                                    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>';
                                }
                              }}
                            />
                          ) : (
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{program.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {program.subject} • {program.gradeLevel}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          program.classType === "SEMI_PRIVATE"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {program.classType === "SEMI_PRIVATE"
                          ? "Semi-Private"
                          : "Private"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPrice(program.pricePerMonth)}</TableCell>
                    <TableCell>{program.maxStudentsPerSection}</TableCell>
                    <TableCell>
                      {program.meetingsPerPeriod}x / {program.periodDays} hari
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <span>{program._count?.sections || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={program.published ? "default" : "outline"}
                      >
                        {program.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(program)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingProgram(program)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingProgram}
        onOpenChange={(open) => !open && setDeletingProgram(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Program</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus program{" "}
              <strong>"{deletingProgram?.name}"</strong>? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProgram}
              className="bg-red-500 hover:bg-red-600"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Force Delete Confirmation Dialog */}
      <AlertDialog
        open={!!forceDeleteConfirm}
        onOpenChange={(open) => !open && setForceDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              ⚠️ Peringatan: Hapus Paksa
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Program <strong>"{forceDeleteConfirm?.program.name}"</strong>{" "}
                memiliki data aktif yang akan ikut dihapus:
              </p>
              <ul className="list-disc list-inside bg-red-50 p-3 rounded-md text-red-700">
                <li>
                  <strong>{forceDeleteConfirm?.sections}</strong> section(s)
                </li>
                <li>
                  <strong>{forceDeleteConfirm?.enrollments}</strong>{" "}
                  enrollment(s) aktif
                </li>
              </ul>
              <p className="text-red-600 font-semibold">
                Semua data termasuk pembayaran, invoice, dan riwayat kehadiran
                akan dihapus permanen!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceDeleteProgram}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? "Menghapus..." : "Hapus Paksa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditProgram} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nama Program *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Semi-Private Grammar"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subject">Mata Pelajaran *</Label>
                <Input
                  id="edit-subject"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder="Bahasa Inggris"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Deskripsi program..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-gradeLevel">Level *</Label>
                <Select
                  value={formData.gradeLevel}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gradeLevel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih level" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Anak">Anak</SelectItem>
                    <SelectItem value="Dewasa">Dewasa</SelectItem>
                    <SelectItem value="Semua">Semua Usia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-classType">Tipe Kelas *</Label>
                <Select
                  value={formData.classType}
                  onValueChange={(value: "SEMI_PRIVATE" | "PRIVATE") =>
                    setFormData({ ...formData, classType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="SEMI_PRIVATE">
                      Semi-Private (2-10 siswa)
                    </SelectItem>
                    <SelectItem value="PRIVATE">Private (1 siswa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-pricePerMonth">Harga / Bulan *</Label>
                <Input
                  id="edit-pricePerMonth"
                  type="number"
                  value={formData.pricePerMonth}
                  onChange={(e) =>
                    setFormData({ ...formData, pricePerMonth: e.target.value })
                  }
                  placeholder="500000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxStudentsPerSection">
                  Max Siswa / Section
                </Label>
                <Input
                  id="edit-maxStudentsPerSection"
                  type="number"
                  value={formData.maxStudentsPerSection}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxStudentsPerSection: e.target.value,
                    })
                  }
                  placeholder="10"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-meetingsPerPeriod">
                  Meetings / Periode
                </Label>
                <Input
                  id="edit-meetingsPerPeriod"
                  type="number"
                  value={formData.meetingsPerPeriod}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      meetingsPerPeriod: e.target.value,
                    })
                  }
                  placeholder="8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-periodDays">Periode (hari)</Label>
                <Input
                  id="edit-periodDays"
                  type="number"
                  value={formData.periodDays}
                  onChange={(e) =>
                    setFormData({ ...formData, periodDays: e.target.value })
                  }
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-gracePeriodDays">
                  Grace Period (hari)
                </Label>
                <Input
                  id="edit-gracePeriodDays"
                  type="number"
                  value={formData.gracePeriodDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gracePeriodDays: e.target.value,
                    })
                  }
                  placeholder="7"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Thumbnail (Optional)</Label>
              <div className="space-y-3">
                {/* Preview */}
                {(thumbnailPreview || formData.thumbnail) && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={thumbnailPreview || formData.thumbnail}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => {
                        resetThumbnailState();
                        setFormData({ ...formData, thumbnail: "" });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {/* Upload button */}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleThumbnailChange}
                    className="hidden"
                    id="edit-thumbnail-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ImagePlus className="h-4 w-4 mr-2" />
                        Upload Image
                      </>
                    )}
                  </Button>
                </div>
                {/* URL input fallback */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Atau masukkan URL:
                  </p>
                  <Input
                    id="edit-thumbnail"
                    placeholder="https://..."
                    value={formData.thumbnail}
                    onChange={(e) => {
                      resetThumbnailState();
                      setFormData({ ...formData, thumbnail: e.target.value });
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-published"
                checked={formData.published}
                onChange={(e) =>
                  setFormData({ ...formData, published: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="edit-published" className="cursor-pointer">
                Published (Tampilkan ke siswa)
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Loading..." : "Update Program"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
