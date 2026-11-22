"use client";

/**
 * CALLBACX MARKETING — Admin Users & Role Management
 *
 * User and role management for platform admins.
 * Responsive: stacked cards on mobile, full table on desktop.
 */

import * as React from "react";
import { DashboardLayout, ADMIN_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

interface AdminUserRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  status: string;
  brand_id: string | null;
  creator_profile_id: string | null;
  last_active_at: string | null;
  created_at: string;
  permissions: string[];
}

const COLUMNS: Column<AdminUserRow>[] = [
  { key: "full_name", label: "Name", sortable: true, width: "200px" },
  { key: "email", label: "Email", sortable: true, width: "240px" },
  { key: "role", label: "Role", sortable: true, width: "140px", render: (v) => <StatusBadge status={String(v)} size="sm" /> },
  { key: "status", label: "Status", sortable: true, width: "120px", render: (v) => <StatusBadge status={String(v)} size="sm" /> },
  { key: "last_active_at", label: "Last Active", sortable: true, width: "160px" },
  { key: "created_at", label: "Joined", sortable: true, width: "160px" },
];

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "platform_admin", label: "Platform Admin" },
  { value: "staff", label: "Staff" },
  { value: "moderator", label: "Moderator" },
  { value: "brand_owner", label: "Brand Owner" },
  { value: "brand_admin", label: "Brand Admin" },
  { value: "brand_member", label: "Brand Member" },
  { value: "brand_finance", label: "Brand Finance" },
  { value: "brand_viewer", label: "Brand Viewer" },
  { value: "creator", label: "Creator" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All status" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "banned", label: "Banned" },
  { value: "deleted", label: "Deleted" },
];

export default function AdminUsersPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [data, setData] = React.useState<AdminUserRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [limit, setLimit] = React.useState(20);
  const [offset, setOffset] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadUsers();
  }, [search, roleFilter, statusFilter, limit, offset]);

  async function loadUsers() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("status", statusFilter);
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to load users");
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(userId: string, updates: { role?: string; status?: string }) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update user");
    await loadUsers();
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !hasPermission("admin:users")) {
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
      title="Users & Role Management"
      description="Manage platform users, roles, and account status."
      user={{
        name: userDisplayName,
        email: user.email,
        avatar: user.avatar_url,
        role: user.role,
      }}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex-1 sm:w-auto">
            <Input placeholder="Search users…" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 sm:w-auto">
            <Select
              options={ROLE_OPTIONS}
              value={roleFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value)}
              placeholder="All roles"
            />
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              placeholder="All status"
            />
            <Button onClick={() => setOffset(0)}>Refresh</Button>
          </div>
        </div>

        <AdminDataTable<AdminUserRow>
          columns={COLUMNS}
          data={data}
          total={total}
          limit={limit}
          offset={offset}
          loading={loading}
          emptyMessage="No users found."
          onPageChange={(newOffset, newLimit) => {
            setOffset(newOffset);
            setLimit(newLimit);
          }}
          rowActions={[
            {
              label: "Edit Role",
              variant: "outline",
              icon: <span className="h-4 w-4">👤</span>,
              onClick: (row) => {
                const newRole = prompt(`Change role for ${row.email} (current: ${row.role}):`, row.role);
                if (newRole) updateUser(row.id, { role: newRole });
              },
            },
            {
              label: "Suspend",
              variant: "destructive",
              icon: <span className="h-4 w-4">⏸️</span>,
              onClick: (row) => {
                if (confirm(`Suspend ${row.email}?`)) updateUser(row.id, { status: "suspended" });
              },
            },
            {
              label: "Activate",
              variant: "success",
              icon: <span className="h-4 w-4">▶️</span>,
              onClick: (row) => {
                if (confirm(`Activate ${row.email}?`)) updateUser(row.id, { status: "active" });
              },
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
