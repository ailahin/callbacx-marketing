"use client";

import * as React from "react";
import { SparklesIcon, ShieldIcon, TrendingUpIcon, CreditCardIcon, UsersIcon, DocumentIcon } from "@/components/ui/icons";
import { SectionTitle } from "@/components/ui/SectionTitle";

function RenderIcon({ Icon, className }: { Icon: React.ElementType; className?: string }) {
  return <Icon className={className} />;
}

/**
 * BenefitsSection - creator and brand benefits side by side.
 */
export function BenefitsSection() {
  const brandBenefits = [
    {
      icon: UsersIcon,
      title: "Vetted creator network",
      description: "Creators are reviewed for audience quality, authentic engagement, and brand safety.",
    },
    {
      icon: ShieldIcon,
      title: "Audience-aligned matches",
      description: "Campaigns reach the people who actually care about your category, not just big numbers.",
    },
    {
      icon: DocumentIcon,
      title: "End-to-end management",
      description: "Briefs, contracts, content approval, scheduling, and reporting in one place.",
    },
  ];
  const creatorBenefits = [
    {
      icon: SparklesIcon,
      title: "Work with brands you love",
      description: "Get matched with brands that fit your content and your audience.",
    },
    {
      icon: CreditCardIcon,
      title: "Fair compensation",
      description: "Simple contracts and transparent payments for every delivered campaign.",
    },
    {
      icon: TrendingUpIcon,
      title: "Creative freedom",
      description: "You keep creative control â€” brands approve the direction, not every word.",
    },
  ];

  return (
    <section className="relative overflow-hidden" aria-labelledby="benefits-heading">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
<SectionTitle
          title="Who CALLBACX MARKETING is for"
          description="Benefits built for both sides of the creator economy."
          textAlign="center"
        />

        <div className="mt-16 lg:mt-24 grid lg:grid-cols-2 gap-16">
          <BenefitPanel heading="For Brands" items={brandBenefits} accentClass="bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400" />
          <BenefitPanel heading="For Creators" items={creatorBenefits} accentClass="bg-accent-50 dark:bg-accent-950/50 text-accent-600 dark:text-accent-400" />
        </div>
      </div>
    </section>
  );
}

function BenefitPanel({
  heading,
  items,
  accentClass,
}: {
  heading: string;
  items: Array<{ icon: React.ElementType; title: string; description: string }>;
  accentClass: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-xl ${accentClass} flex items-center justify-center shadow-sm`}
        >
          {items[0] && <RenderIcon Icon={items[0].icon} className="h-6 w-6" />}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-text-primary">{heading}</h3>
          <p className="mt-2 text-text-secondary leading-relaxed">
            {heading === "For Brands"
              ? "Run influencer campaigns with a network of vetted creators, managed end to end."
              : "Partner with brands, keep creative control, and get paid on time."}
          </p>
        </div>
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-lg ${accentClass} flex items-center justify-center text-xs font-medium shadow-sm`}
            >
              <RenderIcon Icon={item.icon} className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text-primary">{item.title}</h4>
              <p className="mt-1 text-sm text-text-secondary leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


