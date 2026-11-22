"use client";

import { QuoteIcon } from "@/components/ui/icons";
import { Badge } from "@/components/ui/Badge";
import { SectionTitle } from "@/components/ui/SectionTitle";

/**
 * TestimonialsSection - testimonials using clearly marked placeholder content.
 */
export function TestimonialsSection() {
  const testimonials = [
    {
quote:
        "CALLBACX MARKETING made our first influencer campaign simple. From creator matching to content approval, everything happened in one place, and the results spoke for themselves.",
      name: "[Client Name]",
      role: "[Role] â€” [Brand]",
    },
    {
      quote:
        "As a creator, I finally have a platform that connects me with brands I actually believe in. The contracts are clear and payments are on time.",
      name: "[Creator Name]",
      role: "[Role] â€” [Niche]",
    },
    {
      quote:
        "The vetting process gave us confidence that the creators we worked with had real, engaged audiences. Transparent reporting made reporting back to leadership easy.",
      name: "[Client Name]",
      role: "[Role] â€” [Brand]",
    },
  ];

  return (
    <section className="bg-surface-subtle/50 dark:bg-surface-subtle/30" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <SectionTitle
          title="What our community says"
          description="Placeholder testimonials shown below are illustrative and will be replaced with real customer feedback before launch."
          textAlign="center"
        />
        <p className="text-center text-sm text-text-tertiary mt-4 max-w-2xl mx-auto">
          <Badge variant="outline" className="mr-2">Illustrative placeholder</Badge>
          Names, roles, and quotes are sample content â€” not real clients or testimonials.
        </p>

        <div className="mt-16 lg:mt-24 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: { quote: string; name: string; role: string } }) {
  return (
    <div className="rounded-2xl bg-surface border border-border-subtle p-8 shadow-sm dark:border-neutral-800 group">
      <div className="flex items-center gap-2 mb-6">
        <QuoteIcon className="h-6 w-6 text-brand-600 dark:text-brand-400" />
        <span className="text-sm font-medium text-text-tertiary">Placeholder quote</span>
      </div>
      <p className="text-lg text-text-secondary leading-relaxed mb-6">{testimonial.quote}</p>
      <div className="flex items-center gap-3 pt-6 border-t border-border-subtle dark:border-neutral-800">
        <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-text-tertiary font-medium text-xs">
          {testimonial.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{testimonial.name}</p>
          <p className="text-xs text-text-tertiary">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}


