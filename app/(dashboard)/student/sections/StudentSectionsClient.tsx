"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Users,
  FileText,
  ClipboardList,
  HelpCircle,
  Clock,
  Search,
  AlertTriangle,
  CheckCircle2,
  Timer,
} from "lucide-react";

interface EnrolledSection {
  enrollmentId: string;
  enrollmentStatus: string;
  startDate: string | null;
  expiryDate: string | null;
  daysRemaining: number;
  meetingsRemaining: number;
  totalMeetings: number;
  paymentStatus: string | null;
  section: {
    id: string;
    label: string;
    status: string;
    template: {
      id: string;
      name: string;
      subject: string;
      gradeLevel: string;
      thumbnail: string | null;
      pricePerMonth: number;
    };
    tutor: {
      name: string;
      avatar: string | null;
    };
    counts: {
      materials: number;
      assignments: number;
      quizzes: number;
    };
  };
}

interface Props {
  enrolledSections: EnrolledSection[];
}

export default function StudentSectionsClient({ enrolledSections }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = enrolledSections.filter(
    (item) =>
      item.section.template.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      item.section.template.subject
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const activeSections = filteredSections.filter(
    (s) => s.enrollmentStatus === "ACTIVE"
  );
  const pendingSections = filteredSections.filter(
    (s) => s.enrollmentStatus === "PENDING" || s.paymentStatus === "PENDING"
  );
  const expiredSections = filteredSections.filter(
    (s) => s.enrollmentStatus === "EXPIRED"
  );

  const getStatusBadge = (
    enrollmentStatus: string,
    paymentStatus: string | null,
    daysRemaining: number
  ) => {
    if (paymentStatus === "PENDING") {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          <Timer className="h-3 w-3 mr-1" />
          Menunggu Pembayaran
        </Badge>
      );
    }
    if (enrollmentStatus === "ACTIVE") {
      if (daysRemaining <= 3) {
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            {daysRemaining} hari lagi
          </Badge>
        );
      }
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Aktif
        </Badge>
      );
    }
    if (enrollmentStatus === "EXPIRED") {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }
    return <Badge variant="secondary">{enrollmentStatus}</Badge>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2647]">Kelas Saya</h1>
          <p className="text-muted-foreground">
            Daftar kelas yang sedang kamu ikuti
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kelas Aktif</p>
                <p className="text-2xl font-bold">{activeSections.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Timer className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Menunggu Bayar</p>
                <p className="text-2xl font-bold">{pendingSections.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Perlu Renewal</p>
                <p className="text-2xl font-bold">{expiredSections.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari kelas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sections Grid */}
      {filteredSections.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Belum Ada Kelas</h3>
            <p className="text-muted-foreground mb-4">
              Kamu belum terdaftar di kelas manapun.
            </p>
            <Button asChild>
              <Link href="/student/programs">Lihat Program</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSections.map((item) => (
            <Card
              key={item.enrollmentId}
              className="hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              {item.section.template.thumbnail && (
                <div className="relative aspect-4/3 overflow-hidden rounded-t-lg bg-gray-100">
                  <Image
                    src={item.section.template.thumbnail}
                    alt={item.section.template.name}
                    fill
                    className="object-cover object-top"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {item.section.template.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Section {item.section.label} • {item.section.tutor.name}
                    </p>
                  </div>
                  {getStatusBadge(
                    item.enrollmentStatus,
                    item.paymentStatus,
                    item.daysRemaining
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subject & Level */}
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {item.section.template.subject}
                  </Badge>
                  <Badge variant="outline">
                    {item.section.template.gradeLevel}
                  </Badge>
                </div>

                {/* Progress - Subscription Days */}
                {item.enrollmentStatus === "ACTIVE" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Sisa Periode
                      </span>
                      <span className="font-medium">
                        {item.daysRemaining} hari
                      </span>
                    </div>
                    <Progress
                      value={(item.daysRemaining / 30) * 100}
                      className="h-2"
                    />
                  </div>
                )}

                {/* Meeting Progress */}
                {item.totalMeetings > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pertemuan</span>
                      <span className="font-medium">
                        {item.totalMeetings - item.meetingsRemaining}/
                        {item.totalMeetings}
                      </span>
                    </div>
                    <Progress
                      value={
                        ((item.totalMeetings - item.meetingsRemaining) /
                          item.totalMeetings) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                )}

                {/* Content counts */}
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {item.section.counts.materials}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClipboardList className="h-4 w-4" />
                    {item.section.counts.assignments}
                  </span>
                  <span className="flex items-center gap-1">
                    <HelpCircle className="h-4 w-4" />
                    {item.section.counts.quizzes}
                  </span>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  {item.paymentStatus === "PENDING" ? (
                    <Button asChild className="w-full" variant="default">
                      <Link href={`/student/payment/${item.enrollmentId}`}>
                        Bayar Sekarang
                      </Link>
                    </Button>
                  ) : item.enrollmentStatus === "EXPIRED" ? (
                    <Button asChild className="w-full" variant="outline">
                      <Link href={`/student/renewal/${item.enrollmentId}`}>
                        Perpanjang
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full" variant="outline">
                      <Link href={`/student/sections/${item.section.id}`}>
                        Masuk Kelas
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
