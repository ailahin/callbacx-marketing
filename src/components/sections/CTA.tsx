"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MailIcon, ArrowRightIcon } from "@/components/ui/icons";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { InlineSuccess } from "@/components/states/Success";

/**
 * CTASection - conversion-focused final call to action on the homepage.
 */
export function CTASection() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setStatus("error");
      return;
    }
    setStatus("success");
  };

  return (
    <section className="relative overflow-hidden" aria-labelledby="cta-heading">
      <div className="absolute inset-0 rounded-[3rem] bg-brand-600/80 blur-[80px] -z-10" aria-hidden="true" />
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <SectionTitle
            title="Ready to launch your next campaign?"
            description="Join brands and creators using CALLBACX TECHNOLOGY to build meaningful partnerships."
            textAlign="center"
          />
          {status === "success" && (
            <InlineSuccess
              message="Thanks! We've received your request and will be in touch soon."
            />
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 max-w-2xl mx-auto grid md:grid-cols-4 gap-3"
          noValidate
        >
          <div className="relative flex-1">
            <label htmlFor="cta-email" className="sr-only">
              Email address
            </label>
            <Input
              id="cta-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              rightIcon={
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={status === "success"}
                  aria-label="Get started"
                >
                  Get started <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Button>
              }
            />
            <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
            {status === "error" && (
              <p className="mt-1.5 text-sm text-error-600 dark:text-error-400">Please enter a valid email address</p>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-text-tertiary">
          By subscribing you agree to our <LinkHref href="/privacy-policy">Privacy Policy</LinkHref> and{" "}
          <LinkHref href="/terms-and-conditions">Terms and Conditions</LinkHref>.
        </p>
      </div>
    </section>
  );
}

function LinkHref({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <a
      href={href}
      className="text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded p-1"
    >
      {children}
    </a>
  );
}


