"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BRAND_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/states/Loading";
import { EmptyState } from "@/components/states/Empty";
import { demoData, isDemoMode } from "@/services/demo-data";
import { formatCurrency, formatDate } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Brand Transaction History Page
// ---------------------------------------------------------------------------

export default function BrandTransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [statusFilter, setStatusFilter] = React.useState("");

  React.useEffect(() => {
    async function fetchTransactions() {
      if (authLoading) return;

      setLoading(true);
      try {
        if (isDemoMode) {
          let filtered = demoData.paymentTransactions.slice();
          if (user?.brand_id) {
            filtered = filtered.filter((t) => {
              const inv = demoData.invoices.find((i) => i.id === t.invoice_id);
              const collab = inv ? demoData.collaborations.find((c) => c.id === inv.collaboration_id) : null;
              return collab?.brand_id === user.brand_id;
            });
          }
          if (statusFilter) {
            filtered = filtered.filter((t) => t.status === statusFilter);
          }
          setTransactions(filtered);
        } else {
          const params = new URLSearchParams();
          if (statusFilter) params.set("status", statusFilter);
          params.set("limit", "50");
          const qs = params.toString();
          const res = await fetch(`/api/payments/transactions${qs ? `?${qs}` : ""}`, { cache: "no-store" });
          const json = await res.json();
          if (!res.ok) throw new Error(json?.error?.message || "Failed to load transactions.");
          setTransactions(json?.data ?? []);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [authLoading, user?.brand_id, statusFilter]);

  const stats = React.useMemo(() => {
    const succeeded = transactions.filter((t) => t.status === "succeeded");
    const totalVolume = succeeded.reduce((sum, t) => sum + (t.amount ?? 0), 0);
    const totalFees = succeeded.reduce((sum, t) => sum + (t.fee_amount ?? 0), 0);
    const totalRefunds = transactions
      .filter((t) => t.status === "refunded" || t.status === "partially_refunded")
      .reduce((sum, t) => sum + (t.amount ?? 0), 0);
    return { totalVolume, totalFees, totalRefunds };
  }, [transactions]);

  if (authLoading) {
    return (
      <DashboardLayout navSections={BRAND_NAV_SECTIONS} title="Loading..." user={null}>
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      navSections={BRAND_NAV_SECTIONS}
      title="Transactions"
      description="Payment history and financial records"
      user={user ? { name: user.full_name || user.email, email: user.email, avatar: user.avatar_url ?? undefined, role: user.role } : null}
    >
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card variant="outlined" padding="md">
          <div>
            <p className="text-sm text-text-secondary">Gross Volume</p>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.totalVolume)}</p>
          </div>
        </Card>
        <Card variant="outlined" padding="md">
          <div>
            <p className="text-sm text-text-secondary">Platform Fees</p>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.totalFees)}</p>
          </div>
        </Card>
        <Card variant="outlined" padding="md">
          <div>
            <p className="text-sm text-text-secondary">Refunds</p>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.totalRefunds)}</p>
          </div>
        </Card>
      </div>

      <Card variant="outlined" padding="md" className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 max-w-xs">
            <StatusBadge
              status={(statusFilter || "all") as any}
              size="sm"
              label={statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : "All"}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="succeeded">Succeeded</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="partially_refunded">Partially Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} showAvatar={false} lines={1} />
          ))}
        </div>
      ) : error ? (
        <Card variant="outlined" padding="lg">
          <EmptyState title="Failed to load transactions" description={error.message} />
        </Card>
      ) : transactions.length === 0 ? (
        <Card variant="outlined" padding="lg">
          <EmptyState
            title="No transactions found"
            description={statusFilter ? "Try adjusting your filters." : "Payments will appear here once invoices are paid."}
          />
        </Card>
      ) : (
        <Card variant="outlined">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-text-tertiary border-b border-border-subtle">
                  <th className="p-4 font-medium">Transaction</th>
                  <th className="p-4 font-medium">Provider</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                  <th className="p-4 font-medium text-right">Platform Fee</th>
                  <th className="p-4 font-medium text-right">Creator Net</th>
                  <th className="p-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="p-4">
                      <div className="font-medium text-text-primary">{tx.provider_payment_id ?? tx.id}</div>
                      <div className="text-sm text-text-tertiary">Txn: {tx.id}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-text-secondary">
                        {tx.provider}
                      </span>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={(tx.status as any) ?? "pending"} size="sm" />
                    </td>
                    <td className="p-4 text-right font-semibold text-text-primary">
                      {formatCurrency(tx.amount)} {tx.currency}
                    </td>
                    <td className="p-4 text-right text-text-secondary">{formatCurrency(tx.fee_amount ?? 0)}</td>
                    <td className="p-4 text-right text-text-secondary">{formatCurrency(tx.creator_amount ?? 0)}</td>
                    <td className="p-4 text-right text-sm text-text-tertiary whitespace-nowrap">
                      {formatDate(tx.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!loading && !error && (
        <div className="mt-6 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}
