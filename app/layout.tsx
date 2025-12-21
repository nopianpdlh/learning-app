import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Tutor Nomor Satu - Platform E-Learning Termurah Seindonesia",
    template: "%s | Tutor Nomor Satu",
  },
  description:
    "Platform E-Learning Termurah Seindonesia. Spesialis TOEFL, IELTS & Speaking. Jagonya English & Math for Kids dengan tutor bersertifikat.",
  keywords: [
    "kursus bahasa inggris",
    "les bahasa inggris",
    "TOEFL",
    "IELTS",
    "speaking",
    "belajar online",
    "e-learning",
    "tutor",
    "les matematika anak",
  ],
  authors: [{ name: "Tutor Nomor Satu" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Tutor Nomor Satu",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
