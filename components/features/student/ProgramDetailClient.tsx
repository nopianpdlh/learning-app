"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { DEFAULT_BLUR_DATA_URL } from "@/lib/image-utils";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
  IconArrowLeft,
  IconUsers,
  IconClock,
  IconCalendar,
  IconCurrencyDollar,
  IconCheck,
  IconHourglass,
  IconLoader2,
  IconBookmark,
} from "@tabler/icons-react";

interface SectionData {
  id: string;
  label: string;
  tutorName: string;
  tutorAvatar: string | null;
  currentStudents: number;
  maxStudents: number;
  isFull: boolean;
}

interface ProgramData {
  id: string;
  name: string;
  description: string;
  subject: string;
  gradeLevel: string;
  classType: string;
  pricePerMonth: number;
  maxStudentsPerSection: number;
  meetingsPerPeriod: number;
  periodDays: number;
  thumbnail: string | null;
  sections: SectionData[];
}

interface StudentStatus {
  isEnrolled: boolean;
  enrolledSection: string | null;
  enrollmentStatus: string | null;
  waitingStatus: string | null;
  waitingAssignedSection: string | null;
}

interface ProgramDetailClientProps {
  program: ProgramData;
  studentStatus: StudentStatus;
  studentId: string;
}

export function ProgramDetailClient({
  program,
  studentStatus,
  studentId,
}: ProgramDetailClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleJoinWaitingList = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/student/programs/waiting-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: program.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mendaftar");
      }

      toast.success("Berhasil mendaftar ke waiting list!");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal mendaftar ke waiting list");
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
    }
  };

  const getStatusContent = () => {
    if (studentStatus.isEnrolled) {
      return (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <IconCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800">
                  Kamu sudah terdaftar di program ini!
                </p>
                <p className="text-sm text-green-600">
                  Section {studentStatus.enrolledSection} • Status:{" "}
                  {studentStatus.enrollmentStatus}
                </p>
              </div>
            </div>
            <Button className="mt-4 w-full" asChild>
              <Link href="/student/sections">Ke Kelas Saya</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (studentStatus.waitingStatus === "PENDING") {
      return (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <IconHourglass className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-yellow-800">
                  Pendaftaranmu sedang diproses
                </p>
                <p className="text-sm text-yellow-600">
                  Admin akan segera mereview permintaanmu
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (studentStatus.waitingStatus === "APPROVED") {
      return (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <IconBookmark className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-800">
                  Pendaftaranmu sudah disetujui!
                </p>
                <p className="text-sm text-blue-600">
                  Silakan lakukan pembayaran untuk mengaktifkan kelas
                </p>
              </div>
            </div>
            <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700">
              Bayar Sekarang
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (studentStatus.waitingStatus === "REJECTED") {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <IconBookmark className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-800">
                  Pendaftaranmu ditolak
                </p>
                <p className="text-sm text-red-600">
                  Silakan hubungi admin untuk informasi lebih lanjut
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Can register
    const hasAvailableSlots = program.sections.some((s) => !s.isFull);
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {formatPrice(program.pricePerMonth)}
              </p>
              <p className="text-sm text-muted-foreground">per bulan</p>
            </div>
            <Separator />
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-green-600" />
                {program.meetingsPerPeriod} pertemuan per bulan
              </li>
              <li className="flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-green-600" />
                {program.classType === "PRIVATE"
                  ? "Kelas Private 1-on-1"
                  : `Kelas Semi-Private (max ${program.maxStudentsPerSection} siswa)`}
              </li>
              <li className="flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-green-600" />
                Akses materi pembelajaran
              </li>
              <li className="flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-green-600" />
                Tugas dan kuis interaktif
              </li>
            </ul>
            <Button
              className="w-full"
              size="lg"
              disabled={!hasAvailableSlots || isLoading}
              onClick={() => setShowConfirmDialog(true)}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mendaftar...
                </>
              ) : hasAvailableSlots ? (
                "Daftar Sekarang"
              ) : (
                "Kelas Penuh"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/student/programs">
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card className="overflow-hidden">
            <div className="relative h-56 bg-slate-100 overflow-hidden">
              {program.thumbnail ? (
                <Image
                  src={program.thumbnail}
                  alt={program.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 66vw"
                  className="object-contain p-4"
                  placeholder="blur"
                  blurDataURL={DEFAULT_BLUR_DATA_URL}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-blue-500 to-blue-700">
                  <IconBookmark className="h-20 w-20 text-white/50" />
                </div>
              )}
            </div>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{program.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge>{program.subject}</Badge>
                    <Badge variant="outline">{program.gradeLevel}</Badge>
                    <Badge variant="secondary">
                      {program.classType === "PRIVATE"
                        ? "Private"
                        : "Semi-Private"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{program.description}</p>
            </CardContent>
          </Card>

          {/* Program Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Program</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <IconClock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-semibold">{program.meetingsPerPeriod}x</p>
                  <p className="text-sm text-muted-foreground">Pertemuan</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <IconCalendar className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-semibold">{program.periodDays} Hari</p>
                  <p className="text-sm text-muted-foreground">Periode</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <IconUsers className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-semibold">
                    {program.maxStudentsPerSection}
                  </p>
                  <p className="text-sm text-muted-foreground">Max Siswa</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <IconCurrencyDollar className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-semibold">
                    {formatPrice(program.pricePerMonth)}
                  </p>
                  <p className="text-sm text-muted-foreground">Per Bulan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kelas Tersedia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {program.sections.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Belum ada kelas tersedia
                  </p>
                ) : (
                  program.sections.map((section) => (
                    <div
                      key={section.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={section.tutorAvatar || ""}
                            alt={section.tutorName}
                          />
                          <AvatarFallback>
                            {section.tutorName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Kelas {section.label}</p>
                          <p className="text-sm text-muted-foreground">
                            Tutor: {section.tutorName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={section.isFull ? "destructive" : "default"}
                        >
                          {section.currentStudents}/{section.maxStudents} siswa
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">{getStatusContent()}</div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Daftar Program</AlertDialogTitle>
            <AlertDialogDescription>
              Kamu akan mendaftar ke program <strong>{program.name}</strong>.
              Setelah mendaftar, admin akan mereview dan menentukan kelas yang
              sesuai untukmu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleJoinWaitingList}
              disabled={isLoading}
            >
              {isLoading ? "Mendaftar..." : "Ya, Daftar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
