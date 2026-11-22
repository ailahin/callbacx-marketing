"use client";

/**
 * CALLBACX — Campaign Detail with budget tracking
 */

import * as React from "react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BRAND_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/states/Loading";
import { demoData, isDemoMode } from "@/services/demo-data";
import { formatCurrency, formatDate } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Campaign Budget Tracking Page
// ---------------------------------------------------------------------------

export default function BrandCampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const campaignId = (params?.id as string) ?? "";

  const { user, loading: authLoading } = useAuth();
  const [campaign, setCampaign] = React.useState<any>(null);
  const [budget, setBudget] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      if (!campaignId) return;
      setLoading(true);
      try {
        if (isDemoMode) {
          const found = demoData.campaigns.find((c) => c.id === campaignId);
          setCampaign(found ?? null);
          setBudget({
            campaignId: found?.id ?? campaignId,
            budgetTotal: found?.budget_total ?? 0,
            budgetSpent: found?.budget_spent ?? 0,
            budgetCurrency: found?.budget_currency ?? "USD",
            spent: found?.budget_spent ?? 0,
            remaining: (found?.budget_total ?? 0) - (found?.budget_spent ?? 0),
            utilization: (found?.budget_total ?? 0) > 0 ? (found?.budget_spent ?? 0) / (found?.budget_total ?? 0) : 0,
          });
        } else {
          const campaignRes = await fetch(`/api/campaigns/${campaignId}`);
          const campaignJson = await campaignRes.json();
          const foundCampaign = campaignJson?.data ?? null;
          setCampaign(foundCampaign);

          const budgetRes = await fetch(`/api/campaigns/${campaignId}/budget`);
          const budgetJson = await budgetRes.json();
          setBudget(budgetJson?.data ?? null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [authLoading, campaignId]);

  if (authLoading || loading) {
    return (
      <DashboardLayout navSections={BRAND_NAV_SECTIONS} title="Loading..." user={null}>
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </DashboardLayout>
    );
  }

  const spent = budget?.spent ?? campaign?.budget_spent ?? 0;
  const total = budget?.budgetTotal ?? campaign?.budget_total ?? 0;
  const remaining = budget?.remaining ?? Math.max(0, (total ?? 0) - (spent ?? 0));
  const utilization = budget?.utilization ?? ((total ?? 0) > 0 ? (spent ?? 0) / (total ?? 0) : 0);
  const percent = Math.round((utilization ?? 0) * 100);

  const overBudget = remaining <= 0 && total > 0;

  return (
    <DashboardLayout
      navSections={BRAND_NAV_SECTIONS}
      title={campaign?.title ?? "Campaign"}
      description="Campaign budget tracking"
      user={user ? { name: user.full_name || user.email, email: user.email, avatar: user.avatar_url ?? undefined, role: user.role } : null}
      topBarActions={
        <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/dashboard/brand/campaigns")}>
          Back to Campaigns
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card variant="outlined" padding="lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">{campaign?.title ?? "Campaign"}</h3>
                {campaign && <StatusBadge status={(campaign.status as any) ?? "draft"} size="sm" />}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaign?.description && <p className="text-text-secondary">{campaign.description}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-text-tertiary">Start Date</p>
                  <p className="font-medium text-text-primary">{campaign?.start_date ? formatDate(campaign.start_date) : "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm text-text-tertiary">End Date</p>
                  <p className="font-medium text-text-primary">{campaign?.end_date ? formatDate(campaign.end_date) : "Not set"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card variant="outlined" padding="lg">
            <CardHeader>
              <h3 className="text-lg font-semibold">Budget Tracking</h3>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex items-end justify-between mb-1">
                  <p className="text-sm text-text-secondary">Spent</p>
                  <p className="text-2xl font-bold text-text-primary">{formatCurrency(spent)}</p>
                </div>
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all"
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>
                <p className="text-xs text-text-tertiary mt-1">
                  {percent}% of {formatCurrency(total)} {budget?.budgetCurrency ?? campaign?.budget_currency ?? "USD"} budget
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Budget Total</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Spent</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(spent)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Remaining</span>
                  <span className={`font-semibold ${overBudget ? "text-error-600" : "text-text-primary"}`}>
                    {formatCurrency(remaining)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Status</span>
                  <span className={overBudget ? "font-semibold text-error-600" : "font-semibold text-success-600"}>
                    {overBudget ? "Over Budget" : percent >= 80 ? "Approaching Budget" : "Within Budget"}
                  </span>
                </div>
              </div>

              {overBudget && (
                <div className="rounded-lg bg-error-50 border border-error-200 p-3 text-sm text-error-700">
                  Campaign budget has been exceeded. Consider pausing or adjusting the campaign.
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined" padding="lg">
            <CardHeader>
              <h3 className="text-lg font-semibold">Financial Summary</h3>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Gross Spend</span>
                <span className="font-semibold text-text-primary">{formatCurrency(spent)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Platform Commission</span>
                <span className="font-semibold text-text-primary">{formatCurrency((spent * 0.1) || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Creator Net</span>
                <span className="font-semibold text-text-primary">{formatCurrency((spent * 0.9) || 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
