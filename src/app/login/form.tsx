"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Input";
import Link from "next/link";
import { MailIcon, LockIcon, EyeIcon } from "@/components/ui/icons";
import { InlineSuccess } from "@/components/states/Success";

export function LoginForm({ redirect }: { redirect: string }) {
  const router = useRouter();
  const [formData, setFormData] = React.useState({ email: "", password: "", remember: false });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [showPassword, setShowPassword] = React.useState(false);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.email.trim()) nextErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) nextErrors.email = "Enter a valid email address";
    if (!formData.password) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    setErrors({});

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
      router.push(redirect);
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="login-email" className="text-sm font-medium text-text-primary">
          Email address
        </label>
        <Input
          id="login-email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="jane@example.com"
          leftIcon={<MailIcon className="h-4 w-4" />}
          error={errors.email}
        />
        {errors.email && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.email}</p>}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="text-sm font-medium text-text-primary">
            Password
          </label>
          <Link
            href="#"
            className="text-xs text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded p-1"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="login-password"
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="••••••••"
          leftIcon={<LockIcon className="h-4 w-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center text-neutral-400 hover:text-text-primary"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon className="h-4 w-4" />
            </button>
          }
          error={errors.password}
        />
        {errors.password && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.password}</p>}
      </div>
      <div className="flex items-start gap-3">
        <Checkbox
          id="remember"
          label="Remember me"
          checked={formData.remember}
          onCheckedChange={(checked) => setFormData({ ...formData, remember: checked })}
        />
      </div>
      <Button type="submit" variant="primary" size="lg" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? "Signing in…" : "Sign in"}
      </Button>
      {status === "success" && (
        <InlineSuccess message="You have been signed in successfully." />
      )}
      {status === "error" && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
          Invalid email or password. Please try again.
        </div>
      )}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t border-border-subtle" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-4 bg-background text-text-tertiary">Or continue with</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <PlaceholderSocialButton label="Google" />
        <PlaceholderSocialButton label="Apple" />
      </div>
      <p className="text-xs text-text-tertiary text-center max-w-xs mx-auto">
        Social login options are illustrative placeholders and are not connected to real providers.
      </p>
    </form>
  );
}

function PlaceholderSocialButton({ label }: { label: string }) {
  return (
    <Button variant="ghost" size="lg" className="w-full text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800" disabled>
      <span className="flex items-center justify-center gap-2 w-full">
        <span className="text-lg" aria-hidden="true">{label === "Google" ? "G" : "A"}</span>
        <span>{label}</span>
        <span className="text-[10px] text-text-tertiary" aria-hidden="true">placeholder</span>
      </span>
    </Button>
  );
}
