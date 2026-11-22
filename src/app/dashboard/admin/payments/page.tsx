"use client";

/**
 * CALLBACX MARKETING — Admin Payments & Transaction Monitoring
 *
 * Monitor all payment transactions across the platform.
 */

import * as React from "react";
import { DashboardLayout, ADMIN_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

interface AdminPaymentRow {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  collaboration_id: string | null;
  invoice_id: string | null;
  fee_amount: number;
  creator_amount: number;
  created_at: string;
}

const COLUMNS: Column<AdminPaymentRow>[] = [
  { key: "amount", label: "Amount", sortable: true, width: "120px", render: (v) => `${String(v)}` },
  { key: "currency", label: "Currency", sortable: true, width: "80px" },
  { key: "status", label: "Status", sortable: true, width: "120px", render: (v) => <StatusBadge status={String(v)} size="sm" /> },
  { key: "provider", label: "Provider", sortable: true, width: "120px" },
  { key: "fee_amount", label: "Platform Fee", sortable: true, width: "120px", render: (v) => `$${Number(v || 0).toLocaleString()}` },
  { key: "creator_amount", label: "Creator Amount", sortable: true, width: "140px", render: (v) => `$${Number(v || 0).toLocaleString()}` },
  { key: "created_at", label: "Created", sortable: true, width: "150px" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "succeeded", label: "Succeeded" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
  { value: "partially_refunded", label: "Partially Refunded" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminPaymentsPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [data, setData] = React.useState<AdminPaymentRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [limit, setLimit] = React.useState(20);
  const [offset, setOffset] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<any>(null);

  async function loadStats() {
    try {
      const res = await fetch("/api/admin/payments/dashboard");
      if (!res.ok) throw new Error("Failed to load financial dashboard");
      const json = await res.json();
      setStats(json?.data ?? null);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadPayments() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    try {
      const res = await fetch(`/api/admin/payments?${params}`);
      if (!res.ok) throw new Error("Failed to load payments");
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
    } catch (err) {
      console.error(err);
      } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadPayments();
  }, [search, statusFilter, limit, offset]);

  React.useEffect(() => {
    loadStats();
  }, []);

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

  const userDisplayName = user.full_name || user.email;
  const totalVolume = data.reduce((sum, p) => sum + (p.amount || 0), 0);
  const netRevenue = stats?.net_revenue ?? 0;
  const totalFees = stats?.total_fees ?? 0;
  const totalRefunds = stats?.total_refunds ?? 0;
  const creatorPayoutsPaid = stats?.creator_payouts_paid ?? 0;

  return (
    <DashboardLayout
      navSections={ADMIN_NAV_SECTIONS}
      title="Payments & Transactions"
      description="Monitor all platform payment transactions."
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
            <Input placeholder="Search transactions…" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 sm:w-auto">
            <Select
              options={PAYMENT_STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              placeholder="All statuses"
            />
            <Button onClick={() => setOffset(0)}>Refresh</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
          <div className="bg-surface p-4 rounded-lg border border-border-subtle">
            <p className="text-xs text-text-tertiary">Gross Volume</p>
            <p className="text-lg font-bold text-text-primary">${totalVolume.toLocaleString()}</p>
          </div>
          <div className="bg-surface p-4 rounded-lg border border-border-subtle">
            <p className="text-xs text-text-tertiary">Net Revenue</p>
            <p className="text-lg font-bold text-text-primary">${Number(netRevenue || 0).toLocaleString()}</p>
          </div>
          <div className="bg-surface p-4 rounded-lg border border-border-subtle">
            <p className="text-xs text-text-tertiary">Platform Fees</p>
            <p className="text-lg font-bold text-text-primary">${Number(totalFees || 0).toLocaleString()}</p>
          </div>
          <div className="bg-surface p-4 rounded-lg border border-border-subtle">
            <p className="text-xs text-text-tertiary">Creator Payouts Paid</p>
            <p className="text-lg font-bold text-text-primary">${Number(creatorPayoutsPaid || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border-subtle">
          <p className="text-xs text-text-tertiary">Total Refunds</p>
          <p className="text-lg font-bold text-text-primary">${Number(totalRefunds || 0).toLocaleString()}</p>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border-subtle flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Reconciliation Report</p>
            <p className="text-xs text-text-tertiary">
              Compare provider-confirmed transactions vs refunds and payouts.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = "/dashboard/admin/payments/reconciliation";
            }}
          >
            View Reconciliation
          </Button>
        </div>

        <AdminDataTable
          columns={COLUMNS}
          data={data}
          total={total}
          limit={limit}
          offset={offset}
          loading={loading}
          emptyMessage="No payments found."
          onPageChange={(newOffset, newLimit) => {
            setOffset(newOffset);
            setLimit(newLimit);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
