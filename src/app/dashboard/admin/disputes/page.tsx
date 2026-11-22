"use client";

/**
 * CALLBACX MARKETING — Admin Dispute Management
 *
 * Dispute and support management — Disputes tab.
 * Review, resolve, or close disputes between brands and creators.
 */

import * as React from "react";
import { DashboardLayout, ADMIN_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

interface AdminDisputeRow {
  id: string;
  collaboration_id: string;
  campaign_title: string | null;
  opened_by_name: string | null;
  status: string;
  reason: string;
  resolution: string | null;
  resolved_by_name: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

const COLUMNS: Column<AdminDisputeRow>[] = [
  { key: "campaign_title", label: "Campaign", sortable: true, width: "180px" },
  { key: "opened_by_name", label: "Opened By", sortable: true, width: "160px" },
  { key: "status", label: "Status", sortable: true, width: "120px", render: (v) => <StatusBadge status={String(v)} size="sm" /> },
  { key: "reason", label: "Reason", sortable: true, width: "300px", render: (v) => String(v || "").slice(0, 80) + (String(v || "").length > 80 ? "…" : "") },
  { key: "resolution", label: "Resolution", sortable: false, width: "200px", render: (v) => String(v || "—").slice(0, 80) + (String(v || "").length > 80 ? "…" : "") },
  { key: "created_at", label: "Opened", sortable: true, width: "150px" },
];

const DISPUTE_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "in_review", label: "In Review" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export default function AdminDisputesPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [data, setData] = React.useState<AdminDisputeRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [limit, setLimit] = React.useState(20);
  const [offset, setOffset] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadDisputes();
  }, [search, statusFilter, limit, offset]);

  async function loadDisputes() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    try {
      const res = await fetch(`/api/admin/disputes?${params}`);
      if (!res.ok) throw new Error("Failed to load disputes");
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function resolveDispute(disputeId: string, status: "resolved" | "closed", resolution?: string) {
    const res = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dispute_id: disputeId, status, resolution }),
    });
    if (!res.ok) throw new Error("Failed to resolve dispute");
    await loadDisputes();
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !hasPermission("admin:moderation")) {
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
      title="Dispute Management"
      description="Review and resolve platform disputes."
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
            <Input placeholder="Search disputes…" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 sm:w-auto">
            <Select
              options={DISPUTE_STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              placeholder="All statuses"
            />
            <Button onClick={() => setOffset(0)}>Refresh</Button>
          </div>
        </div>

        <AdminDataTable<AdminDisputeRow>
          columns={COLUMNS}
          data={data}
          total={total}
          limit={limit}
          offset={offset}
          loading={loading}
          emptyMessage="No disputes found."
          onPageChange={(newOffset, newLimit) => {
            setOffset(newOffset);
            setLimit(newLimit);
          }}
          rowActions={[
            {
              label: "Resolve",
              variant: "primary",
              icon: <span className="h-4 w-4">✓</span>,
              disabled: (row: AdminDisputeRow) => row.status === "resolved" || row.status === "closed",
              onClick: (row: AdminDisputeRow) => {
                const resolution = prompt(`Resolution for dispute ${row.id}:`);
                if (resolution) resolveDispute(row.id, "resolved", resolution);
              },
            },
            {
              label: "Close",
              variant: "ghost",
              icon: <span className="h-4 w-4">✕</span>,
              disabled: (row: AdminDisputeRow) => row.status === "closed",
              onClick: (row: AdminDisputeRow) => {
                if (confirm(`Close dispute ${row.id}?`)) resolveDispute(row.id, "closed");
              },
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
