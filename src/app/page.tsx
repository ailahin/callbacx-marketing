import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Section, SectionGrid } from "@/components/sections/Section";
import { FeatureGrid, FeatureCard } from "@/components/sections/FeatureGrid";
import { ProcessSteps, ProcessStep } from "@/components/sections/ProcessSteps";
import { CTABand, MailCTA } from "@/components/sections/CTABand";
import { StatsSection } from "@/components/sections/FaqSection";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  SparklesIcon,
  UsersIcon,
  MailIcon,
  TargetIcon,
  ShieldIcon,
  TrendingUpIcon,
  GlobeIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "CALLBACX MARKETING | Influencer Marketing Agency",
  description: "CALLBACX MARKETING is a premium influencer marketing agency. We find brands, find influencers, negotiate deals, and manage customer campaigns by email — no dashboards, no logins, no self-serve marketplace.",
  keywords: ["influencer marketing agency", "creator partnerships", "brand campaigns", "campaign management", "influencer management", "data reporting", "sustainable marketing"],
  openGraph: {
    title: "CALLBACX MARKETING | Influencer Marketing Agency",
    description: "CALLBACX MARKETING is a premium influencer marketing agency. We find brands, find influencers, negotiate deals, and manage customer campaigns by email — no dashboards, no logins, no self-serve marketplace.",
    type: "website",
  },
};

const capabilities = [
  {
    icon: <TargetIcon />,
    title: "We find brands",
    description: "We research and outreach to brands that fit your niche and audience, so you spend less time prospecting and more time creating.",
    details: ["Brand research", "Outreach & pitching", "Partnership fit", "Relationship building"],
  },
  {
    icon: <UsersIcon />,
    title: "We find influencers",
    description: "We source and vet influencers for audience quality, authentic engagement, and brand fit — no self-serve discovery required.",
    details: ["Influencer sourcing", "Audience vetting", "Engagement audit", "Brand safety"],
  },
  {
    icon: <MailIcon />,
    title: "We negotiate deals",
    description: "Rates, deliverables, usage rights, and timelines are negotiated by us on your behalf — neither side negotiates alone.",
    details: ["Rate negotiation", "Deliverable terms", "Usage rights", "Timelines"],
  },
  {
    icon: <ShieldIcon />,
    title: "We manage campaigns",
    description: "From brief to content approval to reporting, we run customer campaigns by email. Paperless, secure, and accountable.",
    details: ["Creative briefs", "Content approval", "Scheduling", "Performance reporting"],
  },
];

const howItWorks = [
  {
    number: "01",
    title: "You contact us",
    description: "Brands and influencers reach out by email or contact form. No accounts, no dashboards, no sign-up.",
    icon: <MailIcon />,
  },
  {
    number: "02",
    title: "We learn your goals",
    description: "We discuss your campaign objectives, audience, budget, and timeline over secure email.",
    icon: <TargetIcon />,
  },
  {
    number: "03",
    title: "We source & negotiate",
    description: "We find the right partners, negotiate the deal, and put the agreement in writing.",
    icon: <UsersIcon />,
  },
  {
    number: "04",
    title: "We run & report",
    description: "Content is produced and approved by email. We analyze performance and deliver a clear report.",
    icon: <TrendingUpIcon />,
  },
];

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
        {/* Hero */}
        <section className="relative overflow-hidden" aria-labelledby="hero-heading">
          <div className="absolute inset-0 rounded-[3rem] bg-brand-600/40 blur-[100px] -z-10" aria-hidden="true" />
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-24 lg:py-40 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-lg bg-brand-50/50 px-3 py-1.5 text-xs font-medium text-brand-700 dark:bg-brand-950/20 dark:text-brand-300 border border-brand-100/40 dark:border-brand-900/30">
                  <SparklesIcon className="h-3.5 w-3.5" />
                  <span>Premium Influencer Marketing Agency</span>
                </div>
                <h1 id="hero-heading" className="text-display-lg font-bold text-text-primary tracking-tight leading-snug">
                  Influencer marketing,<br />
                  managed by people, not platforms.
                </h1>
                <p className="text-lg text-text-secondary leading-relaxed max-w-lg">
                  CALLBACX MARKETING is an agency, not a marketplace. Our team finds brands, finds influencers,
                  negotiates deals, and manages customer campaigns by email. Brands and influencers do not have
                  dashboards, do not log in, and do not discover each other here — they contact us, and we manage
                  everything. Paperless. Secure. Accountable.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" variant="primary" leftIcon={<ArrowRightIcon />}>
                    <Link href="/contact">Start a Campaign</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/services">Explore Services</Link>
                  </Button>
                </div>
                <div className="mt-8 flex items-center gap-3 text-sm text-text-tertiary">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-text-tertiary text-xs font-medium">
                    ✓
                  </span>
                  <span>No accounts • No logins • No marketplace</span>
                </div>
              </div>

              <div className="relative h-[520px] lg:h-[640px] flex items-center justify-center">
                <div className="relative w-full h-full rounded-3xl overflow-hidden border border-border-subtle shadow-xl ring-1 ring-border-subtle/50">
                  <div className="w-full h-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                    <svg className="w-48 h-48 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 p-4">
                    <p className="text-xs text-text-tertiary">Placeholder visual — replace with brand imagery.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What we do */}
        <Section padding="xl" bg="subtle" id="what-we-do">
          <SectionTitle
            id="what-we-do-heading"
            title="What we do for you"
            description="A full-service agency model — we run the campaign lifecycle by email, not by dashboard."
            textAlign="center"
          />
          <FeatureGrid items={capabilities} />
        </Section>

        {/* Sustainable + security */}
        <Section padding="lg" id="trust">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="space-y-6">
              <h2 className="text-h2 font-bold text-text-primary">Paperless by design</h2>
              <p className="text-text-secondary leading-relaxed">
                Every campaign runs over email. No portals to log into, no data stored in self-serve accounts,
                and no unnecessary data collection. A digital-first, paperless workflow means less waste and a
                smaller footprint for every campaign we manage.
              </p>
              <ul className="space-y-4 mt-6">
                <li className="flex items-start gap-3 text-text-secondary leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sage-100 dark:bg-sage-900/50 flex items-center justify-center text-sage-600 dark:text-sage-400 text-xs font-medium">
                    🌿
                  </span>
                  <span>Paperless campaigns — briefs, contracts, and approvals by email</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sage-100 dark:bg-sage-900/50 flex items-center justify-center text-sage-600 dark:text-sage-400 text-xs font-medium">
                    🌿
                  </span>
                  <span>No member dashboards means no stored personal data to maintain or breach</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sage-100 dark:bg-sage-900/50 flex items-center justify-center text-sage-600 dark:text-sage-400 text-xs font-medium">
                    🌿
                  </span>
                  <span>Digital-first coordination reduces travel and physical collateral</span>
                </li>
              </ul>
              <Button asChild size="md" variant="outline">
                <Link href="/about">Learn about our approach</Link>
              </Button>
            </div>
            <div className="relative">
              <div className="rounded-2xl border border-border-subtle bg-surface shadow-2xl overflow-hidden">
                <div className="w-full h-[340px] bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-text-tertiary text-sm">
                  <svg className="w-32 h-32 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="absolute bottom-6 left-6 right-6 p-4">
                  <p className="text-xs text-text-tertiary">Placeholder visual — replace with brand imagery.</p>
                </div>
              </div>
              <div className="absolute -right-6 -top-6 flex gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border border-border-default bg-neutral-0 dark:bg-neutral-900 flex items-center justify-center shadow-lg ring-1 ring-white/20 text-[10px] font-medium text-text-secondary">
                    S{i}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Who we work with */}
        <Section padding="lg" id="who-we-work-with">
          <SectionTitle
            id="who-we-work-with-heading"
            title="Who we work with"
            description="Two sides of every campaign, one agency managing both."
            textAlign="center"
          />
          <div className="mt-16 lg:mt-24 grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <h3 className="text-h3 font-semibold text-text-primary">For brands</h3>
              <p className="text-text-secondary leading-relaxed mb-6">
                Tell us your goals, audience, and budget. We identify the right influencers, negotiate the deals,
                brief the creators, and manage the campaign from first email to final report.
              </p>
              <Button asChild size="md" variant="outline">
                <Link href="/for-brands">See how we work with brands <span className="ml-2 text-sm">→</span></Link>
              </Button>
            </div>
            <div className="space-y-6">
              <h3 className="text-h3 font-semibold text-text-primary">For influencers</h3>
              <p className="text-text-secondary leading-relaxed mb-6">
                Tell us about your content and audience. We match you with brands that fit, negotiate fair rates,
                and handle the campaign logistics — you focus on great content.
              </p>
              <Button asChild size="md" variant="outline">
                <Link href="/for-influencers">See how we work with influencers <span className="ml-2 text-sm">→</span></Link>
              </Button>
            </div>
          </div>
        </Section>

        {/* Process */}
        <Section padding="xl" bg="subtle" id="process">
          <SectionTitle
            id="process-heading"
            title="How campaigns work"
            description="A simple, transparent, email-based process — from brief to report."
            textAlign="center"
          />
          <ProcessSteps steps={howItWorks} />
        </Section>

        {/* Data + reporting */}
        <Section padding="lg" id="data">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="space-y-6">
              <h2 className="text-h2 font-bold text-text-primary">Data-driven reporting</h2>
              <p className="text-text-secondary leading-relaxed">
                We don't leave you to interpret raw metrics. As your agency, we act as your data analyst —
                tracking reach, engagement, clicks, and conversions, then delivering a clear performance report
                with insights and recommendations for your next campaign.
              </p>
              <ul className="space-y-4 mt-6">
                <li className="flex items-start gap-3 text-text-secondary leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-950/10 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-medium">
                    📊
                  </span>
                  <span>Campaign performance tracking &amp; analysis</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-950/10 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-medium">
                    📊
                  </span>
                  <span>Reach, engagement, click &amp; conversion reporting</span>
                </li>
                <li className="flex items-start gap-3 text-text-secondary leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-950/10 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-medium">
                    📊
                  </span>
                  <span>Insights &amp; recommendations delivered by email</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="rounded-2xl border border-border-subtle bg-surface shadow-2xl overflow-hidden">
                <div className="w-full h-[340px] bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-text-tertiary text-sm">
                  <svg className="w-32 h-32 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="absolute bottom-6 left-6 right-6 p-4">
                  <p className="text-xs text-text-tertiary">Placeholder visual — replace with brand imagery.</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* CTA */}
        <CTABand
          title="Ready to start your campaign?"
          description="Brands and influencers don't need accounts — just send us an email or use the contact form, and we will take it from there."
          primary={{
            label: "Contact Us",
            href: "/contact",
            icon: <MailIcon />,
          }}
          secondary={{
            label: "Explore Services",
            href: "/services",
          }}
          inverted
        />

        {/* Footer */}
        <SiteFooter />
      </main>
    </div>
  );
}
