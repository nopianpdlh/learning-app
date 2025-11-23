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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Users,
  FileQuestion,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Trophy,
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
  createdAt: string;
  updatedAt: string;
}

interface QuestionData {
  id: string;
  quizId: string;
  questionType: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
  points: number;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

interface AttemptData {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string | null;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  createdAt: string;
  updatedAt: string;
}

interface StudentData {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface StatsData {
  totalStudents: number;
  participants: number;
  avgScore: number;
  questionsCount: number;
  notAttemptedCount: number;
}

interface QuizDetailClientProps {
  quiz: QuizData;
  questions: QuestionData[];
  attempts: AttemptData[];
  notAttemptedStudents: StudentData[];
  stats: StatsData;
}

export default function QuizDetailClient({
  quiz: initialQuiz,
  questions: initialQuestions,
  attempts,
  notAttemptedStudents,
  stats,
}: QuizDetailClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [questions, setQuestions] = useState<QuestionData[]>(initialQuestions);
  const [isAddQuestionDialogOpen, setIsAddQuestionDialogOpen] = useState(false);
  const [isEditQuestionDialogOpen, setIsEditQuestionDialogOpen] =
    useState(false);
  const [isDeleteQuestionDialogOpen, setIsDeleteQuestionDialogOpen] =
    useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Form state for question
  const [questionForm, setQuestionForm] = useState({
    questionType: "MULTIPLE_CHOICE",
    questionText: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    explanation: "",
    points: 10,
  });

  // Reset question form
  const resetQuestionForm = () => {
    setQuestionForm({
      questionType: "MULTIPLE_CHOICE",
      questionText: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      explanation: "",
      points: 10,
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    if (status === "PUBLISHED") {
      return (
        <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
          Published
        </Badge>
      );
    } else if (status === "DRAFT") {
      return (
        <Badge className="bg-gray-500/10 text-gray-700 border-gray-500/20">
          Draft
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">
          Closed
        </Badge>
      );
    }
  };

  // Add question
  const handleAddQuestion = async () => {
    try {
      setIsLoading(true);

      // Validate required fields
      if (!questionForm.questionText.trim()) {
        toast.error("Pertanyaan harus diisi");
        return;
      }

      if (questionForm.questionType === "MULTIPLE_CHOICE") {
        // Validate options
        const filledOptions = questionForm.options.filter((opt) => opt.trim());
        if (filledOptions.length < 2) {
          toast.error("Minimal 2 pilihan jawaban harus diisi");
          return;
        }
        if (!questionForm.correctAnswer.trim()) {
          toast.error("Jawaban yang benar harus dipilih");
          return;
        }
      } else {
        if (!questionForm.correctAnswer.trim()) {
          toast.error("Jawaban yang benar harus diisi");
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
        quizId: initialQuiz.id,
        questionType: questionForm.questionType,
        questionText: questionForm.questionText.trim(),
        options:
          questionForm.questionType === "MULTIPLE_CHOICE"
            ? questionForm.options.filter((opt) => opt.trim())
            : [],
        correctAnswer: questionForm.correctAnswer.trim(),
        explanation: questionForm.explanation.trim() || null,
        points: parseInt(questionForm.points.toString()),
        orderIndex: questions.length,
      };

      const response = await fetch(`/api/quizzes/${initialQuiz.id}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add question");
      }

      const newQuestion = await response.json();

      // Update local state immediately
      setQuestions([...questions, newQuestion]);

      toast.success("Pertanyaan berhasil ditambahkan!");
      setIsAddQuestionDialogOpen(false);
      resetQuestionForm();
      router.refresh();
    } catch (error) {
      console.error("Add question error:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal menambahkan pertanyaan"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit question dialog
  const handleEditQuestionClick = (question: QuestionData) => {
    setSelectedQuestion(question);
    setQuestionForm({
      questionType: question.questionType,
      questionText: question.questionText,
      options:
        question.questionType === "MULTIPLE_CHOICE"
          ? [...question.options, "", "", "", ""].slice(0, 4)
          : ["", "", "", ""],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || "",
      points: question.points,
    });
    setIsEditQuestionDialogOpen(true);
  };

  // Update question
  const handleUpdateQuestion = async () => {
    if (!selectedQuestion) return;

    try {
      setIsLoading(true);

      // Same validation as add
      if (!questionForm.questionText.trim()) {
        toast.error("Pertanyaan harus diisi");
        return;
      }

      if (questionForm.questionType === "MULTIPLE_CHOICE") {
        const filledOptions = questionForm.options.filter((opt) => opt.trim());
        if (filledOptions.length < 2) {
          toast.error("Minimal 2 pilihan jawaban harus diisi");
          return;
        }
        if (!questionForm.correctAnswer.trim()) {
          toast.error("Jawaban yang benar harus dipilih");
          return;
        }
      } else {
        if (!questionForm.correctAnswer.trim()) {
          toast.error("Jawaban yang benar harus diisi");
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

      const response = await fetch(
        `/api/quizzes/${initialQuiz.id}/questions/${selectedQuestion.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            questionType: questionForm.questionType,
            questionText: questionForm.questionText.trim(),
            options:
              questionForm.questionType === "MULTIPLE_CHOICE"
                ? questionForm.options.filter((opt) => opt.trim())
                : [],
            correctAnswer: questionForm.correctAnswer.trim(),
            explanation: questionForm.explanation.trim() || null,
            points: parseInt(questionForm.points.toString()),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update question");
      }

      const updatedQuestion = await response.json();

      // Update local state immediately
      setQuestions(
        questions.map((q) =>
          q.id === updatedQuestion.id ? updatedQuestion : q
        )
      );

      toast.success("Pertanyaan berhasil diupdate!");
      setIsEditQuestionDialogOpen(false);
      setSelectedQuestion(null);
      resetQuestionForm();
      router.refresh();
    } catch (error) {
      console.error("Update question error:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal mengupdate pertanyaan"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Open delete question dialog
  const handleDeleteQuestionClick = (question: QuestionData) => {
    setSelectedQuestion(question);
    setIsDeleteQuestionDialogOpen(true);
  };

  // Delete question
  const handleDeleteQuestion = async () => {
    if (!selectedQuestion) return;

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
        `/api/quizzes/${initialQuiz.id}/questions/${selectedQuestion.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete question");
      }

      // Update local state immediately
      setQuestions(questions.filter((q) => q.id !== selectedQuestion.id));

      toast.success("Pertanyaan berhasil dihapus!");
      setIsDeleteQuestionDialogOpen(false);
      setSelectedQuestion(null);
      router.refresh();
    } catch (error) {
      console.error("Delete question error:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus pertanyaan"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/tutor/quizzes")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali
      </Button>

      {/* Quiz Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">{initialQuiz.title}</CardTitle>
                {getStatusBadge(initialQuiz.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                {initialQuiz.className} - {initialQuiz.classSubject}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {initialQuiz.description && (
              <div className="md:col-span-3">
                <Label className="text-muted-foreground">Deskripsi</Label>
                <p className="mt-1">{initialQuiz.description}</p>
              </div>
            )}
            {initialQuiz.timeLimit && (
              <div>
                <Label className="text-muted-foreground">Durasi</Label>
                <p className="mt-1 font-semibold">
                  {initialQuiz.timeLimit} menit
                </p>
              </div>
            )}
            {initialQuiz.passingGrade && (
              <div>
                <Label className="text-muted-foreground">Nilai Kelulusan</Label>
                <p className="mt-1 font-semibold">{initialQuiz.passingGrade}</p>
              </div>
            )}
            {initialQuiz.endDate && (
              <div>
                <Label className="text-muted-foreground">Deadline</Label>
                <p className="mt-1 font-semibold">
                  {format(new Date(initialQuiz.endDate), "dd MMMM yyyy HH:mm", {
                    locale: idLocale,
                  })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileQuestion className="h-4 w-4" />
              Soal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.questionsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Siswa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Mengerjakan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.participants}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Belum Mengerjakan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.notAttemptedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Rata-rata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.avgScore}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pertanyaan</CardTitle>
            <Button onClick={() => setIsAddQuestionDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pertanyaan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada pertanyaan. Klik tombol "Tambah Pertanyaan" untuk mulai
              membuat soal.
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={question.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">
                              {question.questionText}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">
                                {question.questionType}
                              </Badge>
                              <Badge variant="outline">
                                {question.points} poin
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditQuestionClick(question)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDeleteQuestionClick(question)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {question.questionType === "MULTIPLE_CHOICE" && (
                          <div className="space-y-1 ml-4">
                            {question.options.map((option, idx) => (
                              <div
                                key={idx}
                                className={`flex items-center gap-2 text-sm ${
                                  option === question.correctAnswer
                                    ? "text-green-600 font-medium"
                                    : "text-muted-foreground"
                                }`}
                              >
                                <span>{String.fromCharCode(65 + idx)}.</span>
                                <span>{option}</span>
                                {option === question.correctAnswer && (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {question.explanation && (
                          <div className="text-sm text-muted-foreground border-l-2 border-primary pl-3">
                            <strong>Penjelasan:</strong> {question.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attempts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Hasil Kuis</CardTitle>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada siswa yang mengerjakan kuis ini
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Waktu Mulai</TableHead>
                  <TableHead>Waktu Selesai</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={attempt.studentAvatar || ""} />
                          <AvatarFallback>
                            {attempt.studentName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{attempt.studentName}</p>
                          <p className="text-xs text-muted-foreground">
                            {attempt.studentEmail}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(attempt.startedAt), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      {attempt.submittedAt
                        ? format(
                            new Date(attempt.submittedAt),
                            "dd/MM/yyyy HH:mm"
                          )
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {attempt.score !== null ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          {attempt.score}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {attempt.submittedAt ? (
                        <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                          Selesai
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                          Sedang Mengerjakan
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Not Attempted Students */}
      {notAttemptedStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <XCircle className="inline h-5 w-5 mr-2 text-orange-600" />
              Siswa Belum Mengerjakan ({notAttemptedStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {notAttemptedStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={student.user.avatar || ""} />
                    <AvatarFallback>
                      {student.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{student.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {student.user.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Question Dialog */}
      <Dialog
        open={isAddQuestionDialogOpen}
        onOpenChange={setIsAddQuestionDialogOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Pertanyaan</DialogTitle>
            <DialogDescription>
              Tambahkan pertanyaan baru untuk kuis ini
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="questionType">Tipe Pertanyaan *</Label>
              <Select
                value={questionForm.questionType}
                onValueChange={(value) =>
                  setQuestionForm({ ...questionForm, questionType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MULTIPLE_CHOICE">Pilihan Ganda</SelectItem>
                  <SelectItem value="TRUE_FALSE">Benar/Salah</SelectItem>
                  <SelectItem value="SHORT_ANSWER">Jawaban Singkat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="questionText">Pertanyaan *</Label>
              <Textarea
                id="questionText"
                value={questionForm.questionText}
                onChange={(e) =>
                  setQuestionForm({
                    ...questionForm,
                    questionText: e.target.value,
                  })
                }
                placeholder="Tulis pertanyaan di sini..."
                rows={3}
              />
            </div>
            {questionForm.questionType === "MULTIPLE_CHOICE" && (
              <div className="space-y-2">
                <Label>Pilihan Jawaban *</Label>
                {questionForm.options.map((option, index) => (
                  <Input
                    key={index}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...questionForm.options];
                      newOptions[index] = e.target.value;
                      setQuestionForm({ ...questionForm, options: newOptions });
                    }}
                    placeholder={`Pilihan ${String.fromCharCode(65 + index)}`}
                  />
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="correctAnswer">Jawaban yang Benar *</Label>
              {questionForm.questionType === "MULTIPLE_CHOICE" ? (
                <Select
                  value={questionForm.correctAnswer}
                  onValueChange={(value) =>
                    setQuestionForm({ ...questionForm, correctAnswer: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jawaban yang benar" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionForm.options
                      .filter((opt) => opt.trim())
                      .map((option, index) => (
                        <SelectItem key={index} value={option}>
                          {String.fromCharCode(65 + index)}. {option}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ) : questionForm.questionType === "TRUE_FALSE" ? (
                <Select
                  value={questionForm.correctAnswer}
                  onValueChange={(value) =>
                    setQuestionForm({ ...questionForm, correctAnswer: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BENAR">Benar</SelectItem>
                    <SelectItem value="SALAH">Salah</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="correctAnswer"
                  value={questionForm.correctAnswer}
                  onChange={(e) =>
                    setQuestionForm({
                      ...questionForm,
                      correctAnswer: e.target.value,
                    })
                  }
                  placeholder="Jawaban yang benar"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="explanation">Penjelasan</Label>
              <Textarea
                id="explanation"
                value={questionForm.explanation}
                onChange={(e) =>
                  setQuestionForm({
                    ...questionForm,
                    explanation: e.target.value,
                  })
                }
                placeholder="Penjelasan jawaban (opsional)..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="points">Poin</Label>
              <Input
                id="points"
                type="number"
                value={questionForm.points}
                onChange={(e) =>
                  setQuestionForm({
                    ...questionForm,
                    points: parseInt(e.target.value) || 10,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddQuestionDialogOpen(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button onClick={handleAddQuestion} disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog - sama seperti Add tapi dengan data pre-filled */}
      <Dialog
        open={isEditQuestionDialogOpen}
        onOpenChange={setIsEditQuestionDialogOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pertanyaan</DialogTitle>
            <DialogDescription>
              Edit pertanyaan yang sudah ada
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-questionType">Tipe Pertanyaan *</Label>
              <Select
                value={questionForm.questionType}
                onValueChange={(value) =>
                  setQuestionForm({ ...questionForm, questionType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MULTIPLE_CHOICE">Pilihan Ganda</SelectItem>
                  <SelectItem value="TRUE_FALSE">Benar/Salah</SelectItem>
                  <SelectItem value="SHORT_ANSWER">Jawaban Singkat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-questionText">Pertanyaan *</Label>
              <Textarea
                id="edit-questionText"
                value={questionForm.questionText}
                onChange={(e) =>
                  setQuestionForm({
                    ...questionForm,
                    questionText: e.target.value,
                  })
                }
                rows={3}
              />
            </div>
            {questionForm.questionType === "MULTIPLE_CHOICE" && (
              <div className="space-y-2">
                <Label>Pilihan Jawaban *</Label>
                {questionForm.options.map((option, index) => (
                  <Input
                    key={index}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...questionForm.options];
                      newOptions[index] = e.target.value;
                      setQuestionForm({ ...questionForm, options: newOptions });
                    }}
                    placeholder={`Pilihan ${String.fromCharCode(65 + index)}`}
                  />
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-correctAnswer">Jawaban yang Benar *</Label>
              {questionForm.questionType === "MULTIPLE_CHOICE" ? (
                <Select
                  value={questionForm.correctAnswer}
                  onValueChange={(value) =>
                    setQuestionForm({ ...questionForm, correctAnswer: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questionForm.options
                      .filter((opt) => opt.trim())
                      .map((option, index) => (
                        <SelectItem key={index} value={option}>
                          {String.fromCharCode(65 + index)}. {option}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ) : questionForm.questionType === "TRUE_FALSE" ? (
                <Select
                  value={questionForm.correctAnswer}
                  onValueChange={(value) =>
                    setQuestionForm({ ...questionForm, correctAnswer: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BENAR">Benar</SelectItem>
                    <SelectItem value="SALAH">Salah</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="edit-correctAnswer"
                  value={questionForm.correctAnswer}
                  onChange={(e) =>
                    setQuestionForm({
                      ...questionForm,
                      correctAnswer: e.target.value,
                    })
                  }
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-explanation">Penjelasan</Label>
              <Textarea
                id="edit-explanation"
                value={questionForm.explanation}
                onChange={(e) =>
                  setQuestionForm({
                    ...questionForm,
                    explanation: e.target.value,
                  })
                }
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-points">Poin</Label>
              <Input
                id="edit-points"
                type="number"
                value={questionForm.points}
                onChange={(e) =>
                  setQuestionForm({
                    ...questionForm,
                    points: parseInt(e.target.value) || 10,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditQuestionDialogOpen(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button onClick={handleUpdateQuestion} disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Question Confirmation */}
      <AlertDialog
        open={isDeleteQuestionDialogOpen}
        onOpenChange={setIsDeleteQuestionDialogOpen}
      >
        <AlertDialogContent className="bg-white dark:bg-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">
              Apakah Anda yakin?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Tindakan ini tidak dapat dibatalkan. Pertanyaan ini akan dihapus
              permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuestion}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
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
