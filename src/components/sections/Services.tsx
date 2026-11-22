"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TargetIcon, UsersIcon, DocumentIcon, PlayIcon, TrendingUpIcon } from "@/components/ui/icons";
import { SectionTitle } from "@/components/ui/SectionTitle";

/**
 * ServicesSection - homepage overview of influencer marketing services.
 */
export function ServicesSection() {
  const services = [
    {
      icon: <TargetIcon />,
      title: "Campaign Strategy & Planning",
      description: "Goal setting, audience definition, budget planning, and creator selection criteria tailored to your brand.",
    },
    {
      icon: <UsersIcon />,
      title: "Creator Discovery & Vetting",
      description: "We source and review creators for audience quality, authentic engagement, and brand safety before any match is made.",
    },
    {
      icon: <DocumentIcon />,
      title: "Contract & Rights Management",
      description: "Agreements, usage rights, deliverables, and timelines handled transparently for both brands and creators.",
    },
    {
      icon: <PlayIcon />,
      title: "Content Production & Approval",
      description: "Creative briefs, review rounds, and content approval workflows so everything goes live on brand and on time.",
    },
    {
      icon: <TrendingUpIcon />,
      title: "Performance Tracking & Reporting",
      description: "Campaign reports covering reach, engagement, clicks, and conversions — clear insight into what worked.",
    },
  ];

  return (
    <section className="bg-surface-subtle/50 dark:bg-surface-subtle/30" aria-labelledby="services-heading">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <SectionTitle
          title="Influencer marketing services"
          description="End-to-end support for brands and creators, from the first brief to the final report."
          textAlign="center"
        />

        <div className="mt-16 lg:mt-24 grid gap-8 md:grid-cols-3">
          {services.map((service, index) => (
            <ServiceCard key={index} icon={service.icon} title={service.title} description={service.description} />
          ))}
        </div>

        <div className="mt-16 lg:mt-24 text-center">
          <p className="text-lg text-text-secondary mb-6">Want to see the full service offering?</p>
          <Button asChild size="lg" variant="outline">
            <Link href="/services">View all services <span className="ml-2 text-sm">→</span></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl bg-surface border border-border-subtle p-8 shadow-sm transition-all hover:shadow-md dark:border-neutral-800 group">
      <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-5 group-hover:shadow-brand transition-shadow">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-3">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}
