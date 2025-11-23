"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Calendar,
  FileQuestion,
  Timer,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface QuizData {
  id: string;
  title: string;
  description: string | null;
  classId: string;
  className: string;
  classSubject: string;
  timeLimit: number | null;
  startDate: string | null;
  endDate: string | null;
  passingGrade: number | null;
  status: string;
  questionsCount: number;
  totalStudents: number;
  participants: number;
  avgScore: number;
  createdAt: string;
  updatedAt: string;
}

interface ClassData {
  id: string;
  name: string;
  subject: string;
}

interface TutorQuizzesClientProps {
  quizzes: QuizData[];
  classes: ClassData[];
}

export default function TutorQuizzesClient({
  quizzes: initialQuizzes,
  classes,
}: TutorQuizzesClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [quizzes, setQuizzes] = useState<QuizData[]>(initialQuizzes);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    classId: "",
    timeLimit: 30,
    startDate: "",
    endDate: "",
    passingGrade: 70,
    status: "DRAFT",
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      classId: "",
      timeLimit: 30,
      startDate: "",
      endDate: "",
      passingGrade: 70,
      status: "DRAFT",
    });
  };

  // Filter quizzes
  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.className.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "published" && quiz.status === "PUBLISHED") ||
      (filter === "draft" && quiz.status === "DRAFT") ||
      (filter === "closed" && quiz.status === "CLOSED");
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const publishedQuizzes = quizzes.filter(
    (q) => q.status === "PUBLISHED"
  ).length;
  const totalParticipants = quizzes.reduce((acc, q) => acc + q.participants, 0);
  const completedQuizzes = quizzes.filter((q) => q.avgScore > 0);
  const overallAvgScore =
    completedQuizzes.length > 0
      ? Math.round(
          completedQuizzes.reduce((acc, q) => acc + q.avgScore, 0) /
            completedQuizzes.length
        )
      : 0;

  // Get status badge
  const getStatusBadge = (status: string) => {
    if (status === "PUBLISHED") {
      return (
        <Badge
          variant="outline"
          className="bg-green-500/10 text-green-700 border-green-500/20"
        >
          Published
        </Badge>
      );
    } else if (status === "DRAFT") {
      return (
        <Badge
          variant="outline"
          className="bg-gray-500/10 text-gray-700 border-gray-500/20"
        >
          Draft
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="outline"
          className="bg-blue-500/10 text-blue-700 border-blue-500/20"
        >
          Closed
        </Badge>
      );
    }
  };

  // Create quiz
  const handleCreateQuiz = async () => {
    try {
      setIsLoading(true);

      // Validate required fields
      if (!formData.classId) {
        toast.error("Pilih kelas terlebih dahulu");
        return;
      }
      if (!formData.title.trim()) {
        toast.error("Judul kuis harus diisi");
        return;
      }
      if (formData.title.trim().length < 3) {
        toast.error("Judul kuis minimal 3 karakter");
        return;
      }
      if (formData.title.trim().length > 200) {
        toast.error("Judul kuis maksimal 200 karakter");
        return;
      }
      if (
        formData.description.trim() &&
        formData.description.trim().length < 10
      ) {
        toast.error("Deskripsi minimal 10 karakter jika diisi");
        return;
      }
      if (formData.description.trim().length > 2000) {
        toast.error("Deskripsi maksimal 2000 karakter");
        return;
      }
      if (
        formData.timeLimit &&
        (formData.timeLimit < 1 || formData.timeLimit > 180)
      ) {
        toast.error("Durasi harus antara 1-180 menit");
        return;
      }
      if (
        formData.passingGrade &&
        (formData.passingGrade < 0 || formData.passingGrade > 100)
      ) {
        toast.error("Nilai kelulusan harus antara 0-100");
        return;
      }

      // Validate dates
      if (formData.startDate) {
        const startDate = new Date(formData.startDate);
        const now = new Date();
        if (startDate <= now) {
          toast.error("Tanggal mulai harus di masa depan");
          return;
        }
      }

      if (formData.startDate && formData.endDate) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        if (endDate <= startDate) {
          toast.error("Tanggal selesai harus setelah tanggal mulai");
          return;
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
        description: formData.description.trim() || undefined,
        timeLimit:
          formData.timeLimit > 0
            ? parseInt(formData.timeLimit.toString())
            : undefined,
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString()
          : undefined,
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : undefined,
        passingGrade:
          formData.passingGrade > 0
            ? parseInt(formData.passingGrade.toString())
            : undefined,
        status: formData.status,
      };

      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors with details
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details
            .map((err: any) => err.message)
            .join(", ");
          toast.error(errorMessages);
        } else {
          toast.error(data.error || "Gagal membuat kuis");
        }
        return;
      }

      // Transform API response to match QuizData format
      const newQuiz: QuizData = {
        id: data.id,
        title: data.title,
        description: data.description,
        classId: data.classId,
        className: data.class.name,
        classSubject: classes.find((c) => c.id === data.classId)?.subject || "",
        timeLimit: data.timeLimit,
        startDate: data.startDate,
        endDate: data.endDate,
        passingGrade: data.passingGrade,
        status: data.status,
        questionsCount: data._count?.questions || 0,
        totalStudents: 0,
        participants: 0,
        avgScore: 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      // Update local state immediately
      setQuizzes([newQuiz, ...quizzes]);

      toast.success("Kuis berhasil dibuat!");
      setIsCreateDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Create error:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal membuat kuis"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit dialog
  const handleEditClick = (quiz: QuizData) => {
    setSelectedQuiz(quiz);
    setFormData({
      title: quiz.title,
      description: quiz.description || "",
      classId: quiz.classId,
      timeLimit: quiz.timeLimit || 30,
      startDate: quiz.startDate
        ? format(new Date(quiz.startDate), "yyyy-MM-dd'T'HH:mm")
        : "",
      endDate: quiz.endDate
        ? format(new Date(quiz.endDate), "yyyy-MM-dd'T'HH:mm")
        : "",
      passingGrade: quiz.passingGrade || 70,
      status: quiz.status,
    });
    setIsEditDialogOpen(true);
  };

  // Update quiz
  const handleUpdateQuiz = async () => {
    if (!selectedQuiz) return;

    try {
      setIsLoading(true);

      // Validate required fields
      if (!formData.classId) {
        toast.error("Pilih kelas terlebih dahulu");
        return;
      }
      if (!formData.title.trim()) {
        toast.error("Judul kuis harus diisi");
        return;
      }
      if (formData.title.trim().length < 3) {
        toast.error("Judul kuis minimal 3 karakter");
        return;
      }
      if (formData.title.trim().length > 200) {
        toast.error("Judul kuis maksimal 200 karakter");
        return;
      }
      if (
        formData.description.trim() &&
        formData.description.trim().length < 10
      ) {
        toast.error("Deskripsi minimal 10 karakter jika diisi");
        return;
      }
      if (formData.description.trim().length > 2000) {
        toast.error("Deskripsi maksimal 2000 karakter");
        return;
      }
      if (
        formData.timeLimit &&
        (formData.timeLimit < 1 || formData.timeLimit > 180)
      ) {
        toast.error("Durasi harus antara 1-180 menit");
        return;
      }
      if (
        formData.passingGrade &&
        (formData.passingGrade < 0 || formData.passingGrade > 100)
      ) {
        toast.error("Nilai kelulusan harus antara 0-100");
        return;
      }

      // Validate dates (untuk update, tidak perlu validasi future date karena quiz mungkin sudah berjalan)
      if (formData.startDate && formData.endDate) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        if (endDate <= startDate) {
          toast.error("Tanggal selesai harus setelah tanggal mulai");
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Unauthorized");
        return;
      }

      const response = await fetch(`/api/quizzes/${selectedQuiz.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          timeLimit:
            formData.timeLimit > 0
              ? parseInt(formData.timeLimit.toString())
              : undefined,
          startDate: formData.startDate
            ? new Date(formData.startDate).toISOString()
            : undefined,
          endDate: formData.endDate
            ? new Date(formData.endDate).toISOString()
            : undefined,
          passingGrade:
            formData.passingGrade > 0
              ? parseInt(formData.passingGrade.toString())
              : undefined,
          status: formData.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors with details
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details
            .map((err: any) => err.message)
            .join(", ");
          toast.error(errorMessages);
        } else {
          toast.error(data.error || "Gagal mengupdate kuis");
        }
        return;
      }

      // Update local state immediately
      setQuizzes(
        quizzes.map((q) => {
          if (q.id === selectedQuiz.id) {
            return {
              ...q,
              title: data.title || q.title,
              description:
                data.description !== undefined
                  ? data.description
                  : q.description,
              timeLimit:
                data.timeLimit !== undefined ? data.timeLimit : q.timeLimit,
              startDate:
                data.startDate !== undefined ? data.startDate : q.startDate,
              endDate: data.endDate !== undefined ? data.endDate : q.endDate,
              passingGrade:
                data.passingGrade !== undefined
                  ? data.passingGrade
                  : q.passingGrade,
              status: data.status || q.status,
              updatedAt: data.updatedAt || new Date().toISOString(),
            };
          }
          return q;
        })
      );

      toast.success("Kuis berhasil diupdate!");
      setIsEditDialogOpen(false);
      setSelectedQuiz(null);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal mengupdate kuis"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Open delete dialog
  const handleDeleteClick = (quiz: QuizData) => {
    setSelectedQuiz(quiz);
    setIsDeleteDialogOpen(true);
  };

  // Delete quiz
  const handleDeleteQuiz = async () => {
    if (!selectedQuiz) return;

    try {
      setIsLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Unauthorized");
        return;
      }

      const response = await fetch(`/api/quizzes/${selectedQuiz.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete quiz");
      }

      // Update local state immediately
      setQuizzes(quizzes.filter((q) => q.id !== selectedQuiz.id));

      toast.success("Kuis berhasil dihapus!");
      setIsDeleteDialogOpen(false);
      setSelectedQuiz(null);
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus kuis"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // View quiz details/results
  const handleViewQuiz = (quizId: string) => {
    router.push(`/tutor/quizzes/${quizId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kuis</h1>
          <p className="text-muted-foreground mt-1">
            Kelola kuis untuk semua kelas
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Kuis Baru
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Kuis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizzes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kuis Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {publishedQuizzes}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Partisipan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalParticipants}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rata-rata Nilai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {overallAvgScore}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari kuis..."
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
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Quizzes List */}
      <div className="space-y-4">
        {filteredQuizzes.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Tidak ada kuis ditemukan
            </CardContent>
          </Card>
        ) : (
          filteredQuizzes.map((quiz) => (
            <Card
              key={quiz.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewQuiz(quiz.id)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{quiz.title}</h3>
                      {getStatusBadge(quiz.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {quiz.className} - {quiz.classSubject}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileQuestion className="h-4 w-4" />
                        <span>{quiz.questionsCount} soal</span>
                      </div>
                      {quiz.timeLimit && (
                        <div className="flex items-center gap-1">
                          <Timer className="h-4 w-4" />
                          <span>{quiz.timeLimit} menit</span>
                        </div>
                      )}
                      {quiz.endDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Deadline:{" "}
                            {format(new Date(quiz.endDate), "dd MMM yyyy", {
                              locale: idLocale,
                            })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>
                          {quiz.participants}/{quiz.totalStudents} partisipan
                        </span>
                      </div>
                    </div>
                    {quiz.avgScore > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          Rata-rata Nilai:
                        </span>
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          {quiz.avgScore}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div
                    className="flex gap-2 lg:shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewQuiz(quiz.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Lihat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(quiz)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(quiz)}
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
            <DialogTitle>Buat Kuis Baru</DialogTitle>
            <DialogDescription>
              Buat kuis baru untuk kelas yang Anda ajar
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
                <SelectContent className="max-h-[300px] bg-white dark:bg-gray-950">
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
              <Label htmlFor="title">Judul Kuis *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Contoh: Kuis Harian - Integral"
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
                placeholder="Deskripsi kuis (opsional)..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeLimit">Durasi (menit)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  value={formData.timeLimit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      timeLimit: parseInt(e.target.value) || 30,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passingGrade">Nilai Kelulusan</Label>
                <Input
                  id="passingGrade"
                  type="number"
                  value={formData.passingGrade}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      passingGrade: parseInt(e.target.value) || 70,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Tanggal Mulai</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Tanggal Selesai</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
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
                <SelectContent className="z-100 bg-white dark:bg-gray-950">
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button onClick={handleCreateQuiz} disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Kuis</DialogTitle>
            <DialogDescription>
              Edit informasi kuis yang sudah ada
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
              <Label htmlFor="edit-title">Judul Kuis *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
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
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-timeLimit">Durasi (menit)</Label>
                <Input
                  id="edit-timeLimit"
                  type="number"
                  value={formData.timeLimit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      timeLimit: parseInt(e.target.value) || 30,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-passingGrade">Nilai Kelulusan</Label>
                <Input
                  id="edit-passingGrade"
                  type="number"
                  value={formData.passingGrade}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      passingGrade: parseInt(e.target.value) || 70,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Tanggal Mulai</Label>
                <Input
                  id="edit-startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">Tanggal Selesai</Label>
                <Input
                  id="edit-endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
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
                <SelectContent className="z-100 bg-white dark:bg-gray-950">
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button onClick={handleUpdateQuiz} disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
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
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Kuis ini akan dihapus
              permanen beserta semua pertanyaan dan hasil attempt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuiz}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {isLoading ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
