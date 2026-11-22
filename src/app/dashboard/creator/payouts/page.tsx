"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CREATOR_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/states/Loading";
import { EmptyState, NoResultsState } from "@/components/states/Empty";
import { demoData, isDemoMode } from "@/services/demo-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PayoutStatus } from "@/lib/supabase/types/database";

// ---------------------------------------------------------------------------
// Creator Payouts Page Component
// ---------------------------------------------------------------------------

export default function CreatorPayoutsPage() {
  const { user, loading: authLoading } = useAuth();
  const [payouts, setPayouts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [filters, setFilters] = React.useState({
    search: "",
    status: "",
    sort: "newest",
  });
  const [showAddBankAccount, setShowAddBankAccount] = React.useState(false);
  const [requestingPayout, setRequestingPayout] = React.useState(false);
  const [payoutError, setPayoutError] = React.useState<Error | null>(null);

  const requestPayout = async () => {
    if (!user?.creator_profile_id) return;
    setRequestingPayout(true);
    setPayoutError(null);
    try {
      let available = 0;
      if (isDemoMode) {
        const creatorProfile = demoData.creatorProfile;
        const earned = demoData.paymentTransactions
          .filter((t: any) => t.creator_profile_id === creatorProfile.id && t.status === "succeeded")
          .reduce((sum, t) => sum + (t.creator_amount ?? 0), 0);
        const paidOut = demoData.creatorPayouts
          .filter((p) => p.creator_profile_id === creatorProfile.id && p.status === "paid")
          .reduce((sum, p) => sum + p.amount, 0);
        available = Math.max(0, earned - paidOut);
      }

      if (available <= 0) {
        throw new Error("No available earnings balance to withdraw.");
      }

      const res = await fetch("/api/payments/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator_profile_id: user.creator_profile_id,
          amount: available,
          currency: "USD",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || "Failed to request payout.");
      setPayouts((prev) => [json?.data, ...(prev ?? [])]);
    } catch (err) {
      setPayoutError(err as Error);
    } finally {
      setRequestingPayout(false);
    }
  };

  React.useEffect(() => {
    async function fetchPayouts() {
      if (authLoading) return;

      setLoading(true);
      try {
        if (isDemoMode) {
          const creatorProfile = demoData.creatorProfile;
          let filtered = demoData.creatorPayouts.filter(p => p.creator_profile_id === creatorProfile.id);

          if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(p => {
              const tx = demoData.paymentTransactions.find(t => t.id === p.payment_transaction_id);
              const inv = tx ? demoData.invoices.find(i => i.id === tx.invoice_id) : null;
              const collab = inv ? demoData.collaborations.find(c => c.id === inv.collaboration_id) : null;
              const campaign = collab ? demoData.campaigns.find(c => c.id === collab.campaign_id) : null;
              return p.provider_payout_id?.toLowerCase().includes(search) ||
                campaign?.title?.toLowerCase().includes(search) ||
                tx?.provider_payment_id?.toLowerCase().includes(search);
            });
          }
          if (filters.status) {
            filtered = filtered.filter(p => p.status === filters.status);
          }

          // Enrich with transaction, invoice, collaboration, campaign data
          const enriched = filtered.map(payout => {
            const tx = demoData.paymentTransactions.find(t => t.id === payout.payment_transaction_id);
            const inv = tx ? demoData.invoices.find(i => i.id === tx.invoice_id) : null;
            const collab = inv ? demoData.collaborations.find(c => c.id === inv.collaboration_id) : null;
            const campaign = collab ? demoData.campaigns.find(c => c.id === collab.campaign_id) : null;
            const brand = demoData.brand;
            return {
              ...payout,
              transaction: tx,
              invoice: inv,
              collaboration: collab,
              campaign: campaign ? { ...campaign, brand: { name: brand.name } } : null,
            };
          });

          // Sort
          enriched.sort((a, b) => {
            switch (filters.sort) {
              case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              case "amount_desc": return b.amount - a.amount;
              case "amount_asc": return a.amount - b.amount;
              default: return 0;
            }
          });

          setPayouts(enriched);
        } else {
          setPayouts([]);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchPayouts();
  }, [authLoading, user?.id, filters]);

  const stats = React.useMemo(() => {
    const total = payouts.reduce((sum, p) => sum + p.amount, 0);
    const paid = payouts.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
    const pending = payouts.filter(p => p.status === "pending" || p.status === "processing").reduce((sum, p) => sum + p.amount, 0);
    const failed = payouts.filter(p => p.status === "failed").reduce((sum, p) => sum + p.amount, 0);
    const thisMonth = payouts.filter(p => {
      const created = new Date(p.paid_at || p.created_at);
      const now = new Date();
      return p.status === "paid" && created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).reduce((sum, p) => sum + p.amount, 0);

    return { total, paid, pending, failed, thisMonth };
  }, [payouts]);

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
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !user.creator_profile_id) {
    return (
      <DashboardLayout
        navSections={CREATOR_NAV_SECTIONS}
        title="Payouts"
        user={user ? { name: user.full_name || user.email, email: user.email, avatar: user.avatar_url ?? undefined, role: user.role } : null}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Complete your creator profile first</h2>
          <p className="text-text-secondary mb-4">You need a creator profile to view payouts.</p>
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
      title="Payouts"
      description="Track and manage your payouts from brand collaborations"
      user={user ? { name: user.full_name || user.email, email: user.email, avatar: user.avatar_url ?? undefined, role: user.role } : null}
    >
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Paid Out</p>
              <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.total)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
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
              <p className="text-sm text-text-secondary">Completed</p>
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
              <p className="text-sm text-text-secondary">Processing</p>
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
              <p className="text-sm text-text-secondary">Failed</p>
              <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.failed)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-error-100 dark:bg-error-900/30 flex items-center justify-center text-error-600 dark:text-error-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Request Payout */}
      {payoutError && (
        <Card variant="outlined" padding="md" className="mb-6">
          <div className="p-4 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700">{payoutError.message}</div>
        </Card>
      )}

      <div className="mb-6">
        <Button variant="primary" onClick={requestPayout} loading={requestingPayout}>
          Request Payout
        </Button>
      </div>

      {/* Bank Account Section */}
      <Card variant="outlined" className="mb-6">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold">Bank Account</h3>
          <Button variant="outline" size="sm" onClick={() => setShowAddBankAccount(true)}>
            {demoData.creatorProfile ? "Update Details" : "Add Bank Account"}
          </Button>
        </CardHeader>
        <CardContent>
          {demoData.creatorProfile ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                <p className="text-sm text-text-tertiary">Account Holder</p>
                <p className="font-medium text-text-primary">{demoData.creatorProfile.display_name}</p>
              </div>
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                <p className="text-sm text-text-tertiary">Bank</p>
                <p className="font-medium text-text-primary">Chase Bank •••• 1234</p>
              </div>
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                <p className="text-sm text-text-tertiary">Status</p>
                <Badge variant="success">Verified</Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="h-12 w-12 mx-auto mb-4 text-text-tertiary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <h4 className="text-lg font-medium text-text-secondary mb-1">No bank account connected</h4>
              <p className="text-text-tertiary mb-4">Add your bank account details to receive payouts from collaborations.</p>
              <Button onClick={() => setShowAddBankAccount(true)}>Add Bank Account</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card variant="outlined" padding="md" className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search payouts..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              }
            />
          </div>
          <div className="flex flex-wrap gap-3 flex-1 lg:flex-nowrap">
            <Select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              options={[
                { value: "", label: "All Statuses" },
                { value: "paid", label: "Paid" },
                { value: "pending", label: "Pending" },
                { value: "processing", label: "Processing" },
                { value: "failed", label: "Failed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
              className="w-48"
            />
            <Select
              value={filters.sort}
              onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
              options={[
                { value: "newest", label: "Newest First" },
                { value: "oldest", label: "Oldest First" },
                { value: "amount_desc", label: "Amount: High to Low" },
                { value: "amount_asc", label: "Amount: Low to High" },
              ]}
              className="w-48"
            />
          </div>
        </div>
      </Card>

      {/* Payouts Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} showAvatar={false} lines={1} />)}
        </div>
      ) : payouts.length === 0 ? (
        <Card variant="outlined" padding="lg">
          <NoResultsState
            title={filters.search || filters.status ? "No payouts found" : "No payouts yet"}
            description={filters.search || filters.status
              ? "Try adjusting your search or filter criteria."
              : "Completed collaborations will generate payouts once invoices are paid."}
            action={filters.search || filters.status ? {
              label: "Clear Filters",
              onClick: () => setFilters({ search: "", status: "", sort: "newest" }),
              variant: "outline"
            } : undefined}
          />
        </Card>
      ) : (
        <Card variant="outlined">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-text-tertiary border-b border-border-subtle">
                  <th className="p-4 font-medium">Campaign</th>
                  <th className="p-4 font-medium">Brand</th>
                  <th className="p-4 font-medium">Invoice</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Paid Date</th>
                  <th className="p-4 font-medium">Provider</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="p-4">
                      <div className="font-medium text-text-primary">{payout.campaign?.title || "Unknown Campaign"}</div>
                      <div className="text-sm text-text-tertiary">Collab: {payout.collaboration?.id?.slice(0, 8)}</div>
                    </td>
                    <td className="p-4 text-text-secondary">{payout.campaign?.brand?.name || "Unknown Brand"}</td>
                    <td className="p-4">
                      <div className="font-medium text-text-primary">{payout.invoice?.invoice_number || "N/A"}</div>
                      <div className="text-sm text-text-tertiary">Tx: {payout.transaction?.provider_payment_id?.slice(0, 12)}</div>
                    </td>
                    <td className="p-4 text-right font-semibold text-text-primary">
                      {formatCurrency(payout.amount)} {payout.currency}
                    </td>
                    <td className="p-4">
                      <Badge variant={getStatusVariant(payout.status)}>
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="p-4 text-right text-sm text-text-tertiary whitespace-nowrap">
                      {payout.paid_at ? formatDate(payout.paid_at) : "—"}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-text-secondary">
                        {payout.transaction?.provider || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Bank Account Modal */}
      {showAddBankAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowAddBankAccount(false)}>
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Add Bank Account</h3>
              <button onClick={() => setShowAddBankAccount(false)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setShowAddBankAccount(false); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Account Holder Name</label>
                  <Input defaultValue={demoData.creatorProfile?.display_name || ""} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Bank Name</label>
                  <Input placeholder="e.g., Chase Bank" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Account Type</label>
                  <select className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Routing Number</label>
                    <Input placeholder="9 digits" maxLength={9} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Account Number</label>
                    <Input placeholder="Account number" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Confirm Account Number</label>
                  <Input placeholder="Re-enter account number" required />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="secondary" className="flex-1" onClick={() => setShowAddBankAccount(false)}>Cancel</Button>
                <Button variant="primary" className="flex-1" type="submit">Save Bank Account</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function getStatusVariant(status: PayoutStatus) {
  switch (status) {
    case "paid": return "success";
    case "pending": return "warning";
    case "failed": return "error";
    case "cancelled": return "default";
    default: return "default";
  }
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}