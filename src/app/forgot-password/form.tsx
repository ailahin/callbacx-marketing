"use client";

import * as React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MailIcon } from "@/components/ui/icons";
import { useAuth, isDemoMode } from "@/context/AuthProvider";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address");
      return;
    }

    setStatus("submitting");
    const { error: resetError } = await resetPassword(email.trim());

    // Always show the same success state to avoid leaking which emails exist.
    // In demo mode reset is disabled, so surface that clearly instead.
    if (resetError && isDemoMode) {
      setStatus("idle");
      setError("Password reset is disabled in demo mode. Use a demo account to sign in.");
      return;
    }

    setStatus("success");
  };

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-success-200 bg-success-50 p-5 text-center animate-scale-in dark:border-success-800 dark:bg-success-950/40"
      >
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-success-100 dark:bg-success-900">
          <svg className="h-5 w-5 text-success-600 dark:text-success-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-success-900 dark:text-success-100">Check your inbox</h3>
        <p className="mt-1 text-sm text-success-700 dark:text-success-300">
          If an account exists for <span className="font-medium">{email.trim()}</span>, we have sent a link to reset your password.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-error-200 bg-error-50 p-3 text-sm text-error-700 animate-scale-in dark:border-error-800 dark:bg-error-950/40 dark:text-error-300"
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="forgot-email" className="text-sm font-medium text-text-primary">
          Email address
        </label>
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          leftIcon={<MailIcon className="h-4 w-4" />}
          error={error && error !== "Email is required" && error !== "Enter a valid email address" ? undefined : error}
          disabled={status === "submitting"}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Sending link…" : "Send reset link"}
      </Button>
    </form>
  );
}