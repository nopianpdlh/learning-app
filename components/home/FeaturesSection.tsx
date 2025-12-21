"use client";

import { motion } from "framer-motion";
import { features } from "@/lib/home-data";
import {
  Video,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  Award,
  UserCheck,
} from "lucide-react";

const iconMap = {
  video: Video,
  book: BookOpen,
  clipboard: ClipboardCheck,
  chart: TrendingUp,
  award: Award,
  user: UserCheck,
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Apa yang Anda Dapatkan
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            Fitur Lengkap untuk Sukses Belajar
          </h2>
          <p className="text-muted-foreground">
            Kami menyediakan semua yang Anda butuhkan untuk mencapai target
            belajar dengan efektif dan menyenangkan.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap];
            return (
              <motion.div
                key={index}
                variants={item}
                className="group p-6 rounded-2xl border bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <Icon className="h-7 w-7 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
