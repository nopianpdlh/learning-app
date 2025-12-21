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
