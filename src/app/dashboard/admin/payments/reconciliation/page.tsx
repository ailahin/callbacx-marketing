"use client";

/**
 * CALLBACX — Admin Financial Reconciliation Report
 */

import * as React from "react";
import { DashboardLayout, ADMIN_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/states/Loading";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function AdminPaymentsReconciliationPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [report, setReport] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");

  const loadReport = React.useCallback(async (fromDate?: string, toDate?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      const qs = params.toString();
      const res = await fetch(`/api/admin/payments/reconciliation${qs ? `?${qs}` : ""}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || "Failed to load reconciliation report.");
      setReport(json?.data ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadReport(from || undefined, to || undefined);
  }, [from, to, loadReport]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !hasPermission("admin:payments")) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center p-6">
        <h1 className="text-xl font-semibold text-text-primary">Access Denied</h1>
      </div>
    );
  }

  return (
    <DashboardLayout
      navSections={ADMIN_NAV_SECTIONS}
      title="Reconciliation Report"
      description="Financial reconciliation: provider transactions vs refunds and payouts."
      user={{
        name: user.full_name || user.email,
        email: user.email,
        avatar: user.avatar_url ?? undefined,
        role: user.role,
      }}
    >
      <div className="space-y-6">
        <Card variant="outlined" padding="md">
          <CardHeader className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex gap-4 flex-wrap">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="from">From</label>
                <input
                  id="from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="to">To</label>
                <input
                  id="to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary"
                />
              </div>
              <Button onClick={() => loadReport(from || undefined, to || undefined)}>Generate</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFrom("");
                  setTo("");
                }}
              >
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : !report ? (
              <p className="text-text-secondary">No report available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-surface p-4 rounded-lg border border-border-subtle">
                  <p className="text-xs text-text-tertiary">Transactions</p>
                  <p className="text-lg font-bold text-text-primary">{report.transaction_count ?? 0}</p>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border-subtle">
                  <p className="text-xs text-text-tertiary">Gross Volume</p>
                  <p className="text-lg font-bold text-text-primary">{formatCurrency(report.gross_volume ?? 0)}</p>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border-subtle">
                  <p className="text-xs text-text-tertiary">Total Fees</p>
                  <p className="text-lg font-bold text-text-primary">{formatCurrency(report.total_fees ?? 0)}</p>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border-subtle">
                  <p className="text-xs text-text-tertiary">Creator Net</p>
                  <p className="text-lg font-bold text-text-primary">{formatCurrency(report.creator_net ?? 0)}</p>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border-subtle">
                  <p className="text-xs text-text-tertiary">Refunds</p>
                  <p className="text-lg font-bold text-text-primary">{formatCurrency(report.refunds_total ?? 0)}</p>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border-subtle">
                  <p className="text-xs text-text-tertiary">Net Revenue</p>
                  <p className="text-lg font-bold text-text-primary">{formatCurrency(report.net_revenue ?? 0)}</p>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border-subtle">
                  <p className="text-xs text-text-tertiary">Payouts Paid</p>
                  <p className="text-lg font-bold text-text-primary">{formatCurrency(report.payouts_paid ?? 0)}</p>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border-subtle">
                  <p className="text-xs text-text-tertiary">Open Payouts</p>
                  <p className="text-lg font-bold text-text-primary">{report.open_payouts ?? 0}</p>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border-subtle">
                  <p className="text-xs text-text-tertiary">Succeeded Without Payout</p>
                  <p className="text-lg font-bold text-text-primary">{report.succeeded_without_payout ?? 0}</p>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border-subtle">
                  <p className="text-xs text-text-tertiary">Refunds Not Processed</p>
                  <p className="text-lg font-bold text-text-primary">{report.refund_without_processed ?? 0}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = "/dashboard/admin/payments";
            }}
          >
            Back to Payments
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
