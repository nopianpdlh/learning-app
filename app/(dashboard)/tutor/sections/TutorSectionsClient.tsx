"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Users,
  FileText,
  ClipboardList,
  HelpCircle,
  Calendar,
  Search,
  Plus,
} from "lucide-react";

interface SectionData {
  id: string;
  label: string;
  status: string;
  currentEnrollments: number;
  maxEnrollments: number;
  template: {
    id: string;
    name: string;
    subject: string;
    gradeLevel: string;
    thumbnail: string | null;
    pricePerMonth: number;
    classType: string;
  };
  counts: {
    materials: number;
    assignments: number;
    quizzes: number;
    meetings: number;
  };
  createdAt: string;
}

interface Props {
  sections: SectionData[];
  stats: {
    totalSections: number;
    activeSections: number;
    totalStudents: number;
    totalMaterials: number;
  };
}

export default function TutorSectionsClient({ sections, stats }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = sections.filter(
    (section) =>
      section.template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.template.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string, current: number, max: number) => {
    if (status === "ARCHIVED") {
      return <Badge variant="secondary">Arsip</Badge>;
    }
    if (current >= max) {
      return <Badge variant="destructive">Penuh</Badge>;
    }
    return (
      <Badge variant="default" className="bg-green-600">
        Aktif
      </Badge>
    );
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
          <h1 className="text-2xl font-bold text-[#0A2647]">Section Saya</h1>
          <p className="text-muted-foreground">
            Kelola section kelas yang Anda ajar
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Section</p>
                <p className="text-2xl font-bold">{stats.totalSections}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Section Aktif</p>
                <p className="text-2xl font-bold">{stats.activeSections}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Siswa</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Materi</p>
                <p className="text-2xl font-bold">{stats.totalMaterials}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari section..."
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
            <h3 className="text-lg font-medium mb-2">Belum Ada Section</h3>
            <p className="text-muted-foreground">
              Anda belum ditugaskan ke section manapun.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSections.map((section) => (
            <Card
              key={section.id}
              className="hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              {section.template.thumbnail && (
                <div className="h-32 overflow-hidden rounded-t-lg">
                  <img
                    src={section.template.thumbnail}
                    alt={section.template.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {section.template.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Section {section.label}
                    </p>
                  </div>
                  {getStatusBadge(
                    section.status,
                    section.currentEnrollments,
                    section.maxEnrollments
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subject & Level */}
                <div className="flex gap-2">
                  <Badge variant="secondary">{section.template.subject}</Badge>
                  <Badge variant="outline">{section.template.gradeLevel}</Badge>
                  <Badge variant="outline">{section.template.classType}</Badge>
                </div>

                {/* Enrollment */}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {section.currentEnrollments}/{section.maxEnrollments} siswa
                  </span>
                </div>

                {/* Content counts */}
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {section.counts.materials}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClipboardList className="h-4 w-4" />
                    {section.counts.assignments}
                  </span>
                  <span className="flex items-center gap-1">
                    <HelpCircle className="h-4 w-4" />
                    {section.counts.quizzes}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {section.counts.meetings}
                  </span>
                </div>

                {/* Price */}
                <p className="text-sm font-medium">
                  {formatPrice(section.template.pricePerMonth)}/bulan
                </p>

                {/* Action */}
                <Button asChild className="w-full" variant="outline">
                  <Link href={`/tutor/sections/${section.id}`}>
                    Kelola Section
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
