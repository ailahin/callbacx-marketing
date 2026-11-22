"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { ArrowRightIcon } from "@/components/ui/icons";

/**
 * PageHero - reusable page-level hero for subpages.
 */
export interface PageHeroProps {
  title: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  cta?: { label: string; href: string };
  imagePosition?: "right" | "left" | "none";
}

export function PageHero({
  title,
  description,
  imageSrc,
  imageAlt,
  cta,
  imagePosition = "right",
}: PageHeroProps) {
  const isReverse = imagePosition === "left";

  return (
    <section className="relative overflow-hidden" aria-labelledby="page-hero-heading">
      <div className="absolute inset-0 rounded-[3rem] bg-brand-600/60 blur-[90px] -z-10" aria-hidden="true" />
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
          {!isReverse && <PageHeroContent title={title} description={description} cta={cta} />}
          {imageSrc && imagePosition !== "none" && (
            <div className="relative h-[420px] w-full flex items-center justify-center">
              <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border-subtle shadow-lg">
                <Image
                  src={imageSrc}
                  alt={imageAlt || "Placeholder image"}
                  fill
                  sizes="(max-width: 768px) 100vw, 480px"
                  className="object-cover"
                />
                <div className="absolute bottom-6 left-6 right-6 p-4">
                  <p className="text-xs text-text-tertiary">Placeholder visual — replace with brand imagery.</p>
                </div>
              </div>
            </div>
          )}
          {isReverse && <PageHeroContent title={title} description={description} cta={cta} />}
        </div>
      </div>
    </section>
  );
}

function PageHeroContent({ title, description, cta }: { title: string; description?: string; cta?: { label: string; href: string } }) {
  return (
    <div className="space-y-5">
      <h1 id="page-hero-heading" className="text-display-lg font-bold text-text-primary tracking-tight leading-snug">
        {title}
      </h1>
      {description && (
        <p className="text-lg text-text-secondary leading-relaxed max-w-lg">
          {description}
        </p>
      )}
      {cta && (
        <div className="mt-8 flex gap-4">
          <Button asChild size="lg" variant="primary" leftIcon={<ArrowRightIcon />}>
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
