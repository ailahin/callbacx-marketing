"use client";

/**
 * CALLBACX MARKETING — Admin Platform Settings
 *
 * Platform configuration — Platform Settings tab.
 * View and edit system-wide configuration values.
 */

import * as React from "react";
import { DashboardLayout, ADMIN_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

interface AdminPlatformSettingRow {
  id: string;
  key: string;
  value: string | number | boolean | null;
  type: string;
  is_public: boolean;
  category: string | null;
  description: string | null;
  updated_at: string;
}

const COLUMNS: Column<AdminPlatformSettingRow>[] = [
  { key: "key", label: "Setting Key", sortable: true, width: "200px" },
  { key: "value", label: "Value", sortable: true, width: "200px", render: (v) => String(v ?? "") },
  { key: "type", label: "Type", sortable: true, width: "100px" },
  { key: "is_public", label: "Public", sortable: true, width: "100px", render: (v) => <StatusBadge status={Boolean(v) ? "active" : "suspended"} size="sm" /> },
  { key: "category", label: "Category", sortable: true, width: "120px", render: (v) => String(v || "—") },
  { key: "updated_at", label: "Updated", sortable: true, width: "150px" },
];

const SETTING_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "json", label: "JSON" },
];

export default function AdminPlatformSettingsPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [data, setData] = React.useState<AdminPlatformSettingRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [limit, setLimit] = React.useState(20);
  const [offset, setOffset] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadSettings();
  }, [search, typeFilter, limit, offset]);

  async function loadSettings() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (typeFilter) params.set("type", typeFilter);
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    try {
      const res = await fetch(`/api/admin/platform-settings?${params}`);
      if (!res.ok) throw new Error("Failed to load platform settings");
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateSetting(settingId: string, value: string | number | boolean) {
    const res = await fetch(`/api/admin/platform-settings/${settingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setting_id: settingId, value }),
    });
    if (!res.ok) throw new Error("Failed to update platform setting");
    await loadSettings();
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !hasPermission("admin:platform_settings")) {
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
      title="Platform Settings"
      description="Configure system-wide platform settings."
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
            <Input placeholder="Search settings…" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 sm:w-auto">
            <Select
              options={SETTING_TYPE_OPTIONS}
              value={typeFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}
              placeholder="All types"
            />
            <Button onClick={() => setOffset(0)}>Refresh</Button>
          </div>
        </div>

        <AdminDataTable<AdminPlatformSettingRow>
          columns={COLUMNS}
          data={data}
          total={total}
          limit={limit}
          offset={offset}
          loading={loading}
          emptyMessage="No platform settings found."
          onPageChange={(newOffset, newLimit) => {
            setOffset(newOffset);
            setLimit(newLimit);
          }}
          rowActions={[
            {
              label: "Edit",
              variant: "ghost",
              icon: <span className="h-4 w-4">✎</span>,
              onClick: (row: AdminPlatformSettingRow) => {
                const newValue = prompt(`New value for ${row.key}:`, String(row.value ?? ""));
                if (newValue !== null) {
                  let parsed: string | number | boolean = newValue;
                  if (row.type === "number") parsed = Number(newValue);
                  if (row.type === "boolean") parsed = newValue.toLowerCase() === "true";
                  updateSetting(row.id, parsed);
                }
              },
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
