import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHero } from "@/components/sections/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { SparklesIcon, CreditCardIcon, ShieldIcon, GlobeIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "For Creators | Join CALLBACX TECHNOLOGY",
  description: "Creators: partner with brands you love, keep creative control, and get paid fairly through CALLBACX TECHNOLOGY.",
  openGraph: {
    title: "For Creators | CALLBACX TECHNOLOGY",
    description: "Creators: partner with brands you love, keep creative control, and get paid fairly through CALLBACX TECHNOLOGY.",
    type: "website",
  },
};

export default function ForCreatorsPage() {
  const creatorBenefits = [
    {
      icon: <SparklesIcon />,
      title: "Work with brands you love",
      description: "Get matched with brands that fit your content, your voice, and your audience.",
    },
    {
      icon: <CreditCardIcon />,
      title: "Fair compensation",
      description: "Simple contracts and transparent payments for every campaign you deliver.",
    },
    {
      icon: <ShieldIcon />,
      title: "Creative freedom",
      description: "You keep creative control â€” brands approve the direction, not every word.",
    },
    {
      icon: <GlobeIcon />,
      title: "Trusted platform",
      description: "CALLBACX TECHNOLOGY handles the coordination so you can focus on making great content.",
    },
  ];

  const creatorSteps = [
    { number: "01", title: "Apply to join", description: "Tell us about your content, audience, and the brands you would love to work with." },
    { number: "02", title: "Get matched", description: "CALLBACX TECHNOLOGY connects you with brands whose campaigns fit your community." },
    { number: "03", title: "Create & approve", description: "Produce content and review the brief before anything goes live." },
    { number: "04", title: "Get paid", description: "Deliver the campaign and receive payment through CALLBACX TECHNOLOGY." },
  ];

  const creatorCategories = [
    {
      name: "Nano creators",
      range: "1K â€“ 10K followers",
      description: "Close-knit communities and high engagement. Ideal for authentic, niche product recommendations.",
    },
    {
      name: "Micro creators",
      range: "10K â€“ 100K followers",
      description: "Established voices with loyal audiences across lifestyle, beauty, tech, fitness, and more.",
    },
    {
      name: "Macro creators",
      range: "100K+ followers",
      description: "Broad-reach creators running campaigns at scale with professional production.",
    },
  ];

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
          title="For Creators"
          description="Partner with brands you genuinely believe in. Keep creative control, get matched with the right campaigns, and get paid on time."
          imageSrc="https://picsum.photos/seed/callbacxtechnology-creators/1000/700"
          imageAlt="Placeholder: creator content visual"
          cta={{ label: "Apply to Join", href: "/registration" }}
          imagePosition="left"
        />

        <section aria-labelledby="why-creators-heading" className="py-20 lg:py-28">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
            <SectionTitle title="Why join CALLBACX TECHNOLOGY" textAlign="center" />
            <div className="mt-16 lg:mt-24 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {creatorBenefits.map((benefit, index) => (
                <BenefitCard key={index} icon={benefit.icon} title={benefit.title} description={benefit.description} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface-subtle/50 dark:bg-surface-subtle/30" aria-labelledby="how-creators-heading">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <SectionTitle title="How it works for creators" textAlign="center" />
            <div className="mt-16 lg:mt-24 grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="relative">
                <div className="rounded-2xl border border-border-subtle bg-surface shadow-sm overflow-hidden">
                  <div className="w-full h-[340px] bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-text-tertiary text-sm">
                    <svg className="w-24 h-24 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 p-4">
                    <p className="text-xs text-text-tertiary">Placeholder visual â€” replace with brand imagery.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                {creatorSteps.map((step, index) => (
                  <StepCard key={index} number={step.number} title={step.title} description={step.description} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="categories-heading" className="py-20 lg:py-28">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
            <SectionTitle title="Creator categories" description="CALLBACX TECHNOLOGY works with creators of all sizes â€” follower counts shown are illustrative ranges, not guarantees." textAlign="center" />
            <div className="mt-16 lg:mt-24 grid gap-6 md:grid-cols-3">
              {creatorCategories.map((category, index) => (
                <CategoryCard key={index} category={category} />
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-brand-600 p-10 lg:p-16 text-neutral-0 shadow-lg shadow-brand overflow-hidden relative text-center">
              <div className="relative z-10">
                <h2 className="text-h2 font-bold mb-4">Ready to apply?</h2>
                <p className="text-brand-100 mb-8 max-w-xl mx-auto">
                  Tell us about your content and the brands you want to work with. We will review your application
                  and get back to you.
                </p>
                <Button asChild size="lg" variant="outline">
                  <Link href="/registration">Apply to Join</Link>
                </Button>
              </div>
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-brand-700/30 rounded-full blur-[80px]" aria-hidden="true" />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function BenefitCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl bg-surface border border-border-subtle p-6 shadow-sm dark:border-neutral-800">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
          {icon}
        </div>
        <div>
          <h4 className="text-base font-semibold text-text-primary">{title}</h4>
        </div>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-semibold shadow-sm shadow-brand">
        {number}
      </div>
      <div>
        <h4 className="text-base font-semibold text-text-primary">{title}</h4>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
    </div>
  );
}

function CategoryCard({ category }: { category: { name: string; range: string; description: string } }) {
  return (
    <Card className="p-8 h-full flex flex-col">
      <div className="flex items-start gap-2 mb-5">
        <span className="text-xs font-medium text-text-secondary bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
          {category.range}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-3">{category.name}</h3>
      <p className="text-sm text-text-secondary leading-relaxed flex-1">{category.description}</p>
      <Button variant="ghost" size="sm" className="mt-auto">
        Apply as {category.name}
      </Button>
    </Card>
  );
}


