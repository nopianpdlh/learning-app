import { Metadata } from "next";
import { RegisterWizard } from "@/components/auth/RegisterWizard";

export const metadata: Metadata = {
  title: "Daftar - Tutor Nomor Satu",
  description:
    "Daftar akun baru di Tutor Nomor Satu. Mulai perjalanan belajar Anda dengan tutor bersertifikat.",
  openGraph: {
    title: "Daftar - Tutor Nomor Satu",
    description: "Daftar akun baru dan mulai belajar bersama tutor terbaik",
    type: "website",
  },
};

export default function RegisterPage() {
  return <RegisterWizard />;
}
