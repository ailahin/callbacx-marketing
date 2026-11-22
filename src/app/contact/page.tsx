import type { Metadata } from "next";
import * as React from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHero } from "@/components/sections/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ContactForm } from "./form";
import { MailIcon, MapPinIcon, GlobeIcon } from "@/components/ui/icons";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact CALLBACX TECHNOLOGY",
  description: "Get in touch with CALLBACX TECHNOLOGY â€” for brands, creators, and general inquiries.",
  openGraph: {
    title: "Contact CALLBACX TECHNOLOGY",
    description: "Get in touch with CALLBACX TECHNOLOGY â€” for brands, creators, and general inquiries.",
    type: "website",
  },
};

export default function ContactPage() {
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
          title="Contact us"
          description="Have questions? Whether you are a brand, a creator, or just curious, we would love to hear from you."
          imageSrc="https://picsum.photos/seed/callbacxtechnology-contact/1000/700"
          imageAlt="Placeholder: contact visual"
          imagePosition="right"
        />

        <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Contact form */}
            <div className="space-y-8">
              <SectionTitle title="Send us a message" textAlign="left" />
              <ContactForm />
            </div>

            {/* Contact info */}
            <div className="space-y-8 hidden lg:block">
              <SectionTitle title="Get in touch" textAlign="left" />
              <div className="space-y-6">
                <ContactDetail label="General inquiries" value="hello@callbacxtechnology.com" href="mailto:hello@callbacxtechnology.com" icon={<MailIcon />} />
                <ContactDetail label="Press & partnerships" value="press@callbacxtechnology.com" href="mailto:press@callbacxtechnology.com" icon={<GlobeIcon />} />
                <ContactDetail label="Office" value="[Office Address â€” placeholder]" icon={<MapPinIcon />} />
                <p className="text-sm text-text-tertiary max-w-xs">
                  Office address is an illustrative placeholder detail. Email is the best way to reach us.
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle p-6 bg-neutral-50 dark:bg-neutral-800/50 dark:border-neutral-800">
                <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">Follow CALLBACX TECHNOLOGY</h3>
                <div className="flex gap-3">
                  {[
                    { label: "Twitter", href: "#", icon: <TwitterSmallIcon /> },
                    { label: "LinkedIn", href: "#", icon: <LinkedinSmallIcon /> },
                    { label: "Instagram", href: "#", icon: <InstagramSmallIcon /> },
                  ].map((social, index) => (
                    <Link
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      aria-label={social.label}
                    >
                      {social.icon}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function ContactDetail({ label, value, href, icon }: { label: string; value: string; href?: string; icon: React.ReactNode }) {
  const linkContent = href ? (
    <Link
      href={href}
      className="text-base font-medium text-text-primary hover:text-brand-600 dark:hover:text-brand-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded p-1 break-all"
    >
      {value}
    </Link>
  ) : (
    <p className="text-base font-medium text-text-primary break-all">{value}</p>
  );
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-text-tertiary">{label}</p>
        {linkContent}
      </div>
    </div>
  );
}

function TwitterSmallIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
    </svg>
  );
}
function LinkedinSmallIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
function InstagramSmallIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.163C3.527 2.163 2.163 3.527 2.163 12c0 8.473 1.364 9.837 9.837 9.837 8.473 0 9.837-1.364 9.837-9.837 0-8.473-1.364-9.837-9.837-9.837-9.837zm0 1.872c4.392 0 7.964 3.572 7.964 7.964s-3.572 7.964-7.964 7.964-7.964-3.572-7.964-7.964 3.572-7.964 7.964-7.964zm0 12.83c2.687 0 4.873-2.186 4.873-4.873s-2.186-4.873-4.873-4.873-4.873 2.186-4.873 4.873 2.186 4.873 4.873 4.873zM12 7.03c-1.342 0-2.432 1.09-2.432 2.432s1.09 2.432 2.432 2.432 2.432-1.09 2.432-2.432-1.09-2.432-2.432-2.432zm0 10.678c-1.342 0-2.432-1.09-2.432-2.432s1.09 2.432 2.432-2.432 2.432 1.09 2.432 2.432-1.09 2.432-2.432 2.432z" />
    </svg>
  );
}


