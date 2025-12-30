import { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Login - Tutor Nomor Satu",
  description:
    "Masuk ke akun Tutor Nomor Satu Anda untuk mengakses kelas, materi, dan fitur lainnya.",
  openGraph: {
    title: "Login - Tutor Nomor Satu",
    description: "Masuk ke akun Tutor Nomor Satu Anda",
    type: "website",
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
