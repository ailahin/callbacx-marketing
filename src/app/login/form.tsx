"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Input";
import { MailIcon, LockIcon, EyeIcon } from "@/components/ui/icons";
import { useAuth, isDemoMode } from "@/context/AuthProvider";
import { sanitizeRedirectPath } from "@/lib/auth-redirect";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm({ redirect }: { redirect: string }) {
  const router = useRouter();
  const { signIn } = useAuth();
  const [formData, setFormData] = React.useState({ email: "", password: "", remember: true });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [status, setStatus] = React.useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.email.trim()) nextErrors.email = "Email is required";
    else if (!EMAIL_RE.test(formData.email.trim())) nextErrors.email = "Enter a valid email address";
    if (!formData.password) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!validate()) return;

    setStatus("submitting");
    const { error } = await signIn(formData.email.trim(), formData.password);

    if (error) {
      setStatus("error");
      setErrorMessage(cleanAuthError(error.message));
      return;
    }

    // Navigate to the requested internal path, or the role-aware dashboard entry
    // which forwards to the correct area based on the signed-in user's role.
    const target = sanitizeRedirectPath(redirect, "/dashboard");
    router.push(target);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {status === "error" && errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-700 animate-scale-in dark:border-error-800 dark:bg-error-950/40 dark:text-error-300"
        >
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3l9 16H3l9-16z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="login-email" className="text-sm font-medium text-text-primary">
          Email address
        </label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="jane@example.com"
          leftIcon={<MailIcon className="h-4 w-4" />}
          error={errors.email}
          disabled={status === "submitting"}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="text-sm font-medium text-text-primary">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="rounded p-1 text-xs font-medium text-brand-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-400"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="login-password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Enter your password"
          leftIcon={<LockIcon className="h-4 w-4" />}
          disabled={status === "submitting"}
          error={errors.password}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="pointer-events-auto flex items-center text-neutral-400 transition-colors hover:text-text-primary"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon className="h-4 w-4" />
            </button>
          }
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Checkbox
          id="remember"
          label="Remember me"
          checked={formData.remember}
          onCheckedChange={(checked) => setFormData({ ...formData, remember: checked })}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={status === "submitting"}
        leftIcon={
          status === "submitting" ? (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : undefined
        }
      >
        {status === "submitting" ? "Signing in…" : "Sign in"}
      </Button>

      {isDemoMode && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-xs text-brand-800 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200">
          <p className="font-semibold">Demo accounts</p>
          <ul className="mt-1 space-y-0.5">
            <li>admin@demo.com · brand@demo.com · creator@demo.com</li>
            <li>Password for all: <span className="font-mono font-semibold">demo123</span></li>
          </ul>
        </div>
      )}
    </form>
  );
}

/** Turn low-level auth errors into friendly, non-leaky copy. */
function cleanAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "The email or password is incorrect. Please try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email address before signing in. Check your inbox for the verification link.";
  }
  if (lower.includes("demo mode") || lower.includes("demo credentials")) {
    return message;
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return "We could not reach the server. Check your connection and try again.";
  }
  return "Unable to sign in right now. Please try again.";
}