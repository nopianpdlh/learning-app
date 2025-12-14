import { db } from "@/lib/db";
import { ProgramsClient } from "./ProgramsClient";

export const metadata = {
  title: "Program Kursus - Tutor Nomor Satu",
  description:
    "Pilih program kursus bahasa Inggris dan Matematika terbaik. Semi-Private, Private, TOEFL, IELTS, dan lainnya.",
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
