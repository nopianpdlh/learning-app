import { db } from "@/lib/db";
import { SectionStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { ProgramDetailClient } from "./ProgramDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getProgram(id: string) {
  const program = await db.classTemplate.findUnique({
    where: { id, published: true },
    include: {
      sections: {
        where: { status: SectionStatus.ACTIVE },
        include: {
          _count: {
            select: { enrollments: true },
          },
        },
      },
    },
  });
  return program;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const program = await getProgram(id);

  if (!program) {
    return { title: "Program Tidak Ditemukan" };
  }

  return {
    title: `${program.name} - Tutor Nomor Satu`,
    description: program.description?.slice(0, 160),
  };
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const { id } = await params;
  const program = await getProgram(id);

  if (!program) {
    notFound();
  }

  // Transform to match client interface
  const transformedProgram = {
    ...program,
    sections: program.sections.map((section) => ({
      id: section.id,
      name: section.sectionLabel,
      schedule: null as string | null, // Could be added if available
      status: section.status,
      _count: section._count,
    })),
  };

  return <ProgramDetailClient program={transformedProgram} />;
}
