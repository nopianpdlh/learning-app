import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://tutornomorsatu.com"
  ),
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Tutor Nomor Satu",
    title: "Tutor Nomor Satu - Platform E-Learning Termurah Seindonesia",
    description:
      "Platform E-Learning Termurah Seindonesia. Spesialis TOEFL, IELTS & Speaking. Jagonya English & Math for Kids dengan tutor bersertifikat.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tutor Nomor Satu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tutor Nomor Satu - Platform E-Learning",
    description:
      "Platform E-Learning Termurah Seindonesia. Spesialis TOEFL, IELTS & Speaking.",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
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
        <NextTopLoader
          color="#3B82F6"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #3B82F6,0 0 5px #3B82F6"
        />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
