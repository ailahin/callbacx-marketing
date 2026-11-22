"use client";

/**
 * CALLBACX TECHNOLOGY — Creator Social Accounts
 *
 * Connect Instagram, TikTok and YouTube accounts through authorised OAuth
 * flows, view connection status indicators, and import social analytics
 * from provider APIs.
 *
 * Metrics are never fabricated: they are only written when the connected
 * provider's API returns them. Providers require external credentials and
 * (where the platform demands it) administrator approval before accounts
 * can be connected — see /dashboard/admin/integrations.
 */

import * as React from "react";
import { DashboardLayout, CREATOR_NAV_SECTIONS } from "@/components/dashboard/DashboardLayout";
import { TopBar } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/Button";
import { IntegrationProviderCard } from "@/components/integrations/IntegrationProviderCard";
import { ConnectionStatusBadge } from "@/components/integrations/ConnectionStatusBadge";

export const dynamic = "force-dynamic";

const SOCIAL_PROVIDERS = [
  {
    provider: "instagram",
    label: "Instagram",
    description:
      "Connect an Instagram account via Meta OAuth. Profile + public metrics (where the app has passed Meta App Review).",
  },
  {
    provider: "tiktok",
    label: "TikTok",
    description:
      "Connect a TikTok account via TikTok Login Kit. Business/metrics access depends on your TikTok app's access level.",
  },
  {
    provider: "youtube",
    label: "YouTube",
    description:
      "Connect a YouTube channel via Google OAuth (YouTube Data API v3). Channel statistics are imported read-only.",
  },
] as const;

interface ConnectionRow {
  id: string;
  provider: string;
  status: string;
  platform_username: string | null;
  platform_account_id: string | null;
  last_synced_at: string | null;
  sync_error: string | null;
}

export default function CreatorSocialPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [connections, setConnections] = React.useState<ConnectionRow[]>([]);
  const [providerStatus, setProviderStatus] = React.useState<
    Record<string, { configured: boolean; enabled: boolean }>
  >({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadConnections();
  }, []);

  async function loadConnections() {
    try {
      setLoading(true);
      const [connectionsRes, statusRes] = await Promise.all([
        fetch("/api/integrations/connections"),
        fetch("/api/integrations/readiness"),
      ]);
      if (!connectionsRes.ok) throw new Error("Failed to load connections");
      if (!statusRes.ok) throw new Error("Failed to load provider status");
      const connectionsJson = await connectionsRes.json();
      const statusJson = await statusRes.json();
      setConnections(connectionsJson.data ?? []);
      const statusMap: Record<string, { configured: boolean; enabled: boolean }> = {};
      for (const row of statusJson.data ?? []) {
        statusMap[row.provider] = {
          configured: row.configured,
          enabled: row.enabled,
        };
      }
      setProviderStatus(statusMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function connectProvider(provider: string) {
    try {
      const res = await fetch(`/api/integrations/oauth/authorize?provider=${provider}`);
      if (!res.ok) throw new Error("Failed to start connection");
      const json = await res.json();
      window.location.assign(json.data.authorizationUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start connection");
    }
  }

  async function disconnectConnection(connectionId: string) {
    if (!window.confirm("Disconnect this social account?")) return;
    try {
      const res = await fetch("/api/integrations/connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection_id: connectionId }),
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      await loadConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  }

  async function syncMetrics() {
    try {
      const res = await fetch("/api/integrations/sync", { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      await loadConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !hasPermission("profile:manage_social")) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center p-6">
        <h1 className="text-xl font-semibold text-text-primary">Access Denied</h1>
        <p className="mt-2 text-text-secondary">
          You do not have permission to manage social accounts.
        </p>
      </div>
    );
  }

  const connectedCount = connections.filter((c) => c.status === "connected").length;

  return (
    <DashboardLayout
      navSections={CREATOR_NAV_SECTIONS}
      title="Social Accounts"
      description="Connect Instagram, TikTok and YouTube accounts and import their public metrics."
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
            <p className="font-medium">Failed to load social accounts.</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-text-primary">Social Accounts</h1>
            <p className="text-sm text-text-secondary">
              Import profile and public metrics from connected platforms. Values
              come directly from provider APIs — nothing is fabricated.
            </p>
          </div>
          <div className="flex gap-2 sm:w-auto">
            <Button
              onClick={syncMetrics}
              disabled={loading}
              variant="outline"
            >
              {loading ? "Syncing…" : "Import analytics"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {SOCIAL_PROVIDERS.map((p) => {
            const connection = connections.find((c) => c.provider === p.provider);
            const status = providerStatus[p.provider];
            return (
              <IntegrationProviderCard
                key={p.provider}
                provider={p.provider}
                label={p.label}
                description={p.description}
                configured={status?.configured ?? false}
                enabled={status?.enabled ?? false}
                approvalStatus={null}
                requiresApproval={false}
                connectionStatus={connection?.status ?? null}
                platformUsername={connection?.platform_username ?? null}
                onConnect={() => connectProvider(p.provider)}
                onDisconnect={() => connection && disconnectConnection(connection.id)}
                disabled={loading}
              />
            );
          })}
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface p-6">
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">
            Your connections ({connectedCount} connected)
          </h2>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full mb-3" />
              <p className="text-text-tertiary">Loading connections…</p>
            </div>
          ) : connections.length === 0 ? (
            <p className="text-text-tertiary">No social accounts connected yet. Connect a provider above.</p>
          ) : (
            <div className="space-y-3">
              {connections.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-border-subtle bg-surface-subtle">
                  <div className="flex items-center gap-3">
                    <span className="text-text-secondary">{c.provider}</span>{" "}
                    {c.platform_username && (
                      <span className="text-xs font-mono text-text-tertiary">@{c.platform_username}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <ConnectionStatusBadge
                      status={c.status}
                      providerConfigured={true}
                    />
                    {c.status === "connected" && (
                      <Button size="sm" variant="outline" onClick={() => syncMetrics}>
                        Refresh
                      </Button>
                    )}
                    {c.status !== "connected" && (
                      <Button size="sm" variant="destructive" onClick={() => disconnectConnection(c.id)}>
                        Disconnect
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-info-200 bg-info-50 p-5 text-info-700 text-sm">
          <p className="font-medium mb-1">Provider requirements</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>
              Instagram and TikTok profile/metrics scopes may require the
              platform app to pass provider review before they can be requested.
            </li>
            <li>
              YouTube read-only access is available without app review for
              the authenticated account's own channel.
            </li>
            <li>
              Contact a platform administrator if a provider shows "Not
              configured" or "Not approved".
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
