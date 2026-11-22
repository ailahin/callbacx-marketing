"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Input";
import { MailIcon, LockIcon, UserIcon, EyeIcon } from "@/components/ui/icons";
import { useAuth, isDemoMode } from "@/context/AuthProvider";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Role = "creator" | "brand";

const ROLES: { value: Role; label: string; description: string }[] = [
  { value: "creator", label: "I am a creator", description: "Collaborate with brands" },
  { value: "brand", label: "I am a brand", description: "Find and hire creators" },
];

export function RegistrationForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    role: "" as Role | "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = "Full name is required";
    if (!formData.email.trim()) nextErrors.email = "Email is required";
    else if (!EMAIL_RE.test(formData.email.trim())) nextErrors.email = "Enter a valid email address";
    if (!formData.role) nextErrors.role = "Please select an account type";
    if (!formData.password) nextErrors.password = "Password is required";
    else if (formData.password.length < 8) nextErrors.password = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(formData.password)) nextErrors.password = "Add at least one uppercase letter";
    else if (!/[a-z]/.test(formData.password)) nextErrors.password = "Add at least one lowercase letter";
    else if (!/[0-9]/.test(formData.password)) nextErrors.password = "Add at least one number";
    else if (!/[^A-Za-z0-9]/.test(formData.password)) nextErrors.password = "Add at least one special character";
    if (!formData.confirmPassword) nextErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = "Passwords do not match";
    if (!formData.terms) nextErrors.terms = "You must agree to the terms to continue";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!validate()) return;

    setStatus("submitting");
    const { error } = await signUp(formData.email.trim(), formData.password, formData.name.trim());

    if (error) {
      setStatus("error");
      setErrorMessage(cleanSignUpError(error.message));
      return;
    }

    setStatus("success");
    // Give the success message a moment to render before redirecting to login.
    setTimeout(() => {
      router.push("/login?registered=1");
    }, 2500);
  };

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-success-200 bg-success-50 p-6 text-center animate-scale-in dark:border-success-800 dark:bg-success-950/40"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-100 dark:bg-success-900">
          <svg className="h-6 w-6 text-success-600 dark:text-success-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-success-900 dark:text-success-100">Account created</h3>
        <p className="mt-2 text-sm text-success-700 dark:text-success-300">
          Check your inbox to verify your email, then sign in to get started.
        </p>
        <Button className="mt-5" variant="primary" onClick={() => router.push("/login?registered=1")}>
          Go to sign in
        </Button>
      </div>
    );
  }

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
        <label htmlFor="reg-name" className="text-sm font-medium text-text-primary">
          Full name
        </label>
        <Input
          id="reg-name"
          autoComplete="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Jane Doe"
          leftIcon={<UserIcon className="h-4 w-4" />}
          error={errors.name}
          disabled={status === "submitting"}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="reg-email" className="text-sm font-medium text-text-primary">
          Email address
        </label>
        <Input
          id="reg-email"
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
        <label className="mb-2 block text-sm font-medium text-text-primary">I am a</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ROLES.map((role) => {
            const active = formData.role === role.value;
            return (
              <label
                key={role.value}
                className={[
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all",
                  active
                    ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 dark:border-brand-400 dark:bg-brand-950/40"
                    : "border-border-subtle hover:border-brand-300 hover:bg-neutral-50 dark:hover:bg-neutral-800",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={active}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="mt-0.5 h-4 w-4 rounded-full border-border-default text-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500"
                  aria-label={role.label}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-text-primary">{role.label}</span>
                  <span className="block text-xs text-text-tertiary">{role.description}</span>
                </span>
              </label>
            );
          })}
        </div>
        {errors.role && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.role}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="reg-password" className="text-sm font-medium text-text-primary">
          Password
        </label>
        <Input
          id="reg-password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Create a strong password"
          leftIcon={<LockIcon className="h-4 w-4" />}
          error={errors.password}
          disabled={status === "submitting"}
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
        <p className="text-xs text-text-tertiary">
          At least 8 characters with upper &amp; lower case, a number, and a symbol.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="reg-confirm-password" className="text-sm font-medium text-text-primary">
          Confirm password
        </label>
        <Input
          id="reg-confirm-password"
          type={showConfirm ? "text" : "password"}
          autoComplete="new-password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          placeholder="Re-enter your password"
          leftIcon={<LockIcon className="h-4 w-4" />}
          error={errors.confirmPassword}
          disabled={status === "submitting"}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="pointer-events-auto flex items-center text-neutral-400 transition-colors hover:text-text-primary"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              <EyeIcon className="h-4 w-4" />
            </button>
          }
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={formData.terms}
            onCheckedChange={(checked) => setFormData({ ...formData, terms: checked })}
            disabled={status === "submitting"}
          />
          <label htmlFor="terms" className="text-sm leading-relaxed text-text-secondary">
            I agree to the{" "}
            <Link href="/terms-and-conditions" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
              Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
              Privacy Policy
            </Link>
          </label>
        </div>
        {errors.terms && <p className="text-sm text-error-600 dark:text-error-400">{errors.terms}</p>}
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
        {status === "submitting" ? "Creating account…" : "Create account"}
      </Button>

      {isDemoMode && (
        <p className="rounded-xl border border-warning-200 bg-warning-50 p-3 text-center text-xs text-warning-800 dark:border-warning-800 dark:bg-warning-950/40 dark:text-warning-200">
          You are in demo mode — new account creation is disabled. Use a demo account to sign in.
        </p>
      )}
    </form>
  );
}

function cleanSignUpError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already exists") || lower.includes("user already")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (lower.includes("password")) {
    return "Your password does not meet the requirements. Please choose a stronger password.";
  }
  if (lower.includes("demo mode")) {
    return message;
  }
  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return "We could not reach the server. Check your connection and try again.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return "We could not create your account right now. Please try again.";
}