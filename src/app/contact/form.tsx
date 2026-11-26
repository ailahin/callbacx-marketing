"use client";

import * as React from "react";
import { Input, Textarea, Select, FormField } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MailIcon, UserIcon } from "@/components/ui/icons";
import { InlineSuccess } from "@/components/states/Success";

export function ContactForm() {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    organization: "",
    inquiryType: "",
    message: "",
    honeypot: "", // honeypot field - left empty by humans, filled by bots
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");

  const inquiryTypes = [
    { value: "brand", label: "I am a brand" },
    { value: "influencer", label: "I am an influencer" },
    { value: "partnership", label: "Press / partnership" },
    { value: "other", label: "Other" },
  ];

  // CSRF token placeholder - in production, this would be fetched from the server
  // and validated on submission to prevent cross-site request forgery.
  const csrfToken = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    const stored = sessionStorage.getItem("callbacx_csrf");
    if (stored) return stored;
    const token = Array.from(
      crypto.getRandomValues(new Uint8Array(16)),
      (b) => b.toString(16).padStart(2, "0")
    ).join("");
    sessionStorage.setItem("callbacx_csrf", token);
    return token;
  }, []);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = "Name is required";
    if (!formData.email.trim()) nextErrors.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      nextErrors.email = "Enter a valid email address";
    if (!formData.inquiryType) nextErrors.inquiryType = "Please select an inquiry type";
    if (!formData.message.trim()) nextErrors.message = "Message is required";
    else if (formData.message.trim().length < 10)
      nextErrors.message = "Please tell us a bit more about your inquiry";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Honeypot check: if filled, it's likely a bot — silently discard
    if (formData.honeypot.trim()) {
      setStatus("success");
      return;
    }
    if (!validate()) return;
    setStatus("submitting");
    // Simulate secure submission (no data stored client-side)
    setTimeout(() => {
      setStatus("success");
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6" autoComplete="off">
      {/* Honeypot field - hidden from users, traps bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={formData.honeypot}
        onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
        style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}
        aria-hidden="true"
      />

      <FormField label="Full name" required error={errors.name}>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Jane Doe"
          leftIcon={<UserIcon className="h-4 w-4" />}
          error={errors.name}
          autoComplete="name"
        />
      </FormField>
      <FormField label="Email address" required type="email" error={errors.email}>
        <Input
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="jane@example.com"
          leftIcon={<MailIcon className="h-4 w-4" />}
          error={errors.email}
          autoComplete="email"
        />
      </FormField>
      <FormField label="Organization or handle">
        <Input
          value={formData.organization}
          onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
          placeholder="Acme Co. or @handle"
          autoComplete="organization"
        />
      </FormField>
      <FormField label="I am a" required error={errors.inquiryType}>
        <Select
          value={formData.inquiryType}
          onChange={(value: string) => setFormData({ ...formData, inquiryType: value })}
          placeholder="Select an option"
          options={inquiryTypes}
          error={errors.inquiryType}
        />
      </FormField>
      <FormField label="Message" required asChild error={errors.message}>
        <Textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Tell us about your campaign or question..."
          minRows={5}
        />
      </FormField>
      <Button type="submit" variant="primary" size="lg" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? "Sending…" : "Send message"}
      </Button>
      {status === "success" && (
        <InlineSuccess
          title="Message sent"
          message="Thanks for reaching out. We will get back to you soon by email."
          action={{ label: "Contact again", onClick: () => setStatus("idle"), variant: "outline" }}
        />
      )}
      {status === "error" && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
          Something went wrong. Please try again or email us directly.
        </div>
      )}
      <p className="text-xs text-text-tertiary mt-3">
        We collect only the details you provide here to respond to your inquiry. No account is created and no
        data is sold. Read our{" "}
        <Link href="/privacy-policy" className="text-brand-600 dark:text-brand-400 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
