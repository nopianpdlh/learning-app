"use client";

import { motion } from "framer-motion";
import { whyChooseUs } from "@/lib/home-data";
import {
  Smile,
  GraduationCap,
  Lightbulb,
  Target,
  Wallet,
  Clock,
} from "lucide-react";

const iconMap = {
  smile: Smile,
  graduation: GraduationCap,
  lightbulb: Lightbulb,
  target: Target,
  wallet: Wallet,
  clock: Clock,
};

export function WhyChooseUsSection() {
  return (
    <section className="py-20 bg-linear-to-br from-primary to-indigo-700 text-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-white/80 font-semibold text-sm uppercase tracking-wider">
            Keunggulan Kami
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            Kenapa Memilih Tutor Nomor Satu?
          </h2>
          <p className="text-white/80">
            Mempunyai Tutor Terbaik dengan standar kualitas tinggi untuk
            membantu Anda mencapai tujuan pendidikan dan karir dengan cepat.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyChooseUs.map((item, index) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-white/80">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
