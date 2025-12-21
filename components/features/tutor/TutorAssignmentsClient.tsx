"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Calendar,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { uploadFile } from "@/lib/storage";
import { Upload, X, FileText } from "lucide-react";

interface AssignmentData {
  id: string;
  title: string;
  instructions: string;
  dueDate: string;
  maxPoints: number;
  attachmentUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  class: {
    id: string;
    name: string;
  };
  _count: {
    submissions: number;
  };
  submittedCount: number;
  gradedCount: number;
  totalStudents: number;
}

interface ClassData {
  id: string;
  name: string;
  subject: string;
}

interface TutorAssignmentsClientProps {
  assignments: AssignmentData[];
  classes: ClassData[];
}

export default function TutorAssignmentsClient({
  assignments,
  classes,
}: TutorAssignmentsClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<AssignmentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    title: "",
    instructions: "",
    dueDate: "",
    maxPoints: 100,
    classId: "",
    attachmentUrl: "",
    status: "DRAFT",
  });

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.class.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && assignment.status === "PUBLISHED") ||
      (filter === "closed" && assignment.status === "DRAFT");
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const activeAssignments = assignments.filter(
    (a) => a.status === "PUBLISHED"
  ).length;
  const totalSubmissions = assignments.reduce(
    (acc, a) => acc + a.submittedCount,
    0
  );
  const needsGrading = assignments.reduce(
    (acc, a) => acc + (a.submittedCount - a.gradedCount),
    0
  );

  const getStatusBadge = (status: string) => {
    return status === "PUBLISHED" ? (
      <Badge
        variant="outline"
        className="bg-green-500/10 text-green-700 border-green-500/20"
      >
        Aktif
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-gray-500/10 text-gray-700 border-gray-500/20"
      >
        Draft
      </Badge>
    );
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      instructions: "",
      dueDate: "",
      maxPoints: 100,
      classId: "",
      attachmentUrl: "",
      status: "DRAFT",
    });
    setSelectedFile(null);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFormData({ ...formData, attachmentUrl: "" });
  };

  // Upload file to storage
  const handleUploadFile = async (): Promise<string | null> => {
    if (!selectedFile) return formData.attachmentUrl || null;

    setUploadingFile(true);
    try {
      const result = await uploadFile({
        bucket: "assignments",
        folder: "assignment-files",
        file: selectedFile,
      });

      if (!result.success || !result.publicUrl) {
        throw new Error(result.error || "Failed to upload file");
      }

      return result.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload file"
      );
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  // Open create dialog
  const handleCreateClick = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  // Open edit dialog
  const handleEditClick = (assignment: AssignmentData) => {
    setSelectedAssignment(assignment);
    setFormData({
      title: assignment.title,
      instructions: assignment.instructions,
      dueDate: format(new Date(assignment.dueDate), "yyyy-MM-dd"),
      maxPoints: assignment.maxPoints,
      classId: assignment.class.id,
      attachmentUrl: assignment.attachmentUrl || "",
      status: assignment.status,
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (assignment: AssignmentData) => {
    setSelectedAssignment(assignment);
    setIsDeleteDialogOpen(true);
  };

  // Create assignment
  const handleCreateAssignment = async () => {
    try {
      setIsLoading(true);

      // Validate required fields
      if (!formData.classId) {
        toast.error("Pilih kelas terlebih dahulu");
        return;
      }
      if (!formData.title.trim()) {
        toast.error("Judul tugas harus diisi");
        return;
      }
      if (formData.title.trim().length < 3) {
        toast.error("Judul tugas minimal 3 karakter");
        return;
      }
      if (!formData.instructions.trim()) {
        toast.error("Instruksi harus diisi");
        return;
      }
      if (formData.instructions.trim().length < 10) {
        toast.error("Instruksi minimal 10 karakter");
        return;
      }
      if (!formData.dueDate) {
        toast.error("Batas waktu harus diisi");
        return;
      }

      // Validate due date is in the future
      const dueDateTime = new Date(formData.dueDate + "T23:59:59");
      if (dueDateTime <= new Date()) {
        toast.error("Batas waktu harus di masa depan");
        return;
      }

      if (formData.maxPoints <= 0) {
        toast.error("Nilai maksimal harus lebih dari 0");
        return;
      }

      // Upload file if selected
      let attachmentUrl = formData.attachmentUrl || null;
      if (selectedFile) {
        attachmentUrl = await handleUploadFile();
        if (!attachmentUrl) {
          return; // Upload failed, stop here
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Unauthorized");
        return;
      }

      const payload = {
        classId: formData.classId,
        title: formData.title.trim(),
        instructions: formData.instructions.trim(),
        maxPoints: parseInt(formData.maxPoints.toString()),
        dueDate: dueDateTime.toISOString(),
        status: formData.status,
        ...(attachmentUrl && { attachmentUrl }),
      };

      console.log("Creating assignment with payload:", payload);

      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("API response:", data);

      if (!response.ok) {
        const errorMessage =
          data.error || data.details || "Failed to create assignment";
        console.error("API error details:", data);
        throw new Error(
          typeof errorMessage === "string"
            ? errorMessage
            : JSON.stringify(errorMessage)
        );
      }

      toast.success("Assignment created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create assignment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Update assignment
  const handleUpdateAssignment = async () => {
    if (!selectedAssignment) return;

    try {
      setIsLoading(true);

      // Validate required fields
      if (!formData.classId) {
        toast.error("Pilih kelas terlebih dahulu");
        return;
      }
      if (!formData.title.trim()) {
        toast.error("Judul tugas harus diisi");
        return;
      }
      if (!formData.instructions.trim()) {
        toast.error("Instruksi harus diisi");
        return;
      }
      if (!formData.dueDate) {
        toast.error("Batas waktu harus diisi");
        return;
      }
      if (formData.maxPoints <= 0) {
        toast.error("Nilai maksimal harus lebih dari 0");
        return;
      }

      // Upload new file if selected
      let attachmentUrl = formData.attachmentUrl || null;
      if (selectedFile) {
        attachmentUrl = await handleUploadFile();
        if (!attachmentUrl) {
          return; // Upload failed, stop here
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Unauthorized");
        return;
      }

      const response = await fetch(
        `/api/assignments/${selectedAssignment.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            title: formData.title.trim(),
            instructions: formData.instructions.trim(),
            maxPoints: parseInt(formData.maxPoints.toString()),
            dueDate: new Date(formData.dueDate).toISOString(),
            status: formData.status,
            ...(attachmentUrl && { attachmentUrl }),
          }),
        }
      );

      const data = await response.json();
      console.log("Update API response:", data);

      if (!response.ok) {
        const errorMessage =
          data.error || data.details || "Failed to update assignment";
        console.error("Update API error details:", data);
        throw new Error(
          typeof errorMessage === "string"
            ? errorMessage
            : JSON.stringify(errorMessage)
        );
      }

      toast.success("Assignment updated successfully");
      setIsEditDialogOpen(false);
      setSelectedAssignment(null);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update assignment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Delete assignment
  const handleDeleteAssignment = async () => {
    if (!selectedAssignment) return;

    try {
      setIsLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Unauthorized");
        return;
      }

      const response = await fetch(
        `/api/assignments/${selectedAssignment.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete assignment");
      }

      toast.success("Assignment deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedAssignment(null);
      router.refresh();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete assignment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // View detail
  const handleViewDetail = (assignmentId: string) => {
    router.push(`/tutor/assignments/${assignmentId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tugas</h1>
          <p className="text-muted-foreground mt-1">
            Kelola tugas untuk semua kelas
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Tugas Baru
        </Button>
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
            <div className="text-2xl font-bold">{assignments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tugas Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeAssignments}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalSubmissions}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Perlu Dinilai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {needsGrading}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari tugas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs
          value={filter}
          onValueChange={setFilter}
          className="w-full sm:w-auto"
        >
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="active">Aktif</TabsTrigger>
            <TabsTrigger value="closed">Draft</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Tidak ada tugas ditemukan
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((assignment) => (
            <Card
              key={assignment.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">
                        {assignment.title}
                      </h3>
                      {getStatusBadge(assignment.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {assignment.class.name}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Deadline:{" "}
                          {format(
                            new Date(assignment.dueDate),
                            "dd MMMM yyyy",
                            { locale: idLocale }
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>
                          {assignment.submittedCount}/{assignment.totalStudents}{" "}
                          dikumpulkan
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {assignment.gradedCount}/{assignment.submittedCount}{" "}
                          dinilai
                        </span>
                      </div>
                    </div>
                    {assignment.submittedCount > assignment.gradedCount && (
                      <Badge
                        variant="outline"
                        className="bg-orange-500/10 text-orange-700 border-orange-500/20 w-fit"
                      >
                        {assignment.submittedCount - assignment.gradedCount}{" "}
                        perlu dinilai
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 lg:shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetail(assignment.id)}
                    >
                      Lihat Detail
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(assignment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(assignment)}
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Tugas Baru</DialogTitle>
            <DialogDescription>
              Buat tugas baru untuk kelas yang Anda ajar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="class">Kelas *</Label>
              <Select
                value={formData.classId}
                onValueChange={(value) =>
                  setFormData({ ...formData, classId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {classes.map((cls) => (
                    <SelectItem
                      key={cls.id}
                      value={cls.id}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col py-1">
                        <span className="font-medium">{cls.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {cls.subject}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Judul Tugas *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Contoh: Tugas Integral Tak Tentu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Instruksi *</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) =>
                  setFormData({ ...formData, instructions: e.target.value })
                }
                placeholder="Instruksi lengkap untuk tugas ini..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Batas Waktu *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPoints">Nilai Maksimal *</Label>
                <Input
                  id="maxPoints"
                  type="number"
                  value={formData.maxPoints}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxPoints: parseInt(e.target.value) || 100,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="attachment">File Lampiran</Label>
              <div className="space-y-2">
                {!selectedFile && !formData.attachmentUrl ? (
                  <div className="flex items-center gap-2">
                    <Input
                      id="attachment"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls,.zip,.rar"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        document.getElementById("attachment")?.click()
                      }
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm truncate">
                      {selectedFile ? selectedFile.name : "File terlampir"}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Format: PDF, DOC, DOCX, PPT, PPTX, XLSX, XLS, ZIP, RAR (Max
                  10MB)
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isLoading || uploadingFile}
            >
              Batal
            </Button>
            <Button
              onClick={handleCreateAssignment}
              disabled={isLoading || uploadingFile}
            >
              {uploadingFile
                ? "Mengupload..."
                : isLoading
                ? "Menyimpan..."
                : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tugas</DialogTitle>
            <DialogDescription>
              Edit informasi tugas yang sudah ada
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-class">Kelas *</Label>
              <Select
                value={formData.classId}
                onValueChange={(value) =>
                  setFormData({ ...formData, classId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {classes.map((cls) => (
                    <SelectItem
                      key={cls.id}
                      value={cls.id}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col py-1">
                        <span className="font-medium">{cls.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {cls.subject}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-title">Judul Tugas *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-instructions">Instruksi *</Label>
              <Textarea
                id="edit-instructions"
                value={formData.instructions}
                onChange={(e) =>
                  setFormData({ ...formData, instructions: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-dueDate">Batas Waktu *</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxPoints">Nilai Maksimal *</Label>
                <Input
                  id="edit-maxPoints"
                  type="number"
                  value={formData.maxPoints}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxPoints: parseInt(e.target.value) || 100,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Upload for Edit */}
            <div className="space-y-2">
              <Label htmlFor="edit-attachment">File Lampiran</Label>
              <div className="space-y-2">
                {!selectedFile && !formData.attachmentUrl ? (
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-attachment"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls,.zip,.rar"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        document.getElementById("edit-attachment")?.click()
                      }
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm truncate">
                        {selectedFile ? selectedFile.name : "File terlampir"}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.attachmentUrl && !selectedFile && (
                      <a
                        href={formData.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        Lihat file saat ini
                      </a>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Format: PDF, DOC, DOCX, PPT, PPTX, XLSX, XLS, ZIP, RAR (Max
                  10MB)
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isLoading || uploadingFile}
            >
              Batal
            </Button>
            <Button
              onClick={handleUpdateAssignment}
              disabled={isLoading || uploadingFile}
            >
              {uploadingFile
                ? "Mengupload..."
                : isLoading
                ? "Menyimpan..."
                : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Tugas ini akan dihapus
              permanen beserta semua submission yang ada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAssignment}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
