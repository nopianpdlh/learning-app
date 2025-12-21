"use client";

import { motion } from "framer-motion";
import { howItWorks } from "@/lib/home-data";

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Cara Bergabung
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            Mulai Belajar Dalam 3 Langkah
          </h2>
          <p className="text-muted-foreground">
            Proses pendaftaran yang mudah dan cepat
          </p>
        </motion.div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                {/* Connector line */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-0.5 bg-linear-to-r from-primary to-primary/30" />
                )}

                <div className="relative text-center">
                  {/* Step Number */}
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary text-white text-2xl font-bold flex items-center justify-center shadow-lg">
                    {step.step}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
