"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Input";
import Link from "next/link";
import { MailIcon, LockIcon, UsersIcon } from "@/components/ui/icons";
import { InlineSuccess } from "@/components/states/Success";

export function RegistrationForm() {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [showPassword, setShowPassword] = React.useState(false);

  const roles = [
    { value: "creator", label: "I am a creator" },
    { value: "brand", label: "I am a brand" },
  ];

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = "Full name is required";
    if (!formData.email.trim()) nextErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) nextErrors.email = "Enter a valid email address";
    if (!formData.role) nextErrors.role = "Please select your role";
    if (!formData.password) nextErrors.password = "Password is required";
    else if (formData.password.length < 8) nextErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = "Passwords do not match";
    if (!formData.terms) nextErrors.terms = "You must agree to the terms";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    setTimeout(() => {
      setStatus("success");
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="reg-name" className="text-sm font-medium text-text-primary">
          Full name
        </label>
        <Input
          id="reg-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Jane Doe"
          leftIcon={<UsersIcon className="h-4 w-4" />}
          error={errors.name}
        />
        {errors.name && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.name}</p>}
      </div>
      <div className="space-y-2">
        <label htmlFor="reg-email" className="text-sm font-medium text-text-primary">
          Email address
        </label>
        <Input
          id="reg-email"
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
        <label className="text-sm font-medium text-text-primary block mb-2">I am a</label>
        <div className="grid grid-cols-2 gap-2">
          {roles.map((role) => (
            <label key={role.value} className="flex items-center gap-2 p-3 rounded-lg border border-border-subtle hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors">
              <input
                type="radio"
                name="role"
                value={role.value}
                checked={formData.role === role.value}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="h-4 w-4 rounded-full border-border-default text-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label={role.label}
              />
              <span className="text-sm text-text-secondary">{role.label}</span>
            </label>
          ))}
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
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
          leftIcon={<LockIcon className="h-4 w-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center text-neutral-400 hover:text-text-primary"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeToggleIcon show={showPassword} />
            </button>
          }
          error={errors.password}
        />
        {errors.password && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.password}</p>}
      </div>
      <div className="space-y-2">
        <label htmlFor="reg-confirm-password" className="text-sm font-medium text-text-primary">
          Confirm password
        </label>
        <Input
          id="reg-confirm-password"
          type={showPassword ? "text" : "password"}
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
          leftIcon={<LockIcon className="h-4 w-4" />}
          error={errors.confirmPassword}
        />
        {errors.confirmPassword && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.confirmPassword}</p>}
      </div>
      <div className="flex items-start gap-3">
        <Checkbox
          id="terms"
          checked={formData.terms}
          onCheckedChange={(checked) => setFormData({ ...formData, terms: checked })}
          required
        />
        <label htmlFor="terms" className="text-sm text-text-secondary leading-none">
          I agree to the{" "}
          <Link href="/terms-and-conditions" className="text-brand-600 dark:text-brand-400 hover:underline">
            Terms and Conditions
          </Link>
          {" and "}
          <Link href="/privacy-policy" className="text-brand-600 dark:text-brand-400 hover:underline">
            Privacy Policy
          </Link>
        </label>
        {errors.terms && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.terms}</p>}
      </div>
      <Button type="submit" variant="primary" size="lg" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? "Creating accountâ€¦" : "Create account"}
      </Button>
      {status === "success" && (
        <InlineSuccess message="Welcome to CALLBACX TECHNOLOGY! Your account has been created. We will review your application and get in touch." />
      )}
      {status === "error" && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
          Something went wrong. Please try again.
        </div>
      )}
      <p className="text-xs text-text-tertiary text-center max-w-xs mx-auto">
        Registration is a frontend demonstration â€” no real account is created.
      </p>
    </form>
  );
}

function EyeToggleIcon({ show }: { show: boolean }) {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      {show ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7m-11.5 2c-3.512 0-6.488-2.348-7.482-5.944C4.108 6.545 5.898 4 9.438 4c1.923 0 3.567 1.253 4.469 2.625a13.1 13.1 0 011.632 2.755c-.478.324-.896.737-1.219 1.219a13.1 13.1 0 01-2.755 1.632C6.88 15.286 5.636 16.93 5.458 19z" />
        </>
      ) : (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 12s4-8 11-8 11 8-4 8-11 8-11-8-11-8z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </>
      )}
    </svg>
  );
}


