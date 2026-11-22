"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getSupabaseClient } from "@/lib/supabase/client";

type State = "verifying" | "success" | "error";

/**
 * Handles the email verification link sent by Supabase.
 *
 * Supports both the modern `token_hash` + `type` query form and the legacy
 * implicit-flow `code`/`access_token` hash form. Once verified, the user is
 * offered a clear path to sign in.
 */
export function VerifyEmailView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = React.useState<State>("verifying");
  const [message, setMessage] = React.useState("");
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const verify = async () => {
      try {
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type");

        // Modern Supabase verifyOtp flow (token_hash + type in query string).
        if (tokenHash && (type === "signup" || type === "recovery" || type === "email_change")) {
          const res = await fetch("/api/auth/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token_hash: tokenHash, type: type === "recovery" ? "recovery" : "signup" }),
          });
          if (!res.ok) throw new Error("verification_failed");
          setState("success");
          return;
        }

        // Legacy / SPA code exchange: the browser client detects the session in
        // the URL automatically. Give it a moment, then check for a session.
        const supabase = getSupabaseClient();
        const urlCode = new URLSearchParams(window.location.search).get("code");
        if (urlCode && typeof supabase.auth.exchangeCodeForSession === "function") {
          const { error } = await supabase.auth.exchangeCodeForSession(urlCode);
          if (!error) {
            setState("success");
            return;
          }
        }

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setState("success");
          return;
        }

        throw new Error("no_token");
      } catch {
        setState("error");
        setMessage("This verification link is invalid or has expired. Please request a new one.");
      }
    };

    verify();
  }, [searchParams]);

  if (state === "verifying") {
    return (
      <div className="w-full max-w-md rounded-3xl border border-border-subtle bg-surface p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        <h1 className="text-h4 font-semibold text-text-primary">Verifying your email…</h1>
        <p className="mt-2 text-sm text-text-secondary">This will only take a moment.</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="w-full max-w-md rounded-3xl border border-success-200 bg-success-50 p-8 text-center animate-scale-in dark:border-success-800 dark:bg-success-950/40">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-100 dark:bg-success-900">
          <svg className="h-7 w-7 text-success-600 dark:text-success-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-h3 font-bold text-success-900 dark:text-success-100">Email verified</h1>
        <p className="mt-2 text-sm text-success-700 dark:text-success-300">
          Your email has been confirmed. You can now sign in to your account.
        </p>
        <Button className="mt-6" variant="primary" onClick={() => router.push("/login")}>
          Continue to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-error-200 bg-error-50 p-8 text-center animate-scale-in dark:border-error-800 dark:bg-error-950/40">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error-100 dark:bg-error-900">
        <svg className="h-7 w-7 text-error-600 dark:text-error-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3l9 16H3l9-16z" />
        </svg>
      </div>
      <h1 className="text-h3 font-bold text-error-900 dark:text-error-100">Verification failed</h1>
      <p className="mt-2 text-sm text-error-700 dark:text-error-300">{message}</p>
      <div className="mt-6 flex flex-col gap-3">
        <Button variant="primary" onClick={() => router.push("/forgot-password")}>
          Send a new verification link
        </Button>
        <Link href="/login" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}