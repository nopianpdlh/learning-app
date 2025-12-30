"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DEFAULT_BLUR_DATA_URL } from "@/lib/image-utils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconSearch,
  IconUsers,
  IconClock,
  IconCheck,
  IconHourglass,
  IconBookmark,
} from "@tabler/icons-react";

interface ProgramData {
  id: string;
  name: string;
  description: string;
  subject: string;
  gradeLevel: string;
  classType: string;
  pricePerMonth: number;
  thumbnail: string | null;
  sectionsCount: number;
  availableSlots: number;
  tutors: string[];
  waitingStatus: string | null;
  isEnrolled: boolean;
}

interface StudentProgramsClientProps {
  programs: ProgramData[];
  subjects: string[];
}

export function StudentProgramsClient({
  programs,
  subjects,
}: StudentProgramsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [gradeLevelFilter, setGradeLevelFilter] = useState<string>("ALL");

  // Get unique grade levels
  const gradeLevels = [...new Set(programs.map((p) => p.gradeLevel))];

  // Filter programs
  const filteredPrograms = programs.filter((program) => {
    const matchesSearch =
      program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      subjectFilter === "ALL" || program.subject === subjectFilter;
    const matchesGrade =
      gradeLevelFilter === "ALL" || program.gradeLevel === gradeLevelFilter;
    return matchesSearch && matchesSubject && matchesGrade;
  });

  const getStatusBadge = (program: ProgramData) => {
    if (program.isEnrolled) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <IconCheck className="h-3 w-3 mr-1" />
          Terdaftar
        </Badge>
      );
    }
    if (program.waitingStatus === "PENDING") {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <IconHourglass className="h-3 w-3 mr-1" />
          Menunggu Approval
        </Badge>
      );
    }
    if (program.waitingStatus === "APPROVED") {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <IconBookmark className="h-3 w-3 mr-1" />
          Perlu Bayar
        </Badge>
      );
    }
    return null;
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
      <div>
        <h1 className="text-2xl font-bold">Cari Program</h1>
        <p className="text-muted-foreground">
          Temukan program belajar yang sesuai dengan kebutuhanmu
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari program..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Semua Subjek" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="ALL">Semua Subjek</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={gradeLevelFilter} onValueChange={setGradeLevelFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Semua Level" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="ALL">Semua Level</SelectItem>
            {gradeLevels.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Programs Grid */}
      {filteredPrograms.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            Tidak ada program yang ditemukan
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <Card
              key={program.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Thumbnail */}
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                {program.thumbnail ? (
                  <Image
                    src={program.thumbnail}
                    alt={program.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain p-2"
                    placeholder="blur"
                    blurDataURL={DEFAULT_BLUR_DATA_URL}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-blue-500 to-blue-700">
                    <IconBookmark className="h-16 w-16 text-white/50" />
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-3 right-3 z-10">
                  {getStatusBadge(program)}
                </div>
                {/* Class Type */}
                <div className="absolute bottom-3 left-3 z-10">
                  <Badge className="bg-blue-600 text-white hover:bg-blue-700 shadow-md">
                    {program.classType === "PRIVATE"
                      ? "🎯 Private"
                      : "👥 Semi-Private"}
                  </Badge>
                </div>
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold line-clamp-1">
                      {program.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {program.subject} • {program.gradeLevel}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {program.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <IconUsers className="h-4 w-4" />
                    {program.availableSlots} slot tersedia
                  </span>
                  <span className="flex items-center gap-1">
                    <IconClock className="h-4 w-4" />
                    {program.sectionsCount} kelas
                  </span>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t pt-4">
                <div>
                  <p className="text-lg font-bold text-primary">
                    {formatPrice(program.pricePerMonth)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {program.classType === "PRIVATE" ? "/pertemuan" : "/bulan"}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/student/programs/${program.id}`}>
                    {program.isEnrolled
                      ? "Lihat"
                      : program.waitingStatus
                      ? "Cek Status"
                      : "Daftar"}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
