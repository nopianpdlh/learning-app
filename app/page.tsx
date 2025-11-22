import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Award } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Tutor Nomor Satu</h1>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Masuk</Button>
            </Link>
            <Link href="/register">
              <Button>Daftar Gratis</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-5xl font-bold mb-6">
            Platform E-Learning Terbaik untuk Masa Depan Cerah
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Belajar dengan tutor terbaik, akses materi berkualitas, dan raih
            prestasi maksimal
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-8 py-6">
              Mulai Belajar Sekarang
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Materi Lengkap</h3>
              <p className="text-gray-600">
                Ribuan materi pembelajaran dari berbagai mata pelajaran
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">
                Tutor Berpengalaman
              </h3>
              <p className="text-gray-600">
                Belajar langsung dari tutor profesional dan bersertifikat
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Award className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Sertifikat Resmi</h3>
              <p className="text-gray-600">
                Dapatkan sertifikat setelah menyelesaikan kelas
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="bg-white border-t py-8 mt-16">
        <div className="container mx-auto text-center text-gray-600">
          <p>&copy; 2024 Tutor Nomor Satu. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
