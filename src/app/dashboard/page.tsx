"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { defaultDashboardForRole } from "@/lib/auth-redirect";

/**
 * Dashboard entry point.
 *
 * Inspects the authenticated user's primary role and forwards them to the
 * correct dashboard area. This is the canonical post-login destination so the
 * login flow never hard-codes a role-specific path (which previously always
 * sent users to /dashboard/admin and bounced non-admins back out).
 */
export default function DashboardIndexPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?redirect=/dashboard");
      return;
    }
    router.replace(defaultDashboardForRole(user.role));
  }, [user, loading, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
      <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      <p className="text-text-secondary">Taking you to your dashboard…</p>
    </div>
  );
}