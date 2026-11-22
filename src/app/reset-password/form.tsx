"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LockIcon, EyeIcon } from "@/components/ui/icons";
import { useAuth, isDemoMode } from "@/context/AuthProvider";

const RULES = [
  { test: (v: string) => v.length >= 8, label: "At least 8 characters" },
  { test: (v: string) => /[A-Z]/.test(v), label: "One uppercase letter" },
  { test: (v: string) => /[a-z]/.test(v), label: "One lowercase letter" },
  { test: (v: string) => /[0-9]/.test(v), label: "One number" },
  { test: (v: string) => /[^A-Za-z0-9]/.test(v), label: "One special character" },
];

export function ResetPasswordForm() {
  const router = useRouter();
  const { updatePassword, loading: authLoading } = useAuth();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    const failed = RULES.find((r) => !r.test(password));
    if (failed) next.password = `Password needs: ${failed.label.toLowerCase()}`;
    if (!confirm) next.confirm = "Please confirm your password";
    else if (password !== confirm) next.confirm = "Passwords do not match";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!validate()) return;

    setStatus("submitting");
    const { error } = await updatePassword(password);

    if (error) {
      setStatus("error");
      setErrorMessage(cleanError(error.message));
      return;
    }

    setStatus("success");
    setTimeout(() => {
      router.push("/login?reset=1");
    }, 2500);
  };

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-success-200 bg-success-50 p-6 text-center animate-scale-in dark:border-success-800 dark:bg-success-950/40"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-100 dark:bg-success-900">
          <svg className="h-6 w-6 text-success-600 dark:text-success-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-success-900 dark:text-success-100">Password updated</h3>
        <p className="mt-2 text-sm text-success-700 dark:text-success-300">
          You can now sign in with your new password.
        </p>
        <Button className="mt-5" variant="primary" onClick={() => router.push("/login?reset=1")}>
          Continue to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {isDemoMode && (
        <div className="rounded-xl border border-warning-200 bg-warning-50 p-3 text-xs text-warning-800 dark:border-warning-800 dark:bg-warning-950/40 dark:text-warning-200">
          Password reset is disabled in demo mode.
        </div>
      )}

      {status === "error" && errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-700 animate-scale-in dark:border-error-800 dark:bg-error-950/40 dark:text-error-300"
        >
          {errorMessage}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="reset-password" className="text-sm font-medium text-text-primary">
          New password
        </label>
        <Input
          id="reset-password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        <ul className="grid grid-cols-1 gap-1 pt-1 text-xs sm:grid-cols-2">
          {RULES.map((rule) => {
            const met = rule.test(password);
            return (
              <li
                key={rule.label}
                className={["flex items-center gap-1.5", met ? "text-success-600 dark:text-success-400" : "text-text-tertiary"].join(" ")}
              >
                <span className={["flex h-3.5 w-3.5 items-center justify-center rounded-full border", met ? "border-success-500 bg-success-500 text-white" : "border-border-default"].join(" ")}>
                  {met && (
                    <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {rule.label}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-2">
        <label htmlFor="reset-confirm" className="text-sm font-medium text-text-primary">
          Confirm new password
        </label>
        <Input
          id="reset-confirm"
          type={showConfirm ? "text" : "password"}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter your new password"
          leftIcon={<LockIcon className="h-4 w-4" />}
          error={errors.confirm}
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

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={status === "submitting" || authLoading || isDemoMode}
      >
        {status === "submitting" ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}

function cleanError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("session") || lower.includes("token") || lower.includes("expired") || lower.includes("auth session missing")) {
    return "This reset link is invalid or has expired. Please request a new one.";
  }
  if (lower.includes("password")) {
    return "Your password does not meet the requirements. Please choose a stronger one.";
  }
  if (lower.includes("demo mode")) return message;
  return "We could not update your password right now. Please request a new reset link.";
}