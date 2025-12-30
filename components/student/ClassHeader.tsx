"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ClassHeaderProps {
  classId: string;
  className: string;
  currentSection:
    | "overview"
    | "materials"
    | "assignments"
    | "quizzes"
    | "forum"
    | "grades"
    | "live-classes";
}

export default function ClassHeader({
  classId,
  className,
  currentSection,
}: ClassHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const sections = [
    {
      key: "overview" as const,
      label: "Overview",
      href: `/student/sections/${classId}`,
    },
    {
      key: "materials" as const,
      label: "Materi",
      href: `/student/sections/${classId}/materials`,
    },
    {
      key: "assignments" as const,
      label: "Tugas",
      href: `/student/sections/${classId}/assignments`,
    },
    {
      key: "quizzes" as const,
      label: "Kuis",
      href: `/student/sections/${classId}/quizzes`,
    },
    {
      key: "forum" as const,
      label: "Forum",
      href: `/student/sections/${classId}/forum`,
    },
    {
      key: "grades" as const,
      label: "Nilai",
      href: `/student/sections/${classId}/grades`,
    },
    {
      key: "live-classes" as const,
      label: "Live Class",
      href: `/student/sections/${classId}/live-classes`,
    },
  ];

  // Truncate long class names for mobile
  const truncatedName =
    className.length > 40 ? className.substring(0, 40) + "..." : className;

  return (
    <div className="sticky top-16 z-30 bg-white border-b shadow-sm">
      <div className="w-full px-4 py-3">
        {/* Top row: Back button + Class name */}
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/student/sections")}
            className="gap-2 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Kelas Saya</span>
          </Button>

          <div className="h-6 w-px bg-border shrink-0" />

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <BookOpen className="h-5 w-5 text-primary shrink-0" />
            <h2
              className="font-semibold text-base sm:text-lg truncate"
              title={className}
            >
              {truncatedName}
            </h2>
          </div>
        </div>

        {/* Bottom row: Section tabs - scrollable on mobile */}
        <div className="relative -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 pb-1 min-w-max">
            {sections.map((section) => {
              const isActive = currentSection === section.key;

              return (
                <Button
                  key={section.key}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  asChild
                  className={cn(
                    "whitespace-nowrap shrink-0",
                    isActive && "pointer-events-none"
                  )}
                >
                  <Link href={section.href}>{section.label}</Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
