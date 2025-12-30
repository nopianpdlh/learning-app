import {
  Navbar,
  HeroSection,
  FeaturesSection,
  StatsSection,
  ProgramsSection,
  HowItWorksSection,
  WhyChooseUsSection,
  TestimonialsSection,
  FAQSection,
  ContactSection,
  Footer,
} from "@/components/home";

// Revalidate every 1 hour (ISR)
export const revalidate = 3600;

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <ProgramsSection />
      <HowItWorksSection />
      <WhyChooseUsSection />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
