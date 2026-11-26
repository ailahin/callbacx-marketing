import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/sections/Section";
import { FeatureGrid, FeatureCard } from "@/components/sections/FeatureGrid";
import { ProcessSteps } from "@/components/sections/ProcessSteps";
import { FaqSection, FaqItem, StatsSection } from "@/components/sections/FaqSection";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { TargetIcon, UsersIcon, MailIcon, DocumentIcon, PlayIcon, EyeIcon, ShieldIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Services | Influencer Marketing Agency",
  description: "CALLBACX MARKETING agency services: campaign strategy, influencer discovery and vetting, deal negotiation, contracting, campaign management by email, and performance reporting.",
  openGraph: {
    title: "Services | CALLBACX MARKETING",
    description: "CALLBACX MARKETING agency services: campaign strategy, influencer discovery and vetting, deal negotiation, contracting, campaign management by email, and performance reporting.",
    type: "website",
  },
};

const services = [
  {
    icon: <TargetIcon />,
    title: "Campaign Strategy & Planning",
    description: "We help you define goals, target audience, budget, timeline, and selection criteria before anything is signed.",
    details: ["Goal and KPI definition", "Audience and platform strategy", "Budget allocation", "Creator selection criteria"],
  },
  {
    icon: <UsersIcon />,
    title: "Influencer Discovery & Vetting",
    description: "We source influencers across niches and audience sizes, then vet them for audience quality, authentic engagement, and brand fit.",
    details: ["Influencer sourcing", "Audience quality review", "Engagement authenticity check", "Brand fit screening"],
  },
  {
    icon: <MailIcon />,
    title: "Deal Negotiation",
    description: "We negotiate rates, deliverables, usage rights, and timelines directly with both sides — so neither party negotiates alone.",
    details: ["Rates and fees", "Deliverables and deadlines", "Usage rights and licensing", "Exclusivity terms"],
  },
  {
    icon: <DocumentIcon />,
    title: "Contracting & Rights Management",
    description: "Agreements, usage rights, deliverables, and compensation terms are handled transparently for both brands and influencers.",
    details: ["Campaign agreements", "Usage rights and licensing", "Deliverable schedules", "Compensation terms"],
  },
  {
    icon: <PlayIcon />,
    title: "Campaign Management by Email",
    description: "Creative briefs, content review rounds, approvals, and publishing coordination — all handled by email. No dashboards or logins for either side.",
    details: ["Creative briefs", "Review and revision rounds", "Content calendar", "Publishing coordination"],
  },
  {
    icon: <EyeIcon />,
    title: "Performance Tracking & Reporting",
    description: "We act as your data analyst — tracking reach, engagement, clicks, and conversions — then deliver a clear report with insights.",
    details: ["Reach and impressions", "Engagement metrics", "Click and conversion tracking", "Final campaign report"],
  },
];

const howItWorks = [
  {
    number: "01",
    title: "You contact us",
    description: "Brands and influencers reach out by email or contact form. No accounts, no dashboards, no sign-up.",
  },
  {
    number: "02",
    title: "We learn your goals",
    description: "We discuss your campaign objectives, audience, budget, and timeline over secure email.",
  },
  {
    number: "03",
    title: "We source and negotiate",
    description: "We find the right partners, negotiate the deal, and put the agreement in writing.",
  },
  {
    number: "04",
    title: "We manage the campaign",
    description: "Briefs, content approval, and publishing are coordinated by email from start to finish.",
  },
  {
    number: "05",
    title: "We report results",
    description: "You receive a clear performance report with insights for your next campaign.",
  },
];

const faqs = [
  {
    question: "Is CALLBACX MARKETING a marketplace?",
    answer: "No. We are an agency. We find brands, find influencers, negotiate deals, and manage campaigns by email. Brands and influencers do not log in, do not have dashboards, and do not discover each other on this website.",
  },
  {
    question: "Do brands or influencers need accounts?",
    answer: "No. There are no accounts, no registrations, and no logins. You simply contact us and we manage everything.",
  },
  {
    question: "How is campaign data handled?",
    answer: "We collect only what is needed to run your campaign (names, emails, briefs, performance metrics). Data is handled securely, never sold, and deleted when no longer needed.",
  },
  {
    question: "Do you provide reporting?",
    answer: "Yes. We act as your data analyst — tracking reach, engagement, clicks, and conversions — and deliver a clear performance report with insights and recommendations.",
  },
  {
    question: "Is the process sustainable?",
    answer: "Yes. Everything runs by email — no portals, no paper, no unnecessary data storage. A paperless, digital-first workflow with a smaller footprint.",
  },
];

export default function ServicesPage() {
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
        <PageHero
          title="Our services"
          description="End-to-end influencer marketing support, managed by our team from the first brief to the final report."
          imagePosition="none"
          cta={{ label: "Start a Campaign", href: "/contact" }}
        />

        <Section padding="xl" id="services">
          <SectionTitle title="What we offer" textAlign="center" />
          <FeatureGrid items={services} />
        </Section>

        <Section padding="xl" bg="subtle" id="process">
          <SectionTitle
            id="process-heading"
            title="How we work"
            description="A simple, transparent, email-based process — no platforms, no portals, no logins."
            textAlign="center"
          />
          <ProcessSteps steps={howItWorks} />
        </Section>

        <StatsSection
          title="Agency-backed reporting"
          description="We don't hand you a dashboard — we analyze the data and deliver insights."
          stats={[
            { value: "6", label: "Core services", icon: <ShieldIcon /> },
            { value: "5", label: "Process steps", icon: <MailIcon /> },
            { value: "0", label: "Member dashboards", icon: <UsersIcon /> },
            { value: "100", label: "% email-managed", icon: <PlayIcon /> },
          ]}
        />

        <FaqSection
          title="Frequently asked questions"
          description="Everything you need to know about working with CALLBACX MARKETING."
          items={faqs}
        />

        <Section padding="lg" id="cta">
          <div className="rounded-3xl bg-surface border border-border-subtle p-10 lg:p-16 text-center shadow-sm dark:border-neutral-800">
            <h2 className="text-h2 font-bold mb-4 text-text-primary">Which service fits your campaign?</h2>
            <p className="text-text-secondary mb-8 max-w-xl mx-auto leading-relaxed">
              Tell us about your goals and we will recommend the right services and partners.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="primary">
                <Link href="/contact">Start a Campaign</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/about">Learn About Us</Link>
              </Button>
            </div>
          </div>
        </Section>

        <SiteFooter />
      </main>
    </div>
  );
}
