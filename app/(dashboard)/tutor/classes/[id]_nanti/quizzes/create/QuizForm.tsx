"use client";

/**
 * Quiz Form Component
 * Used for creating and editing quizzes with question builder
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Question {
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
  orderIndex: number;
}

interface QuizFormProps {
  classId: string;
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    timeLimit: number | null;
    startDate: Date | null;
    endDate: Date | null;
    passingGrade: number | null;
    status: "DRAFT" | "PUBLISHED" | "CLOSED";
    questions: Question[];
  };
}

export default function QuizForm({ classId, initialData }: QuizFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [timeLimit, setTimeLimit] = useState<string>(
    initialData?.timeLimit?.toString() || ""
  );
  const [startDate, setStartDate] = useState(
    initialData?.startDate
      ? new Date(initialData.startDate).toISOString().slice(0, 16)
      : ""
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate
      ? new Date(initialData.endDate).toISOString().slice(0, 16)
      : ""
  );
  const [passingGrade, setPassingGrade] = useState<string>(
    initialData?.passingGrade?.toString() || ""
  );
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "CLOSED">(
    initialData?.status || "DRAFT"
  );

  // Questions state
  const [questions, setQuestions] = useState<Question[]>(
    initialData?.questions || []
  );
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  // Current question being edited
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    questionType: "MULTIPLE_CHOICE",
    questionText: "",
    options: ["", ""],
    correctAnswer: "",
    explanation: "",
    points: 10,
    orderIndex: questions.length,
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addOption = () => {
    if (currentQuestion.options.length < 6) {
      setCurrentQuestion({
        ...currentQuestion,
        options: [...currentQuestion.options, ""],
      });
    }
  };

  const removeOption = (index: number) => {
    if (currentQuestion.options.length > 2) {
      const newOptions = currentQuestion.options.filter((_, i) => i !== index);
      setCurrentQuestion({
        ...currentQuestion,
        options: newOptions,
      });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions,
    });
  };

  const handleAddQuestion = () => {
    // Validate question
    if (!currentQuestion.questionText.trim()) {
      setError("Question text is required");
      return;
    }

    if (currentQuestion.questionType === "MULTIPLE_CHOICE") {
      const validOptions = currentQuestion.options.filter((o) => o.trim());
      if (validOptions.length < 2) {
        setError("Multiple choice questions must have at least 2 options");
        return;
      }
      if (!currentQuestion.correctAnswer.trim()) {
        setError("Correct answer is required");
        return;
      }
      if (!validOptions.includes(currentQuestion.correctAnswer)) {
        setError("Correct answer must be one of the options");
        return;
      }
    } else if (!currentQuestion.correctAnswer.trim()) {
      setError("Correct answer is required");
      return;
    }

    if (editingIndex !== null) {
      // Update existing question
      const newQuestions = [...questions];
      newQuestions[editingIndex] = {
        ...currentQuestion,
        orderIndex: editingIndex,
      };
      setQuestions(newQuestions);
      setEditingIndex(null);
    } else {
      // Add new question
      setQuestions([
        ...questions,
        { ...currentQuestion, orderIndex: questions.length },
      ]);
    }

    // Reset form
    setCurrentQuestion({
      questionType: "MULTIPLE_CHOICE",
      questionText: "",
      options: ["", ""],
      correctAnswer: "",
      explanation: "",
      points: 10,
      orderIndex: questions.length + 1,
    });
    setShowQuestionForm(false);
    setError("");
  };

  const handleEditQuestion = (index: number) => {
    setCurrentQuestion(questions[index]);
    setEditingIndex(index);
    setShowQuestionForm(true);
  };

  const handleDeleteQuestion = (index: number) => {
    const newQuestions = questions
      .filter((_, i) => i !== index)
      .map((q, i) => ({ ...q, orderIndex: i }));
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (questions.length === 0) {
        throw new Error("Quiz must have at least 1 question");
      }

      const payload = {
        classId,
        title,
        description: description || undefined,
        timeLimit: timeLimit ? Number(timeLimit) : undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        passingGrade: passingGrade ? Number(passingGrade) : undefined,
        status,
        questions: questions.map((q) => ({
          ...q,
          options:
            q.questionType === "MULTIPLE_CHOICE"
              ? q.options.filter((o) => o.trim())
              : [],
        })),
      };

      const url = initialData
        ? `/api/quizzes/${initialData.id}`
        : "/api/quizzes";
      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save quiz");
      }

      setSuccess(
        initialData ? "Kuis berhasil diupdate!" : "Kuis berhasil dibuat!"
      );

      // Redirect after short delay
      setTimeout(() => {
        router.push(`/tutor/classes/${classId}/quizzes`);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan kuis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {success}
        </div>
      )}

      {/* Quiz Details Form */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Detail Kuis</h2>

        {/* Title */}
        <div>
          <Label htmlFor="title">Judul Kuis *</Label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Kuis Bab 1: Algoritma Sorting"
            required
            minLength={3}
            maxLength={200}
            className="mt-1"
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Deskripsi (Opsional)</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi singkat tentang kuis ini..."
            maxLength={2000}
            rows={3}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Time Limit */}
        <div>
          <Label htmlFor="timeLimit">Batas Waktu (Menit, Opsional)</Label>
          <Input
            id="timeLimit"
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            placeholder="Contoh: 60"
            min={1}
            max={180}
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            Jika diisi, siswa harus menyelesaikan kuis dalam waktu yang
            ditentukan
          </p>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Tanggal Mulai (Opsional)</Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="endDate">Tanggal Berakhir (Opsional)</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Passing Grade */}
        <div>
          <Label htmlFor="passingGrade">Nilai Kelulusan % (Opsional)</Label>
          <Input
            id="passingGrade"
            type="number"
            value={passingGrade}
            onChange={(e) => setPassingGrade(e.target.value)}
            placeholder="Contoh: 70"
            min={0}
            max={100}
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            Nilai minimum untuk dinyatakan lulus kuis ini
          </p>
        </div>

        {/* Status */}
        <div>
          <Label htmlFor="status">Status *</Label>
          <select
            id="status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "DRAFT" | "PUBLISHED" | "CLOSED")
            }
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="DRAFT">Draft (Belum terlihat siswa)</option>
            <option value="PUBLISHED">
              Published (Siswa dapat mengerjakan)
            </option>
            <option value="CLOSED">Closed (Tidak dapat dikerjakan lagi)</option>
          </select>
        </div>
      </div>

      {/* Questions Section */}
      <div className="border-t border-gray-200 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Soal ({questions.length})
          </h2>
          {!showQuestionForm && (
            <Button
              type="button"
              onClick={() => setShowQuestionForm(true)}
              variant="outline"
            >
              + Tambah Soal
            </Button>
          )}
        </div>

        {/* Question List */}
        {questions.length > 0 && (
          <div className="space-y-4 mb-6">
            {questions.map((q, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        #{index + 1}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {q.questionType === "MULTIPLE_CHOICE"
                          ? "Multiple Choice"
                          : q.questionType === "TRUE_FALSE"
                          ? "True/False"
                          : "Short Answer"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {q.points} poin
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium mb-2">
                      {q.questionText}
                    </p>
                    {q.questionType === "MULTIPLE_CHOICE" && (
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {q.options.map((opt, i) => (
                          <li
                            key={i}
                            className={
                              opt === q.correctAnswer
                                ? "text-green-600 font-medium"
                                : ""
                            }
                          >
                            {opt}
                            {opt === q.correctAnswer && " ✓ (Jawaban Benar)"}
                          </li>
                        ))}
                      </ul>
                    )}
                    {q.questionType !== "MULTIPLE_CHOICE" && (
                      <p className="text-sm text-green-600 font-medium">
                        ✓ Jawaban: {q.correctAnswer}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditQuestion(index)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteQuestion(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Question Form */}
        {showQuestionForm && (
          <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingIndex !== null ? "Edit Soal" : "Tambah Soal Baru"}
            </h3>

            <div className="space-y-4">
              {/* Question Type */}
              <div>
                <Label htmlFor="questionType">Tipe Soal *</Label>
                <select
                  id="questionType"
                  value={currentQuestion.questionType}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      questionType: e.target.value as any,
                      options:
                        e.target.value === "MULTIPLE_CHOICE" ? ["", ""] : [],
                      correctAnswer: "",
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MULTIPLE_CHOICE">
                    Multiple Choice (Pilihan Ganda)
                  </option>
                  <option value="TRUE_FALSE">True/False (Benar/Salah)</option>
                  <option value="SHORT_ANSWER">
                    Short Answer (Jawaban Singkat)
                  </option>
                </select>
              </div>

              {/* Question Text */}
              <div>
                <Label htmlFor="questionText">Teks Soal *</Label>
                <textarea
                  id="questionText"
                  value={currentQuestion.questionText}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      questionText: e.target.value,
                    })
                  }
                  placeholder="Tulis soal di sini..."
                  required
                  minLength={5}
                  maxLength={2000}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Options (Multiple Choice) */}
              {currentQuestion.questionType === "MULTIPLE_CHOICE" && (
                <div>
                  <Label>Pilihan Jawaban *</Label>
                  <div className="space-y-2 mt-2">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Pilihan ${String.fromCharCode(
                            65 + index
                          )}`}
                          className="flex-1"
                        />
                        {currentQuestion.options.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOption(index)}
                          >
                            Hapus
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {currentQuestion.options.length < 6 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      className="mt-2"
                    >
                      + Tambah Pilihan
                    </Button>
                  )}
                </div>
              )}

              {/* Correct Answer */}
              <div>
                <Label htmlFor="correctAnswer">Jawaban Benar *</Label>
                {currentQuestion.questionType === "MULTIPLE_CHOICE" ? (
                  <select
                    id="correctAnswer"
                    value={currentQuestion.correctAnswer}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        correctAnswer: e.target.value,
                      })
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih jawaban benar</option>
                    {currentQuestion.options
                      .filter((o) => o.trim())
                      .map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                  </select>
                ) : currentQuestion.questionType === "TRUE_FALSE" ? (
                  <select
                    id="correctAnswer"
                    value={currentQuestion.correctAnswer}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        correctAnswer: e.target.value,
                      })
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih jawaban benar</option>
                    <option value="true">True (Benar)</option>
                    <option value="false">False (Salah)</option>
                  </select>
                ) : (
                  <Input
                    id="correctAnswer"
                    value={currentQuestion.correctAnswer}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        correctAnswer: e.target.value,
                      })
                    }
                    placeholder="Tulis jawaban yang benar"
                    className="mt-1"
                  />
                )}
              </div>

              {/* Explanation */}
              <div>
                <Label htmlFor="explanation">Penjelasan (Opsional)</Label>
                <textarea
                  id="explanation"
                  value={currentQuestion.explanation}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      explanation: e.target.value,
                    })
                  }
                  placeholder="Penjelasan akan ditampilkan setelah siswa submit jawaban"
                  maxLength={1000}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Points */}
              <div>
                <Label htmlFor="points">Poin *</Label>
                <Input
                  id="points"
                  type="number"
                  value={currentQuestion.points}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      points: Number(e.target.value),
                    })
                  }
                  min={1}
                  max={100}
                  className="mt-1"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="button" onClick={handleAddQuestion}>
                  {editingIndex !== null ? "Update Soal" : "Tambah Soal"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowQuestionForm(false);
                    setEditingIndex(null);
                    setCurrentQuestion({
                      questionType: "MULTIPLE_CHOICE",
                      questionText: "",
                      options: ["", ""],
                      correctAnswer: "",
                      explanation: "",
                      points: 10,
                      orderIndex: questions.length,
                    });
                  }}
                >
                  Batal
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <Button
          onClick={handleSubmit}
          disabled={loading || questions.length === 0}
          className="flex-1"
        >
          {loading ? "Menyimpan..." : initialData ? "Update Kuis" : "Buat Kuis"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Batal
        </Button>
      </div>

      {questions.length === 0 && (
        <p className="text-sm text-red-600 text-center">
          ⚠️ Kuis harus memiliki minimal 1 soal
        </p>
      )}
    </div>
  );
}
