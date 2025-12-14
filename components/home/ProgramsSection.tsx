"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { programs } from "@/lib/home-data";
import { Users, Clock, ArrowRight } from "lucide-react";

const tabs = [
  { id: "all", label: "Semua Program" },
  { id: "Dewasa", label: "Semi-Private Dewasa" },
  { id: "Anak", label: "Semi-Private Anak" },
  { id: "PRIVATE", label: "Program Private" },
];

export function ProgramsSection() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredPrograms = programs.filter((program) => {
    if (activeTab === "all") return true;
    if (activeTab === "PRIVATE") return program.classType === "PRIVATE";
    return program.gradeLevel === activeTab;
  });

  return (
    <section id="programs" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Program Kursus Kami
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            Pilih Program yang Sesuai Kebutuhan
          </h2>
          <p className="text-muted-foreground">
            Dari Semi-Private untuk belajar bersama hingga Private untuk fokus
            maksimal, kami punya program untuk semua level.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="rounded-full"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Programs Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredPrograms.map((program, index) => (
            <motion.div
              key={program.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                {/* Thumbnail */}
                <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
                  <Image
                    src={program.thumbnail}
                    alt={program.name}
                    fill
                    className="object-cover object-top group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  <Badge className="absolute top-3 left-3">
                    {program.classType === "PRIVATE"
                      ? "Private"
                      : "Semi-Private"}
                  </Badge>
                  <Badge variant="secondary" className="absolute top-3 right-3">
                    {program.gradeLevel}
                  </Badge>
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
                </CardContent>

                <CardFooter className="flex items-center justify-between pt-0">
                  <div>
                    <p className="text-xs text-muted-foreground">Mulai dari</p>
                    <p className="text-xl font-bold text-primary">
                      Rp {program.pricePerMonth.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <Link href={`/programs/${program.id}`}>
                    <Button size="sm" className="group/btn">
                      Detail
                      <ArrowRight className="ml-1 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* View All */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link href="/programs">
            <Button variant="outline" size="lg">
              Lihat Semua Program
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
