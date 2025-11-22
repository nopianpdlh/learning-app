"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Users, Clock, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";

interface ClassDetail {
  id: string;
  name: string;
  description: string;
  subject: string;
  gradeLevel: string;
  price: number;
  capacity: number;
  schedule: string;
  thumbnail: string | null;
  tutor: {
    user: {
      name: string;
      email: string;
      avatar: string | null;
    };
    bio: string | null;
    subjects: string[];
    experience: number | null;
  };
  _count: {
    enrollments: number;
    materials: number;
    assignments: number;
    quizzes: number;
  };
}

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchClassDetail();
    }
  }, [params.id]);

  const fetchClassDetail = async () => {
    try {
      const response = await fetch(`/api/classes/${params.id}`);
      if (!response.ok) throw new Error("Kelas tidak ditemukan");

      const data = await response.json();
      setClassData(data.class);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    setError(null);

    try {
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: params.id,
          paymentMethod: "qris", // Default payment method, can be made dynamic
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mendaftar");
      }

      const data = await response.json();

      // Redirect to payment page or payment status page
      if (data.payment?.paymentUrl) {
        // Redirect to Pakasir payment page
        window.location.href = data.payment.paymentUrl;
      } else {
        // Fallback: redirect to payment status page
        router.push(`/payment/status?enrollmentId=${data.enrollment.id}`);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error && !classData) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  if (!classData) return null;

  const tutorInitials = classData.tutor.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isFull = classData._count.enrollments >= classData.capacity;

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali
      </Button>

      {classData.thumbnail && (
        <div className="w-full h-64 md:h-96 rounded-lg overflow-hidden">
          <img
            src={classData.thumbnail}
            alt={classData.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-2">
                    {classData.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {classData.subject}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {classData.gradeLevel}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Harga</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatCurrency(classData.price)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold mb-2">Deskripsi Kelas</h3>
              <p className="text-gray-700 whitespace-pre-line">
                {classData.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informasi Kelas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Jadwal</p>
                    <p className="font-medium">{classData.schedule}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Kapasitas</p>
                    <p className="font-medium">
                      {classData._count.enrollments} / {classData.capacity}{" "}
                      siswa
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Materi</p>
                    <p className="font-medium">
                      {classData._count.materials} materi
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Tugas & Kuis</p>
                    <p className="font-medium">
                      {classData._count.assignments + classData._count.quizzes}{" "}
                      total
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tentang Tutor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={classData.tutor.user.avatar || undefined} />
                  <AvatarFallback>{tutorInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">
                    {classData.tutor.user.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {classData.tutor.user.email}
                  </p>
                  {classData.tutor.experience && (
                    <p className="text-sm text-gray-600 mb-2">
                      Pengalaman: {classData.tutor.experience} tahun
                    </p>
                  )}
                  {classData.tutor.bio && (
                    <p className="text-gray-700 mt-2">{classData.tutor.bio}</p>
                  )}
                  {classData.tutor.subjects.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {classData.tutor.subjects.map((subject, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Daftar Sekarang</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Harga Kelas</span>
                  <span className="font-semibold">
                    {formatCurrency(classData.price)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">
                    {formatCurrency(classData.price)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleEnroll}
                disabled={enrolling || isFull}
              >
                {enrolling
                  ? "Memproses..."
                  : isFull
                  ? "Kelas Penuh"
                  : "Daftar & Bayar"}
              </Button>

              <div className="text-xs text-gray-600 text-center">
                Dengan mendaftar, Anda menyetujui syarat dan ketentuan yang
                berlaku
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
