"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CREATOR_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { SkeletonCard } from "@/components/states/Loading";
import { EmptyState } from "@/components/states/Empty";
import { demoData, isDemoMode } from "@/services/demo-data";
import { formatCurrency, formatNumber } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Creator Earnings Page Component
// ---------------------------------------------------------------------------

export default function CreatorEarningsPage() {
  const { user, loading: authLoading } = useAuth();
  const [earnings, setEarnings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [timeRange, setTimeRange] = React.useState<"7d" | "30d" | "90d" | "1y" | "all">("30d");
  const [groupBy, setGroupBy] = React.useState<"day" | "week" | "month">("day");

  React.useEffect(() => {
    async function fetchEarnings() {
      if (authLoading) return;

      setLoading(true);
      try {
        if (isDemoMode) {
          const creatorProfile = demoData.creatorProfile;
          
          // Get invoices for this creator
          let filtered = demoData.invoices.filter(i => i.creator_profile_id === creatorProfile.id);
          
          // Filter by time range
          const now = new Date();
          const rangeMs = {
            "7d": 7 * 24 * 60 * 60 * 1000,
            "30d": 30 * 24 * 60 * 60 * 1000,
            "90d": 90 * 24 * 60 * 60 * 1000,
            "1y": 365 * 24 * 60 * 60 * 1000,
            "all": Infinity,
          }[timeRange];
          
          const cutoff = new Date(now.getTime() - rangeMs);
          filtered = filtered.filter(i => new Date(i.created_at) >= cutoff);
          
          // Enrich with collaboration and campaign data
          const enriched = filtered.map(inv => {
            const collab = demoData.collaborations.find(c => c.id === inv.collaboration_id);
            const campaign = collab ? demoData.campaigns.find(c => c.id === collab.campaign_id) : null;
            return {
              ...inv,
              collaboration: collab,
              campaign,
            };
          });
          
          // Sort by date desc
          enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          setEarnings(enriched);
        } else {
          setEarnings([]);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchEarnings();
  }, [authLoading, user?.id, timeRange]);

  // Calculate summary stats
  const stats = React.useMemo(() => {
    const total = earnings.reduce((sum, e) => sum + e.amount, 0);
    const paid = earnings.filter(e => e.status === "paid").reduce((sum, e) => sum + e.amount, 0);
    const pending = earnings.filter(e => e.status === "sent" || e.status === "pending").reduce((sum, e) => sum + e.amount, 0);
    const overdue = earnings.filter(e => e.status === "overdue").reduce((sum, e) => sum + e.amount, 0);
    const thisMonth = earnings.filter(e => {
      const created = new Date(e.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).reduce((sum, e) => sum + e.amount, 0);

    return { total, paid, pending, overdue, thisMonth };
  }, [earnings]);

  // Prepare chart data (grouped by time period)
  const chartData = React.useMemo(() => {
    const groups: Record<string, { amount: number; count: number }> = {};
    
    earnings.forEach(e => {
      const date = new Date(e.created_at);
      let key: string;
      
      switch (groupBy) {
        case "day":
          key = date.toISOString().split("T")[0];
          break;
        case "week":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split("T")[0];
          break;
        case "month":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          break;
        default:
          key = date.toISOString().split("T")[0];
      }
      
      if (!groups[key]) groups[key] = { amount: 0, count: 0 };
      groups[key].amount += e.amount;
      groups[key].count += 1;
    });
    
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({ period, ...data }));
  }, [earnings, groupBy]);

  // Platform breakdown
  const platformBreakdown = React.useMemo(() => {
    const breakdown: Record<string, { amount: number; count: number }> = {};
    
    earnings.forEach(e => {
      const campaign = e.campaign;
      if (campaign && campaign.platform_requirements) {
        campaign.platform_requirements.forEach((p: string) => {
          if (!breakdown[p]) breakdown[p] = { amount: 0, count: 0 };
          breakdown[p].amount += e.amount / campaign.platform_requirements.length;
          breakdown[p].count += 1;
        });
      }
    });
    
    return Object.entries(breakdown)
      .map(([platform, data]) => ({ platform, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [earnings]);

  if (authLoading) {
    return (
      <DashboardLayout
        navSections={CREATOR_NAV_SECTIONS}
        title="Loading..."
        user={null}
      >
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !user.creator_profile_id) {
    return (
      <DashboardLayout
        navSections={CREATOR_NAV_SECTIONS}
        title="Earnings"
        user={user}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Complete your creator profile first</h2>
          <p className="text-text-secondary mb-4">You need a creator profile to view earnings.</p>
          <Button asChild>
            <a href="/dashboard/creator/profile">Create Profile</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      navSections={CREATOR_NAV_SECTIONS}
      title="Earnings Overview"
      description="Track your income from brand collaborations"
      user={user}
    >
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Earnings</p>
              <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.total)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0l1-1m-1 1l-1-1" /></svg>
            </div>
          </div>
        </Card>
        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">This Month</p>
              <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.thisMonth)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success-600 dark:text-success-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          </div>
        </Card>
        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Paid</p>
              <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.paid)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success-600 dark:text-success-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
          </div>
        </Card>
        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Pending</p>
              <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.pending)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center text-warning-600 dark:text-warning-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        </Card>
        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Overdue</p>
              <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.overdue)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-error-100 dark:bg-error-900/30 flex items-center justify-center text-error-600 dark:text-error-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <Card variant="outlined" padding="md" className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex gap-3 flex-wrap">
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              options={[
                { value: "7d", label: "Last 7 Days" },
                { value: "30d", label: "Last 30 Days" },
                { value: "90d", label: "Last 90 Days" },
                { value: "1y", label: "Last Year" },
                { value: "all", label: "All Time" },
              ]}
              className="w-40"
            />
            <Select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              options={[
                { value: "day", label: "By Day" },
                { value: "week", label: "By Week" },
                { value: "month", label: "By Month" },
              ]}
              className="w-36"
            />
          </div>
        </div>
      </Card>

      {/* Earnings Chart */}
      <Card variant="outlined" className="mb-6">
        <CardHeader>
          <h3 className="text-lg font-semibold">Earnings Trend</h3>
        </CardHeader>
        <CardContent>
          <EarningsChart data={chartData} groupBy={groupBy} />
        </CardContent>
      </Card>

      {/* Platform Breakdown */}
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <Card variant="outlined">
          <CardHeader>
            <h3 className="text-lg font-semibold">By Platform</h3>
          </CardHeader>
          <CardContent>
            {platformBreakdown.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                }
                title="No platform data"
                description="Earnings will be broken down by platform once you have paid collaborations."
              />
            ) : (
              <div className="space-y-3">
                {platformBreakdown.map((item, index) => (
                  <div key={item.platform} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                      style={{ backgroundColor: PLATFORM_COLORS[item.platform] || `hsl(${index * 60}, 70%, 50%)` }}>
                      {item.platform.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{item.platform}</span>
                        <span className="text-text-primary font-semibold">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" 
                          style={{ 
                            width: `${platformBreakdown.length > 0 ? (item.amount / Math.max(...platformBreakdown.map(p => p.amount))) * 100 : 0}%`,
                            backgroundColor: PLATFORM_COLORS[item.platform] || `hsl(${index * 60}, 70%, 50%)`
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-text-tertiary">{item.count} invoices</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardHeader>
            <h3 className="text-lg font-semibold">By Status</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Paid", amount: stats.paid, color: "success" },
                { label: "Pending", amount: stats.pending, color: "warning" },
                { label: "Overdue", amount: stats.overdue, color: "error" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `var(--color-${item.color}-100)`, color: `var(--color-${item.color}-600)` }}>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      {item.color === "success" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />}
                      {item.color === "warning" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
                      {item.color === "error" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />}
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-text-primary font-semibold">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" 
                        style={{ 
                          width: `${stats.total > 0 ? (item.amount / stats.total) * 100 : 0}%`,
                          backgroundColor: `var(--color-${item.color}-500)`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Earnings Table */}
      <Card variant="outlined">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold">Recent Earnings</h3>
          <Button variant="outline" size="sm" asChild>
            <a href="/dashboard/creator/payouts">View Payouts</a>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} showAvatar={false} lines={1} />)}
            </div>
          ) : earnings.length === 0 ? (
            <EmptyState
              icon={
                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0l1-1m-1 1l-1-1" /></svg>
              }
              title="No earnings yet"
              description="Complete collaborations to start earning income."
              action={{
                label: "Browse Campaigns",
                onClick: () => window.location.href = "/dashboard/creator/campaigns",
                variant: "primary"
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-text-tertiary border-b border-border-subtle">
                    <th className="pb-3 font-medium">Campaign</th>
                    <th className="pb-3 font-medium">Brand</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                    <th className="pb-3 font-medium text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {earnings.slice(0, 10).map((earning) => (
                    <tr key={earning.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="py-3">
                        <div className="font-medium text-text-primary">{earning.campaign?.title || "Unknown Campaign"}</div>
                        <div className="text-sm text-text-tertiary">Invoice: {earning.invoice_number}</div>
                      </td>
                      <td className="py-3 text-text-secondary">{earning.campaign?.brand?.name || "Unknown Brand"}</td>
                      <td className="py-3">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          earning.status === "paid" && "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400",
                          earning.status === "sent" && "bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400",
                          earning.status === "pending" && "bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-400",
                          earning.status === "overdue" && "bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400",
                          earning.status === "cancelled" && "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400",
                        )}>
                          {earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold text-text-primary">
                        {formatCurrency(earning.amount)} {earning.currency}
                      </td>
                      <td className="py-3 text-right text-sm text-text-tertiary whitespace-nowrap">
                        {new Date(earning.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------
// Earnings Chart Component
// ---------------------------------------------------------------------------

function EarningsChart({ data, groupBy }: { data: any[]; groupBy: string }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-text-tertiary">No data for selected period</p>
      </div>
    );
  }

  const maxAmount = Math.max(...data.map(d => d.amount));
  const barWidth = groupBy === "month" ? 40 : groupBy === "week" ? 30 : 20;

  return (
    <div className="h-64 flex items-end justify-center gap-1 px-4" style={{ minWidth: `${data.length * (barWidth + 8)}px` }}>
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center gap-2" style={{ width: `${barWidth}px` }}>
          <div 
            className="w-full rounded-t transition-all duration-300 hover:opacity-80"
            style={{ 
              height: `${maxAmount > 0 ? (item.amount / maxAmount) * 200 : 0}px`,
              background: "linear-gradient(to top, var(--color-brand-600), var(--color-brand-400))"
            }}
            title={`${formatCurrency(item.amount)} (${item.count} invoices)`}
          />
          <span className="text-xs text-text-tertiary whitespace-nowrap">
            {groupBy === "month" 
              ? item.period.split("-").reverse().join("/") 
              : new Date(item.period).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </div>
      ))}
    </div>
  );
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E4405F",
  tiktok: "#000000",
  youtube: "#FF0000",
  pinterest: "#E60023",
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  twitch: "#9146FF",
  facebook: "#1877F2",
};

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}