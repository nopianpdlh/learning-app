"use client";

/**
 * Grade Submission Modal Component
 * Allows tutor to grade a student submission
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GradeSubmissionModalProps {
  submission: {
    id: string;
    fileUrl: string;
    score: number | null;
    feedback: string | null;
    submittedAt: Date;
  };
  assignment: {
    id: string;
    title: string;
    maxPoints: number;
  };
  studentName: string;
  classId: string;
}

export default function GradeSubmissionModal({
  submission,
  assignment,
  studentName,
  classId,
}: GradeSubmissionModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [score, setScore] = useState(submission.score?.toString() || "");
  const [feedback, setFeedback] = useState(submission.feedback || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const scoreNum = Number(score);

      // Validate score
      if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > assignment.maxPoints) {
        throw new Error(`Nilai harus antara 0 dan ${assignment.maxPoints}`);
      }

      const response = await fetch(
        `/api/assignments/${assignment.id}/submissions/${submission.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: scoreNum,
            feedback: feedback.trim() || undefined,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to grade submission");
      }

      setSuccess("Nilai berhasil disimpan!");

      // Refresh and close after short delay
      setTimeout(() => {
        router.refresh();
        setIsOpen(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan nilai");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        {submission.score !== null ? "Edit Nilai" : "Beri Nilai"}
      </Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Penilaian Tugas
              </h2>
              <p className="text-gray-600 mt-1">
                Siswa: <span className="font-medium">{studentName}</span>
              </p>
              <p className="text-gray-600">
                Tugas: <span className="font-medium">{assignment.title}</span>
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              {/* Submission File */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  File Pengumpulan
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <a
                    href={submission.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Lihat File Pengumpulan
                  </a>
                  <p className="text-sm text-gray-500 mt-2">
                    Dikumpulkan:{" "}
                    {new Date(submission.submittedAt).toLocaleDateString(
                      "id-ID",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
              </div>

              {/* Grading Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
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

                {/* Score */}
                <div>
                  <Label htmlFor="score">Nilai *</Label>
                  <Input
                    id="score"
                    type="number"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder={`0 - ${assignment.maxPoints}`}
                    required
                    min={0}
                    max={assignment.maxPoints}
                    step={0.5}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Maksimal: {assignment.maxPoints} poin
                  </p>
                </div>

                {/* Feedback */}
                <div>
                  <Label htmlFor="feedback">Feedback (Opsional)</Label>
                  <textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Berikan feedback untuk siswa..."
                    maxLength={2000}
                    rows={6}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {feedback.length}/2000 karakter
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Menyimpan..." : "Simpan Nilai"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={loading}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
