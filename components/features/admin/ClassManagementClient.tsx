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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  BookOpen,
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  ImagePlus,
  X,
  Loader2,
} from "lucide-react";

interface ClassData {
  id: string;
  name: string;
  description: string;
  subject: string;
  gradeLevel: string;
  price: number;
  capacity: number;
  schedule: string;
  thumbnail: string | null;
  tutorId: string;
  published: boolean;
  createdAt: string;
  tutor: {
    user: {
      name: string;
    };
  };
  _count: {
    enrollments: number;
  };
}

interface Tutor {
  id: string;
  name: string;
}

interface ClassManagementClientProps {
  classes: ClassData[];
  tutors: Tutor[];
}

export function ClassManagementClient({
  classes: initialClasses,
  tutors,
}: ClassManagementClientProps) {
  const [classes, setClasses] = useState(initialClasses);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subject: "",
    gradeLevel: "",
    price: "",
    capacity: "",
    schedule: "",
    thumbnail: "",
    tutorId: "",
    published: false,
  });
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
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
      uploadFormData.append("folder", "class-thumbnails");

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

  const handleAddClass = async (e: React.FormEvent) => {
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

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/admin/classes", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...formData, thumbnail: thumbnailUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
        return;
      }

      const newClass = await response.json();
      setClasses([newClass, ...classes]);
      setIsAddDialogOpen(false);
      resetThumbnailState();
      setFormData({
        name: "",
        description: "",
        subject: "",
        gradeLevel: "",
        price: "",
        capacity: "",
        schedule: "",
        thumbnail: "",
        tutorId: "",
        published: false,
      });
      toast.success("Class created successfully!");
    } catch (error) {
      console.error("Error creating class:", error);
      toast.error("Failed to create class");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
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

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/admin/classes/${editingClass.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ ...formData, thumbnail: thumbnailUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
        return;
      }

      const updatedClass = await response.json();
      setClasses(
        classes.map((c) => (c.id === updatedClass.id ? updatedClass : c))
      );
      setIsEditDialogOpen(false);
      setEditingClass(null);
      resetThumbnailState();
      setFormData({
        name: "",
        description: "",
        subject: "",
        gradeLevel: "",
        price: "",
        capacity: "",
        schedule: "",
        thumbnail: "",
        tutorId: "",
        published: false,
      });
      toast.success("Class updated successfully!");
    } catch (error) {
      console.error("Error updating class:", error);
      toast.error("Failed to update class");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = (cls: ClassData) => {
    if (cls._count.enrollments > 0) {
      toast.error("Cannot delete class with active enrollments");
      return;
    }
    toast(`Delete class ${cls.name}?`, {
      description: "This action cannot be undone.",
      action: {
        label: "Confirm",
        onClick: () => deleteClass(cls),
      },
    });
  };

  const deleteClass = async (cls: ClassData) => {
    setIsLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/admin/classes/${cls.id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
        return;
      }

      setClasses(classes.filter((c) => c.id !== cls.id));
      toast.success("Class deleted successfully!");
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Failed to delete class");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (cls: ClassData) => {
    setEditingClass(cls);
    resetThumbnailState();
    // Set preview if existing thumbnail
    if (cls.thumbnail) {
      setThumbnailPreview(cls.thumbnail);
    }
    setFormData({
      name: cls.name,
      description: cls.description,
      subject: cls.subject,
      gradeLevel: cls.gradeLevel,
      price: cls.price.toString(),
      capacity: cls.capacity.toString(),
      schedule: cls.schedule,
      thumbnail: cls.thumbnail || "",
      tutorId: cls.tutorId,
      published: cls.published,
    });
    setIsEditDialogOpen(true);
  };

  // Filter classes based on search and status
  const filteredClasses = classes.filter((cls) => {
    const matchesSearch =
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.tutor.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && cls.published) ||
      (statusFilter === "DRAFT" && !cls.published);
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClasses = filteredClasses.slice(startIndex, endIndex);

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by class name, subject, or tutor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg ">
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Class</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddClass} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Class Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter class name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter class description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="e.g., Mathematics"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gradeLevel">Grade Level</Label>
                    <Input
                      id="gradeLevel"
                      placeholder="e.g., Grade 10"
                      value={formData.gradeLevel}
                      onChange={(e) =>
                        setFormData({ ...formData, gradeLevel: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (Rp)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="Enter price"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      placeholder="Max students"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({ ...formData, capacity: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule">Schedule</Label>
                  <Input
                    id="schedule"
                    placeholder="e.g., Mon & Wed, 19:00-21:00"
                    value={formData.schedule}
                    onChange={(e) =>
                      setFormData({ ...formData, schedule: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tutor">Tutor</Label>
                  <Select
                    value={formData.tutorId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tutorId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tutor" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {tutors.map((tutor) => (
                        <SelectItem key={tutor.id} value={tutor.id}>
                          {tutor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        id="thumbnail-upload"
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
                        Or enter URL:
                      </p>
                      <Input
                        id="thumbnail"
                        placeholder="https://example.com/image.jpg"
                        value={formData.thumbnail}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            thumbnail: e.target.value,
                          });
                          if (e.target.value) {
                            setThumbnailPreview(e.target.value);
                            setThumbnailFile(null);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formData.published}
                    onChange={(e) =>
                      setFormData({ ...formData, published: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="published" className="cursor-pointer">
                    Publish immediately
                  </Label>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Class"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Class Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Class</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditClass} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Class Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="Enter class name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Enter class description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-subject">Subject</Label>
                    <Input
                      id="edit-subject"
                      placeholder="e.g., Mathematics"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-gradeLevel">Grade Level</Label>
                    <Input
                      id="edit-gradeLevel"
                      placeholder="e.g., Grade 10"
                      value={formData.gradeLevel}
                      onChange={(e) =>
                        setFormData({ ...formData, gradeLevel: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Price (Rp)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      placeholder="Enter price"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-capacity">Capacity</Label>
                    <Input
                      id="edit-capacity"
                      type="number"
                      placeholder="Max students"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({ ...formData, capacity: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-schedule">Schedule</Label>
                  <Input
                    id="edit-schedule"
                    placeholder="e.g., Mon & Wed, 19:00-21:00"
                    value={formData.schedule}
                    onChange={(e) =>
                      setFormData({ ...formData, schedule: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tutor">Tutor</Label>
                  <Select
                    value={formData.tutorId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tutorId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tutor" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {tutors.map((tutor) => (
                        <SelectItem key={tutor.id} value={tutor.id}>
                          {tutor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleThumbnailChange}
                        className="hidden"
                        id="edit-thumbnail-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          document
                            .getElementById("edit-thumbnail-upload")
                            ?.click()
                        }
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
                        Or enter URL:
                      </p>
                      <Input
                        id="edit-thumbnail"
                        placeholder="https://example.com/image.jpg"
                        value={formData.thumbnail}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            thumbnail: e.target.value,
                          });
                          if (e.target.value) {
                            setThumbnailPreview(e.target.value);
                            setThumbnailFile(null);
                          }
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
                    Published
                  </Label>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Class"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Classes Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Class Name</TableHead>
            <TableHead>Tutor</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedClasses.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground py-8"
              >
                No classes found
              </TableCell>
            </TableRow>
          ) : (
            paginatedClasses.map((cls) => (
              <TableRow key={cls.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    {cls.name}
                  </div>
                </TableCell>
                <TableCell>{cls.tutor.user.name}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {cls._count.enrollments}
                  </span>
                </TableCell>
                <TableCell suppressHydrationWarning>
                  Rp {cls.price.toLocaleString("id-ID")}
                </TableCell>
                <TableCell>
                  <Badge variant={cls.published ? "default" : "outline"}>
                    {cls.published ? "Active" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell suppressHydrationWarning>
                  {new Date(cls.createdAt).toLocaleDateString("id-ID")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(cls)}
                      disabled={isLoading}
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeleteClass(cls)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredClasses.length)} of{" "}
            {filteredClasses.length} results
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                }
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      setCurrentPage(currentPage + 1);
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
}
