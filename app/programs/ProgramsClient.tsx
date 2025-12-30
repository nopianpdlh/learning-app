"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { DEFAULT_BLUR_DATA_URL } from "@/lib/image-utils";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Clock, Search, Filter, ArrowRight } from "lucide-react";

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
  thumbnail: string | null;
}

interface ProgramsClientProps {
  programs: Program[];
}

export function ProgramsClient({ programs }: ProgramsClientProps) {
  const [search, setSearch] = useState("");
  const [classType, setClassType] = useState("all");
  const [gradeLevel, setGradeLevel] = useState("all");
  const [subject, setSubject] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Filter programs
  const filteredPrograms = programs
    .filter((program) => {
      const matchSearch =
        program.name.toLowerCase().includes(search.toLowerCase()) ||
        program.description?.toLowerCase().includes(search.toLowerCase());
      const matchClassType =
        classType === "all" || program.classType === classType;
      const matchGradeLevel =
        gradeLevel === "all" || program.gradeLevel === gradeLevel;
      const matchSubject = subject === "all" || program.subject === subject;

      return matchSearch && matchClassType && matchGradeLevel && matchSubject;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.pricePerMonth - b.pricePerMonth;
      if (sortBy === "price-high") return b.pricePerMonth - a.pricePerMonth;
      return 0; // newest - default order from DB
    });

  // Get unique values for filters
  const subjects = [...new Set(programs.map((p) => p.subject))];
  const gradeLevels = [
    ...new Set(programs.map((p) => p.gradeLevel).filter(Boolean)),
  ];

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-linear-to-br from-primary/10 to-indigo-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Program Kursus Kami
            </h1>
            <p className="text-lg text-muted-foreground">
              Pilih program belajar yang sesuai dengan kebutuhan Anda. Dari
              Semi-Private hingga Private, kami punya program untuk semua level.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b bg-white sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari program..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={classType} onValueChange={setClassType}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tipe Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="SEMI_PRIVATE">Semi-Private</SelectItem>
                  <SelectItem value="PRIVATE">Private</SelectItem>
                </SelectContent>
              </Select>

              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Level</SelectItem>
                  {gradeLevels.map((level) => (
                    <SelectItem key={level} value={level!}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Mata Pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Mapel</SelectItem>
                  {subjects.map((subj) => (
                    <SelectItem key={subj} value={subj}>
                      {subj}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Terbaru</SelectItem>
                  <SelectItem value="price-low">Harga Terendah</SelectItem>
                  <SelectItem value="price-high">Harga Tertinggi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-12 bg-gray-50 min-h-[50vh]">
        <div className="container mx-auto px-4">
          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-6">
            Menampilkan {filteredPrograms.length} program
          </p>

          {filteredPrograms.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">
                Tidak ada program yang ditemukan
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearch("");
                  setClassType("all");
                  setGradeLevel("all");
                  setSubject("all");
                }}
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredPrograms.map((program, index) => (
                <motion.div
                  key={program.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    {/* Thumbnail */}
                    <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
                      {program.thumbnail ? (
                        <Image
                          src={program.thumbnail}
                          alt={program.name}
                          fill
                          className="object-cover object-top group-hover:scale-110 transition-transform duration-500"
                          placeholder="blur"
                          blurDataURL={DEFAULT_BLUR_DATA_URL}
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-primary/20 to-indigo-100 flex items-center justify-center">
                          <span className="text-4xl">📚</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                      <Badge className="absolute top-3 left-3">
                        {program.classType === "PRIVATE"
                          ? "Private"
                          : "Semi-Private"}
                      </Badge>
                      {program.gradeLevel && (
                        <Badge
                          variant="secondary"
                          className="absolute top-3 right-3"
                        >
                          {program.gradeLevel}
                        </Badge>
                      )}
                    </div>

                    <CardHeader className="pb-2">
                      <h3 className="font-bold text-lg line-clamp-1">
                        {program.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {program.description}
                      </p>
                    </CardHeader>

                    <CardContent className="flex-1">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Max {program.maxStudentsPerSection}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{program.meetingsPerPeriod}x/bln</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="mt-3">
                        {program.subject}
                      </Badge>
                    </CardContent>

                    <CardFooter className="flex items-center justify-between pt-0">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Mulai dari
                        </p>
                        <p className="text-xl font-bold text-primary">
                          Rp {program.pricePerMonth.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <Link href={`/programs/${program.id}`}>
                        <Button size="sm" className="group/btn">
                          Lihat Detail
                          <ArrowRight className="ml-1 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
