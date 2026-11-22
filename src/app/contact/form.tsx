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
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");

  const inquiryTypes = [
    { value: "brand", label: "I am a brand" },
    { value: "creator", label: "I am a creator" },
    { value: "partnership", label: "Partnership / press" },
    { value: "other", label: "Other" },
  ];

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = "Name is required";
    if (!formData.email.trim()) nextErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) nextErrors.email = "Enter a valid email address";
    if (!formData.inquiryType) nextErrors.inquiryType = "Please select an inquiry type";
    if (!formData.message.trim()) nextErrors.message = "Message is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    // Simulate form submission
    setTimeout(() => {
      setStatus("success");
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <FormField label="Full name" required error={errors.name}>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Jane Doe"
          leftIcon={<UserIcon className="h-4 w-4" />}
          error={errors.name}
        />
      </FormField>
      <FormField label="Email address" required type="email" error={errors.email}>
        <Input
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="jane@example.com"
          leftIcon={<MailIcon className="h-4 w-4" />}
          error={errors.email}
        />
      </FormField>
      <FormField label="Organization or handle">
        <Input
          value={formData.organization}
          onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
          placeholder="Acme Co. or @creator"
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
          message="Thanks for reaching out. We will get back to you soon."
          action={{ label: "Contact again", onClick: () => setStatus("idle"), variant: "outline" }}
        />
      )}
      {status === "error" && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
          Something went wrong. Please try again or email us directly.
        </div>
      )}
    </form>
  );
}
