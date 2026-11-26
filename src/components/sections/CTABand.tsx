"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon, MailIcon } from "@/components/ui/icons";

/**
 * CTABand - premium call-to-action section band
 */
export interface CTABandProps {
  title: string;
  description?: string;
  primary?: { label: string; href: string; icon?: React.ReactNode };
  secondary?: { label: string; href: string };
  className?: string;
  inverted?: boolean;
}

export function CTABand({
  title,
  description,
  primary,
  secondary,
  className,
  inverted = false,
}: CTABandProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden py-24 lg:py-32",
        inverted ? "bg-brand-600 text-neutral-0" : "bg-surface border-t border-border-subtle dark:border-neutral-800",
        className
      )}
    >
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 relative z-10">
        {inverted && (
          <div className="absolute -inset-6 bg-brand-700/30 rounded-full blur-[100px]" aria-hidden="true" />
        )}
        <div className="text-center max-w-2xl mx-auto space-y-5">
          <h2 className={cn("text-h2 font-bold tracking-tight leading-snug", inverted ? "text-neutral-0" : "text-text-primary")}>
            {title}
          </h2>
          {description && (
            <p className={cn("text-lg text-text-secondary leading-relaxed max-w-xl mx-auto", inverted ? "text-brand-100" : "text-text-secondary")}>
              {description}
            </p>
          )}
        </div>

        <div className="mt-16 flex flex-col sm:flex-row gap-4 justify-center">
          {primary && (
            <Button asChild size="lg" variant={inverted ? "outline" : "primary"} leftIcon={primary.icon}>
              <Link href={primary.href} className={inverted ? "text-neutral-0 focus-visible:ring-brand-400 focus-visible:ring-offset-neutral-900" : ""}>
                {primary.label}
              </Link>
            </Button>
          )}
          {secondary && (
            <Button asChild size="lg" variant="outline" leftIcon={<ArrowRightIcon className="h-4 w-4" />}>
              <Link href={secondary.href}>{secondary.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

CTABand.displayName = "CTABand";

/**
 * MailCTA - lightweight email-first contact band
 */
export interface MailCTAProps {
  title: string;
  description?: string;
  email?: string;
  className?: string;
}

export function MailCTA({ title, description, email, className }: MailCTAProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden py-24 lg:py-32",
        className
      )}
    >
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="rounded-3xl bg-surface border border-border-subtle p-10 lg:p-16 text-center shadow-sm dark:border-neutral-800">
          <h2 className="text-h2 font-bold mb-4 text-text-primary">{title}</h2>
          {description && (
            <p className="text-lg text-text-secondary leading-relaxed max-w-xl mx-auto mb-8">
              {description}
            </p>
          )}
          {email && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <MailIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <a
                href={`mailto:${email}`}
                className="text-lg font-medium text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded p-1"
              >
                {email}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

MailCTA.displayName = "MailCTA";
