"use client";

import * as React from "react";
import { DashboardLayout, ADMIN_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { StatCard } from "@/components/admin/StatCard";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Admin Overview Page Component (React Query Version)
// ---------------------------------------------------------------------------

interface AdminMetrics {
  total_users: number;
  total_brands: number;
  total_creators: number;
  total_campaigns: number;
  total_collaborations: number;
  total_payments_volume: number;
  pending_verifications: number;
  open_disputes: number;
  open_support_tickets: number;
  active_users_today: number;
  revenue_this_month: number;
  revenue_last_month: number;
  growth_percentage: number;
}

async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const res = await fetch("/api/admin/overview");
  if (!res.ok) throw new Error("Failed to load metrics");
  const data = await res.json();
  return data.data ?? null;
}

export default function AdminOverviewPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();

  const { data: metrics, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: fetchAdminMetrics,
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !authLoading && !!user && hasPermission("admin:analytics"),
  });

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !hasPermission("admin:analytics")) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center p-6">
        <h1 className="text-xl font-semibold text-text-primary">Access Denied</h1>
        <p className="mt-2 text-text-secondary">You do not have permission to view the admin dashboard.</p>
      </div>
    );
  }

  return (
    <DashboardLayout
      navSections={ADMIN_NAV_SECTIONS}
      title="Platform Overview"
      description="Key platform metrics at a glance."
      user={{
        name: user.full_name || user.email,
        email: user.email,
        avatar: user.avatar_url,
        role: user.role,
      }}
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full mb-3" />
            <p className="text-text-tertiary">Loading metrics...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-error-700">
            <p className="font-medium">Failed to load metrics.</p>
            <p className="mt-1 text-sm">{error.message}</p>
            <button onClick={() => refetch()} className="mt-3 text-sm text-brand-600 hover:underline">Retry</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Users"
                value={metrics?.total_users ?? 0}
                format="number"
                subtitle="Platform-wide"
                change={{ value: 12, label: "vs last month", positive: true }}
                color="brand"
              />
              <StatCard
                title="Total Brands"
                value={metrics?.total_brands ?? 0}
                format="number"
                subtitle="Registered brands"
                change={{ value: 5, label: "vs last month", positive: true }}
                color="accent"
              />
              <StatCard
                title="Total Creators"
                value={metrics?.total_creators ?? 0}
                format="number"
                subtitle="Registered creators"
                change={{ value: 8, label: "vs last month", positive: true }}
                color="sage"
              />
              <StatCard
                title="Active Campaigns"
                value={metrics?.total_campaigns ?? 0}
                format="number"
                subtitle="Live campaigns"
                change={{ value: -2, label: "vs last month", positive: false }}
                color="neutral"
              />
              <StatCard
                title="Payments Volume"
                value={metrics?.total_payments_volume ?? 0}
                format="currency"
                subtitle="This month"
                change={{ value: 15, label: "vs last month", positive: true }}
                color="brand"
              />
              <StatCard
                title="Pending Verifications"
                value={metrics?.pending_verifications ?? 0}
                format="number"
                subtitle="Brands + creators"
                change={{ value: 3, label: "awaiting review", positive: false }}
                color="warning"
              />
              <StatCard
                title="Open Disputes"
                value={metrics?.open_disputes ?? 0}
                format="number"
                subtitle="Needs attention"
                change={{ value: -1, label: "resolved today", positive: true }}
                color="error"
              />
              <StatCard
                title="Support Tickets"
                value={metrics?.open_support_tickets ?? 0}
                format="number"
                subtitle="Open + pending"
                change={{ value: 4, label: "new today", positive: false }}
                color="accent"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-xl border border-border-subtle bg-surface p-6">
                <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">Revenue Trend</h2>
                <div className="h-64 w-full flex items-end gap-2 px-2">
                  {[10, 18, 12, 25, 20, 30, 28, 35, 40, 32, 38, 45].map((v, i) => (
                    <div key={i} className="flex-1 bg-brand-600 rounded-t-sm" style={{ height: `${(v / 45) * 100}%` }} />
                  ))}
                </div>
                <div className="mt-4 flex justify-between text-xs text-text-tertiary">
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                  <span>Nov</span>
                </div>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface p-6">
                <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-primary border border-border-subtle rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    <span>Review pending verifications</span>
                    <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/30 px-2 py-0.5 rounded">
                      {metrics?.pending_verifications ?? 0}
                    </span>
                  </button>
                  <button className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-primary border border-border-subtle rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    <span>Resolve open disputes</span>
                    <span className="text-xs font-bold text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-950/30 px-2 py-0.5 rounded">
                      {metrics?.open_disputes ?? 0}
                    </span>
                  </button>
                  <button className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-primary border border-border-subtle rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    <span>Assign support tickets</span>
                    <span className="text-xs font-bold text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-950/30 px-2 py-0.5 rounded">
                      {metrics?.open_support_tickets ?? 0}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}