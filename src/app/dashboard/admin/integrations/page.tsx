"use client";

/**
 * CALLBACX MARKETING — Admin Integration Settings
 *
 * Platform-wide configuration of external integration providers.
 * Platform administrators can enable/disable providers, approve or reject
 * providers that require platform approval, and store provider credentials
 * (API keys, client secrets, webhook signing secrets) encrypted in the
 * credentials vault.
 *
 * Credentials are never returned to the client and are never displayed
 * in plaintext after being set.
 */

import * as React from "react";
import { DashboardLayout, ADMIN_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { TopBar } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConnectionStatusBadge } from "@/components/integrations/ConnectionStatusBadge";

export const dynamic = "force-dynamic";

interface ProviderReadiness {
  provider: string;
  configured: boolean;
  enabled: boolean;
  approvalStatus: string | null;
  requiresApproval: boolean;
  missing: string[];
}

interface CredentialRow {
  provider: string;
  credential_key: string;
  created_at: string;
}

interface SettingRow extends ProviderReadiness {
  label: string;
  description: string | null;
  config: Record<string, unknown>;
}

export default function AdminIntegrationsPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [settings, setSettings] = React.useState<SettingRow[]>([]);
  const [credentials, setCredentials] = React.useState<CredentialRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [credentialForm, setCredentialForm] = React.useState<{
    provider: string | null;
    key: string;
    value: string;
  }>({ provider: null, key: "", value: "" });

  React.useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const [settingsRes, credentialsRes] = await Promise.all([
        fetch("/api/integrations/readiness"),
        fetch("/api/integrations/settings"),
      ]);
      if (!settingsRes.ok) throw new Error("Failed to load integration settings");
      if (!credentialsRes.ok) throw new Error("Failed to load credentials");
      const settingsJson = await settingsRes.json();
      const credentialsJson = await credentialsRes.json();
      setSettings(settingsJson.data ?? []);
      setCredentials(credentialsJson.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function updateSetting(provider: string, patch: Record<string, unknown>) {
    setSaving(provider);
    try {
      const res = await fetch(`/api/integrations/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, ...patch }),
      });
      if (!res.ok) throw new Error("Failed to update setting");
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update setting");
    } finally {
      setSaving(null);
    }
  }

  async function setCredential() {
    if (!credentialForm.provider) return;
    setSaving(credentialForm.provider);
    try {
      const res = await fetch("/api/integrations/settings/credential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: credentialForm.provider,
          credential_key: credentialForm.key,
          value: credentialForm.value,
        }),
      });
      if (!res.ok) throw new Error("Failed to store credential");
      setCredentialForm({ provider: null, key: "", value: "" });
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to store credential");
    } finally {
      setSaving(null);
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !hasPermission("admin:settings")) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center p-6">
        <h1 className="text-xl font-semibold text-text-primary">Access Denied</h1>
        <p className="mt-2 text-text-secondary">
          Platform administrator access is required to manage integrations.
        </p>
      </div>
    );
  }

  return (
    <DashboardLayout
      navSections={ADMIN_NAV_SECTIONS}
      title="Integration Settings"
      description="Configure external providers (email, payments, social, storage, webhooks)."
      user={{
        name: user.full_name || user.email,
        email: user.email,
        avatar: user.avatar_url ?? undefined,
        role: user.role,
      }}
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-error-700">
            <p className="font-medium">Failed to load integration settings.</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        <div className="rounded-xl border border-border-subtle bg-surface p-6">
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">
            Providers
          </h2>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full mb-3" />
              <p className="text-text-tertiary">Loading providers…</p>
            </div>
          ) : (
            <div className="space-y-4">
              {settings.map((s) => {
                const providerCreds = credentials.filter((c) => c.provider === s.provider);
                return (
                  <div
                    key={s.provider}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border border-border-subtle bg-surface-subtle"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 text-text-tertiary text-sm">
                        {s.provider}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">{s.label}</p>
                        {s.description && (
                          <p className="text-xs text-text-secondary">{s.description}</p>
                        )}
                        {s.missing.length > 0 && (
                          <p className="mt-1 text-xs text-error-700">
                            {s.missing.join(" ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:w-auto">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-text-tertiary">Status</span>
                        <StatusBadge
                          status={s.enabled ? "active" : "suspended"}
                          size="sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-text-tertiary">Approval</span>
                        <StatusBadge
                          status={s.approvalStatus ?? "pending"}
                          size="sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-text-tertiary">Connection</span>
                        <ConnectionStatusBadge
                          status={s.configured ? "connected" : "pending"}
                          providerConfigured={s.configured}
                          size="sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:w-auto">
                      <Select
                        options={[
                          { value: "true", label: "Enabled" },
                          { value: "false", label: "Disabled" },
                        ]}
                        value={s.enabled ? "true" : "false"}
                        onChange={(e) => {
                          updateSetting(s.provider, {
                            is_enabled: e.target.value === "true",
                          });
                        }}
                      />
                      {s.requiresApproval && (
                        <Select
                          options={[
                            { value: "pending", label: "Pending" },
                            { value: "approved", label: "Approved" },
                            { value: "rejected", label: "Rejected" },
                          ]}
                          value={s.approvalStatus ?? "pending"}
                          onChange={(e) =>
                            updateSetting(s.provider, {
                              approval_status: e.target.value as "pending" | "approved" | "rejected",
                            })
                          }
                        />
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCredentialForm({ provider: s.provider, key: "", value: "" })}
                        disabled={saving === s.provider}
                      >
                        Set credential
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-tertiary sm:ml-auto">
                      {providerCreds.length > 0
                        ? providerCreds.map((c) => (
                            <span key={c.credential_key} className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                              {c.credential_key} ••••••••
                            </span>
                          ))
                        : <span>No credentials</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {credentialForm.provider && (
          <div className="rounded-xl border border-border-subtle bg-surface p-6">
            <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">
              Set credential — {credentialForm.provider}
            </h2>
            <p className="text-xs text-text-secondary mb-4">
              The value is encrypted (AES-256-GCM) before storage and is never
              returned in API responses. Examples: "api_key", "client_secret",
              "webhook_signing_secret".
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Credential key"
                value={credentialForm.key}
                onChange={(e) => setCredentialForm({ ...credentialForm, key: e.target.value })}
                placeholder="e.g. api_key"
              />
              <Input
                label="Credential value"
                type="password"
                value={credentialForm.value}
                onChange={(e) => setCredentialForm({ ...credentialForm, value: e.target.value })}
                placeholder="••••••••"
              />
              <div className="flex items-end">
                <Button
                  onClick={() => setCredentialForm({ provider: null, key: "", value: "" })}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button onClick={setCredential} disabled={saving === credentialForm.provider}>
                  {saving === credentialForm.provider ? "Storing…" : "Store encrypted"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-info-200 bg-info-50 p-5 text-info-700 text-sm">
          <p className="font-medium mb-1">How providers become usable</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>
              Add credentials above, enable the provider, and — where the
              provider requires it — set approval to "Approved".
            </li>
            <li>
              Social providers additionally need an administrator-approved app
              on the platform side (Meta, TikTok, Google) before users can
              connect accounts.
            </li>
            <li>
              Credentials are encrypted at rest (AES-256-GCM, server-side
              INTEGRATION_VAULT_KEY). Rotate the vault key only when you can
              re-encrypt all stored credentials.
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
