import { Metadata } from "next";
import { db } from "@/lib/db";
import { SectionStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { ProgramDetailClient } from "./ProgramDetailClient";

// Revalidate every 5 minutes (ISR)
export const revalidate = 300;

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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const program = await getProgram(id);

  if (!program) {
    return { title: "Program Tidak Ditemukan" };
  }

  return {
    title: `${program.name} - Tutor Nomor Satu`,
    description:
      program.description?.slice(0, 160) ||
      `Program ${program.name} dengan tutor bersertifikat`,
    keywords: [
      program.subject,
      program.gradeLevel,
      "kursus online",
      "bimbel",
    ].filter(Boolean),
    openGraph: {
      title: `${program.name} - Tutor Nomor Satu`,
      description:
        program.description?.slice(0, 160) || `Program ${program.name}`,
      type: "website",
      images: program.thumbnail ? [program.thumbnail] : undefined,
    },
  };
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const { id } = await params;
  const program = await getProgram(id);

  if (!program) {
    notFound();
  }

  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: program.name,
    description: program.description,
    provider: {
      "@type": "Organization",
      name: "Tutor Nomor Satu",
      url: process.env.NEXT_PUBLIC_APP_URL,
    },
    offers: {
      "@type": "Offer",
      price: program.pricePerMonth,
      priceCurrency: "IDR",
    },
  };

  // Transform to match client interface
  const transformedProgram = {
    ...program,
    sections: program.sections.map((section) => ({
      id: section.id,
      name: section.sectionLabel,
      schedule: null as string | null,
      status: section.status,
      _count: section._count,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProgramDetailClient program={transformedProgram} />
    </>
  );
}
