import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HeroSection } from "@/components/sections/Hero";
import { PhilosophySection } from "@/components/sections/Philosophy";
import { ConnectionSection } from "@/components/sections/Connection";
import { ServicesSection } from "@/components/sections/Services";
import { ProcessSection } from "@/components/sections/Process";
import { TestimonialsSection } from "@/components/sections/Testimonials";
import { CTASection } from "@/components/sections/CTA";

export const metadata: Metadata = {
  title: "CALLBACX MARKETING | Connecting Brands & Creators",
  description: "CALLBACX MARKETING connects brands with vetted creators for influencer marketing campaigns that drive awareness, engagement, and results.",
  openGraph: {
    title: "CALLBACX MARKETING | Connecting Brands & Creators",
    description: "CALLBACX MARKETING connects brands with vetted creators for influencer marketing campaigns that drive awareness, engagement, and results.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <HeroSection />
        <PhilosophySection />
        <ConnectionSection />
        <ServicesSection />
        <ProcessSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <SiteFooter />
    </div>
  );
}


