"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TermsModal } from "@/components/legal/TermsModal";
import { PrivacyModal } from "@/components/legal/PrivacyModal";

export function Footer() {
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/logo-tutor.svg"
                alt="Tutor Nomor Satu"
                width={40}
                height={40}
                className="brightness-0 invert"
              />
              <span className="font-bold text-lg text-white">
                Tutor Nomor Satu
              </span>
            </Link>
            <p className="text-sm text-gray-400">
              Platform E-Learning Termurah Seindonesia. Spesialis TOEFL, IELTS &
              Speaking. Jagonya English & Math for Kids!
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Program Kami</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#programs"
                  className="hover:text-primary transition-colors"
                >
                  Semi-Private Dewasa
                </a>
              </li>
              <li>
                <a
                  href="#programs"
                  className="hover:text-primary transition-colors"
                >
                  Semi-Private Anak
                </a>
              </li>
              <li>
                <a
                  href="#programs"
                  className="hover:text-primary transition-colors"
                >
                  Program Private
                </a>
              </li>
              <li>
                <a
                  href="#programs"
                  className="hover:text-primary transition-colors"
                >
                  TOEFL & IELTS
                </a>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="font-semibold text-white mb-4">Informasi</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#faq" className="hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="#testimonials"
                  className="hover:text-primary transition-colors"
                >
                  Testimoni
                </a>
              </li>
              <li>
                <button
                  onClick={() => setTermsOpen(true)}
                  className="hover:text-primary transition-colors"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => setPrivacyOpen(true)}
                  className="hover:text-primary transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Hubungi Kami</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="tel:+6289607226333"
                  className="hover:text-primary transition-colors"
                >
                  +62 896-0722-6333
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@tutornomor1.com"
                  className="hover:text-primary transition-colors"
                >
                  info@tutornomor1.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/6289607226333"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © 2022-{new Date().getFullYear()} Tutor Nomor Satu. All rights
            reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <button
              onClick={() => setTermsOpen(true)}
              className="hover:text-primary transition-colors"
            >
              Terms
            </button>
            <span>•</span>
            <button
              onClick={() => setPrivacyOpen(true)}
              className="hover:text-primary transition-colors"
            >
              Privacy
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />
      <PrivacyModal open={privacyOpen} onOpenChange={setPrivacyOpen} />
    </footer>
  );
}
