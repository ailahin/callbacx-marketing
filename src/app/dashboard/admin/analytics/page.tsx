"use client";

/**
 * CALLBACX TECHNOLOGY — Admin Analytics
 *
 * Analytics and reporting — Analytics tab.
 * Platform-wide KPIs and trend charts.
 */

import * as React from "react";
import { DashboardLayout, ADMIN_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

interface AnalyticsOverview {
  total_brands: number;
  total_creators: number;
  total_campaigns: number;
  total_collaborations: number;
  total_payments: number;
  total_disputes: number;
  total_support_tickets: number;
  total_revenue: number;
  monthly_active_users: number;
  period: string;
}

interface AnalyticsTrendPoint {
  date: string;
  value: number;
}

const PERIOD_OPTIONS = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
];

export default function AdminAnalyticsPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [overview, setOverview] = React.useState<AnalyticsOverview | null>(null);
  const [trends, setTrends] = React.useState<AnalyticsTrendPoint[]>([]);
  const [period, setPeriod] = React.useState("30d");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadAnalytics();
  }, [period]);

  async function loadAnalytics() {
    const params = new URLSearchParams({ period });
    try {
      const res = await fetch(`/api/admin/analytics?${params}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = await res.json();
      setOverview(json.data?.overview ?? null);
      setTrends(json.data?.trends ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

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
      </div>
    );
  }

  const userDisplayName = user.full_name || user.email;

  return (
    <DashboardLayout
      navSections={ADMIN_NAV_SECTIONS}
      title="Analytics"
      description="Platform-wide KPIs and trends."
      user={{
        name: userDisplayName,
        email: user.email,
        avatar: user.avatar_url ?? undefined,
        role: user.role,
      }}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex-1 sm:w-auto">
            <Select
              options={PERIOD_OPTIONS}
              value={period}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPeriod(e.target.value)}
              placeholder="Period"
            />
          </div>
          <div className="flex gap-2 sm:w-auto">
            <Button onClick={loadAnalytics}>Refresh</Button>
          </div>
        </div>

        {overview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <StatCard title="Total Brands" value={overview.total_brands} change={{ value: 12, label: "%", positive: true }} icon="🏢" format="number" />
            <StatCard title="Total Creators" value={overview.total_creators} change={{ value: 8, label: "%", positive: true }} icon="🎨" format="number" />
            <StatCard title="Total Campaigns" value={overview.total_campaigns} change={{ value: 5, label: "%", positive: true }} icon="📢" format="number" />
            <StatCard title="Total Collaborations" value={overview.total_collaborations} change={{ value: 10, label: "%", positive: true }} icon="🤝" format="number" />
            <StatCard title="Total Payments" value={overview.total_payments} change={{ value: 15, label: "%", positive: true }} icon="💳" format="number" />
            <StatCard title="Total Disputes" value={overview.total_disputes} change={{ value: 3, label: "%", positive: false }} icon="⚖️" format="number" />
            <StatCard title="Support Tickets" value={overview.total_support_tickets} change={{ value: 2, label: "%", positive: false }} icon="🎫" format="number" />
            <StatCard title="Total Revenue" value={overview.total_revenue} change={{ value: 18, label: "%", positive: true }} icon="💰" format="currency" currency="USD" />
          </div>
        )}

        <div className="bg-surface p-6 rounded-lg border border-border-subtle h-80">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Revenue Trend ({overview?.period ?? period})</h3>
          <div className="flex h-full items-end gap-1 px-2">
            {trends.map((point, i) => {
              const max = Math.max(...trends.map((t) => t.value), 1);
              const height = Math.max((point.value / max) * 100, 8);
              return (
                <div
                  key={i}
                  className="flex-1 bg-brand-600 rounded-sm transition-all duration-300 hover:bg-brand-500"
                  style={{ height: `${height}%` }}
                  title={`${point.date}: ${point.value.toLocaleString()}`}
                />
              );
            })}
          </div>
          <div className="mt-4 flex justify-between text-xs text-text-tertiary">
            {trends.length > 0 ? (
              <>
                <span>{trends[0].date}</span>
                <span>{trends[trends.length - 1].date}</span>
              </>
            ) : (
              <span className="text-center w-full">No trend data</span>
            )}
          </div>
        </div>

        {!overview && loading && (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
