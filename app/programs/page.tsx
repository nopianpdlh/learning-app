import { Metadata } from "next";
import { db } from "@/lib/db";
import { ProgramsClient } from "./ProgramsClient";

// Revalidate every 5 minutes (ISR)
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Program Kursus - Tutor Nomor Satu",
  description:
    "Pilih program kursus bahasa Inggris dan Matematika terbaik. Semi-Private, Private, TOEFL, IELTS, Speaking dan lainnya dengan tutor bersertifikat.",
  keywords: [
    "kursus bahasa inggris",
    "les privat",
    "TOEFL preparation",
    "IELTS preparation",
    "les matematika anak",
    "bimbel online",
  ],
  openGraph: {
    title: "Program Kursus - Tutor Nomor Satu",
    description:
      "Pilih program kursus bahasa Inggris dan Matematika terbaik dengan tutor bersertifikat.",
    type: "website",
  },
};

async function getPrograms() {
  const programs = await db.classTemplate.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });
  return programs;
}

export default async function ProgramsPage() {
  const programs = await getPrograms();

  return (
    <main className="min-h-screen">
      <ProgramsClient programs={programs} />
    </main>
  );
}
