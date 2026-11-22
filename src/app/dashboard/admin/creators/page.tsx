"use client";

/**
 * CALLBACX TECHNOLOGY — Admin Creator Verification
 *
 * Brand and creator verification — Creators tab.
 * Review, verify, or reject creator verification requests.
 */

import * as React from "react";
import { DashboardLayout, ADMIN_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

interface AdminCreatorRow {
  id: string;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  verification_status: string;
  is_public: boolean;
  profile_id: string;
  creator_name: string | null;
  email: string | null;
  follower_count: number | null;
  collaboration_count: number;
  created_at: string;
}

const COLUMNS: Column<AdminCreatorRow>[] = [
  { key: "display_name", label: "Display Name", sortable: true, width: "180px" },
  { key: "creator_name", label: "Account Name", sortable: true, width: "160px" },
  { key: "email", label: "Email", sortable: true, width: "200px" },
  { key: "verification_status", label: "Verification", sortable: true, width: "140px", render: (v) => <StatusBadge status={String(v)} size="sm" /> },
  { key: "is_public", label: "Public", sortable: true, width: "100px", render: (v) => <StatusBadge status={Boolean(v) ? "active" : "suspended"} size="sm" /> },
  { key: "created_at", label: "Created", sortable: true, width: "150px" },
];

const VERIFICATION_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

export default function AdminCreatorsPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [data, setData] = React.useState<AdminCreatorRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [limit, setLimit] = React.useState(20);
  const [offset, setOffset] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadCreators();
  }, [search, statusFilter, limit, offset]);

  async function loadCreators() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("verification_status", statusFilter);
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    try {
      const res = await fetch(`/api/admin/creators?${params}`);
      if (!res.ok) throw new Error("Failed to load creators");
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCreator(creatorId: string, status: "verified" | "rejected" | "pending", reason?: string) {
    const res = await fetch("/api/admin/creators/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creator_profile_id: creatorId, status, reason }),
    });
    if (!res.ok) throw new Error("Failed to verify creator");
    await loadCreators();
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !hasPermission("admin:creators")) {
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
      title="Creator Verification"
      description="Review and verify creator profiles."
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
            <Input placeholder="Search creators…" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 sm:w-auto">
            <Select
              options={VERIFICATION_OPTIONS}
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              placeholder="All statuses"
            />
            <Button onClick={() => setOffset(0)}>Refresh</Button>
          </div>
        </div>

        <AdminDataTable<AdminCreatorRow>
          columns={COLUMNS}
          data={data}
          total={total}
          limit={limit}
          offset={offset}
          loading={loading}
          emptyMessage="No creators found."
          onPageChange={(newOffset, newLimit) => {
            setOffset(newOffset);
            setLimit(newLimit);
          }}
          rowActions={[
            {
              label: "Verify",
              variant: "primary",
              icon: <span className="h-4 w-4">✓</span>,
              disabled: (row: AdminCreatorRow) => row.verification_status === "verified",
              onClick: (row: AdminCreatorRow) => {
                const reason = prompt(`Verification note for ${row.display_name}:`);
                verifyCreator(row.id, "verified", reason ?? undefined);
              },
            },
            {
              label: "Reject",
              variant: "destructive",
              icon: <span className="h-4 w-4">✗</span>,
              disabled: (row: AdminCreatorRow) => row.verification_status === "rejected",
              onClick: (row: AdminCreatorRow) => {
                const reason = prompt(`Rejection reason for ${row.display_name}:`);
                if (reason) verifyCreator(row.id, "rejected", reason);
              },
            },
            {
              label: "Reset to Pending",
              variant: "ghost",
              icon: <span className="h-4 w-4">↻</span>,
              onClick: (row: AdminCreatorRow) => {
                if (confirm(`Reset ${row.display_name} verification to pending?`)) verifyCreator(row.id, "pending");
              },
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
