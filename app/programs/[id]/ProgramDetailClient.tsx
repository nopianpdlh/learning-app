"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  GraduationCap,
  Video,
  FileText,
  Award,
  BookOpen,
  MessageCircle,
} from "lucide-react";

interface Section {
  id: string;
  name: string;
  schedule: string | null;
  status: string;
  _count: {
    enrollments: number;
  };
}

interface Program {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  gradeLevel: string | null;
  classType: string;
  pricePerMonth: number;
  maxStudentsPerSection: number;
  meetingsPerPeriod: number;
  periodDays: number;
  thumbnail: string | null;
  sections: Section[];
}

interface ProgramDetailClientProps {
  program: Program;
}

// Parse facilities from description
function parseFacilities(description: string | null): string[] {
  if (!description) return [];

  const lines = description.split("\n");
  const facilities: string[] = [];

  let inFacilities = false;
  for (const line of lines) {
    if (line.toLowerCase().includes("fasilitas:")) {
      inFacilities = true;
      continue;
    }
    if (inFacilities && line.trim()) {
      // Stop if we hit another section
      if (line.includes(":") && !line.startsWith("-")) break;
      const cleaned = line.replace(/^[-•]\s*/, "").trim();
      if (cleaned) facilities.push(cleaned);
    }
  }

  return facilities;
}

// Get main description (before facilities)
function getMainDescription(description: string | null): string {
  if (!description) return "";

  const parts = description.split(/fasilitas:/i);
  return parts[0].trim();
}

export function ProgramDetailClient({ program }: ProgramDetailClientProps) {
  const facilities = parseFacilities(program.description);
  const mainDescription = getMainDescription(program.description);

  const features = [
    {
      icon: Video,
      title: "Kelas Live via Zoom",
      description: "Belajar interaktif dengan tutor secara real-time",
    },
    {
      icon: FileText,
      title: "Materi Premium",
      description: "Akses buku dan files pembelajaran berkualitas",
    },
    {
      icon: BookOpen,
      title: "Rekaman Kelas",
      description: "Akses rekaman untuk belajar ulang kapan saja",
    },
    {
      icon: Award,
      title: "Sertifikat Resmi",
      description: "Dapatkan sertifikat setelah menyelesaikan program",
    },
  ];

  const availableSlots = program.sections.reduce((acc, section) => {
    return acc + (program.maxStudentsPerSection - section._count.enrollments);
  }, 0);

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-8 bg-linear-to-br from-primary/10 to-indigo-50">
        <div className="container mx-auto px-4">
          <Link
            href="/programs"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Program
          </Link>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left: Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-xl bg-gray-100">
                {program.thumbnail ? (
                  <Image
                    src={program.thumbnail}
                    alt={program.name}
                    fill
                    className="object-cover object-top"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-primary/20 to-indigo-100 flex items-center justify-center">
                    <GraduationCap className="h-20 w-20 text-primary/50" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Right: Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge className="text-sm">
                  {program.classType === "PRIVATE" ? "Private" : "Semi-Private"}
                </Badge>
                {program.gradeLevel && (
                  <Badge variant="secondary" className="text-sm">
                    {program.gradeLevel}
                  </Badge>
                )}
                <Badge variant="outline" className="text-sm">
                  {program.subject}
                </Badge>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold">{program.name}</h1>

              {/* Quick Info */}
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Max {program.maxStudentsPerSection} siswa</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{program.meetingsPerPeriod}x pertemuan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>{program.periodDays} hari</span>
                </div>
              </div>

              {/* Lesson Schedule for Semi-Private */}
              {program.classType === "SEMI_PRIVATE" && (
                <div className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700 font-medium">
                    Kelas dibuka di jam 18.45 atau 19.45 WIB
                  </span>
                </div>
              )}

              {/* Price Card */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Harga</p>
                      <p className="text-3xl font-bold text-primary">
                        Rp {program.pricePerMonth.toLocaleString("id-ID")}
                      </p>
                      <p className="text-sm text-muted-foreground">per bulan</p>
                    </div>
                    <div className="text-right">
                      {availableSlots > 0 ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          {availableSlots} slot tersedia
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-red-100 text-red-700"
                        >
                          Penuh
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <Link href="/register" className="block">
                      <Button size="lg" className="w-full text-lg">
                        Daftar Sekarang
                      </Button>
                    </Link>
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full"
                      asChild
                    >
                      <a
                        href="https://wa.me/6289607226333?text=Halo%20Tutornomor1.com%2C%20saya%20tertarik%20dengan%20program%20"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="mr-2 h-5 w-5" />
                        Tanya via WhatsApp
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Tentang Program</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray max-w-none">
                    {mainDescription.split("\n\n").map((paragraph, idx) => (
                      <p key={idx} className="text-muted-foreground mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Facilities */}
              {facilities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Fasilitas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid sm:grid-cols-2 gap-3">
                      {facilities.map((facility, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">
                            {facility}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* What You Get */}
              <Card>
                <CardHeader>
                  <CardTitle>Apa yang Anda Dapatkan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-4 rounded-lg bg-gray-50"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <feature.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{feature.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Available Sections */}
              {program.sections.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Kelas Tersedia</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {program.sections.map((section) => (
                      <div
                        key={section.id}
                        className="p-4 rounded-lg border bg-gray-50"
                      >
                        <h4 className="font-semibold">{section.name}</h4>
                        {section.schedule && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {section.schedule}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-muted-foreground">
                            {section._count.enrollments}/
                            {program.maxStudentsPerSection} siswa
                          </span>
                          {section._count.enrollments <
                          program.maxStudentsPerSection ? (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700 text-xs"
                            >
                              Tersedia
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-red-100 text-red-700 text-xs"
                            >
                              Penuh
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* CTA Card */}
              <Card className="bg-primary text-white">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold mb-2">Siap Bergabung?</h3>
                  <p className="text-white/80 mb-4">
                    Daftar sekarang dan mulai perjalanan belajar Anda!
                  </p>
                  <Link href="/register">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="w-full bg-white text-primary hover:bg-white/90"
                    >
                      Daftar Sekarang
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
