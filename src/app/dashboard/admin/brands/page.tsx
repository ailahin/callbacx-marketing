"use client";

/**
 * CALLBACX MARKETING — Admin Brand Verification
 *
 * Brand and creator verification — Brands tab.
 * Review, verify, or reject brand verification requests.
 */

import * as React from "react";
import { DashboardLayout, ADMIN_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

interface AdminBrandRow {
  id: string;
  name: string;
  legal_name: string | null;
  contact_email: string | null;
  website_url: string | null;
  verification_status: string;
  is_active: boolean;
  owner_id: string;
  owner_name: string | null;
  member_count: number;
  campaign_count: number;
  created_at: string;
}

const COLUMNS: Column<AdminBrandRow>[] = [
  { key: "name", label: "Brand Name", sortable: true, width: "200px" },
  { key: "owner_name", label: "Owner", sortable: true, width: "160px" },
  { key: "contact_email", label: "Contact Email", sortable: true, width: "200px" },
  { key: "verification_status", label: "Verification", sortable: true, width: "140px", render: (v) => <StatusBadge status={String(v)} size="sm" /> },
  { key: "is_active", label: "Active", sortable: true, width: "100px", render: (v) => <StatusBadge status={Boolean(v) ? "active" : "suspended"} size="sm" /> },
  { key: "created_at", label: "Created", sortable: true, width: "150px" },
];

const VERIFICATION_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

export default function AdminBrandsPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [data, setData] = React.useState<AdminBrandRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [limit, setLimit] = React.useState(20);
  const [offset, setOffset] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadBrands();
  }, [search, statusFilter, limit, offset]);

  async function loadBrands() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("verification_status", statusFilter);
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    try {
      const res = await fetch(`/api/admin/brands?${params}`);
      if (!res.ok) throw new Error("Failed to load brands");
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function verifyBrand(brandId: string, status: "verified" | "rejected" | "pending", reason?: string) {
    const res = await fetch("/api/admin/brands/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand_id: brandId, status, reason }),
    });
    if (!res.ok) throw new Error("Failed to verify brand");
    await loadBrands();
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !hasPermission("admin:brands")) {
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
      title="Brand Verification"
      description="Review and verify brand accounts."
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
            <Input placeholder="Search brands…" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
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

        <AdminDataTable<AdminBrandRow>
          columns={COLUMNS}
          data={data}
          total={total}
          limit={limit}
          offset={offset}
          loading={loading}
          emptyMessage="No brands found."
          onPageChange={(newOffset, newLimit) => {
            setOffset(newOffset);
            setLimit(newLimit);
          }}
          rowActions={[
            {
              label: "Verify",
              variant: "primary",
              icon: <span className="h-4 w-4">✓</span>,
              disabled: (row: AdminBrandRow) => row.verification_status === "verified",
              onClick: (row: AdminBrandRow) => {
                const reason = prompt(`Verification note for ${row.name}:`);
                verifyBrand(row.id, "verified", reason ?? undefined);
              },
            },
            {
              label: "Reject",
              variant: "destructive",
              icon: <span className="h-4 w-4">✗</span>,
              disabled: (row: AdminBrandRow) => row.verification_status === "rejected",
              onClick: (row: AdminBrandRow) => {
                const reason = prompt(`Rejection reason for ${row.name}:`);
                if (reason) verifyBrand(row.id, "rejected", reason);
              },
            },
            {
              label: "Reset to Pending",
              variant: "ghost",
              icon: <span className="h-4 w-4">↻</span>,
              onClick: (row: AdminBrandRow) => {
                if (confirm(`Reset ${row.name} verification to pending?`)) verifyBrand(row.id, "pending");
              },
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
