"use client";

/**
 * CALLBACX MARKETING — IntegrationProviderCard
 *
 * Presentational card for a single integration provider: label, status
 * indicator, connect/disconnect actions, and a note when the provider
 * requires external credentials or platform approval.
 */

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConnectionStatusBadge } from "./ConnectionStatusBadge";

export interface IntegrationProviderCardProps {
  provider: string;
  label: string;
  description?: string | null;
  configured: boolean;
  enabled: boolean;
  approvalStatus: "pending" | "approved" | "rejected" | null;
  requiresApproval: boolean;
  connectionStatus?: string | null;
  platformUsername?: string | null;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onConfigure?: () => void;
  disabled?: boolean;
}

export function IntegrationProviderCard({
  provider,
  label,
  description,
  configured,
  enabled,
  approvalStatus,
  requiresApproval,
  connectionStatus,
  platformUsername,
  onConnect,
  onDisconnect,
  onConfigure,
  disabled = false,
}: IntegrationProviderCardProps) {
  const needsConfiguration = !configured;
  const needsApproval = requiresApproval && approvalStatus !== "approved";
  const canConnect = configured && enabled && !needsApproval;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5 dark:border-neutral-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-text-primary">
            {label}
            {needsApproval ? (
              <Badge variant="outline" size="sm" className="ml-2">
                Approval required
              </Badge>
            ) : null}
          </h3>
          {description && (
            <p className="mt-1 text-xs text-text-secondary">{description}</p>
          )}
          <p className="mt-2 text-xs text-text-tertiary truncate sm:truncate-none">
            Provider:{" "}
            <span className="font-mono text-text-secondary">{provider}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:w-auto">
          <ConnectionStatusBadge
            status={connectionStatus ?? (configured ? "pending" : "pending")}
            providerConfigured={configured}
            size="sm"
          />

          {needsConfiguration && (
            <Button
              size="sm"
              variant="outline"
              onClick={onConfigure}
              disabled={disabled}
            >
              Configure
            </Button>
          )}

          {needsApproval && (
            <Button size="sm" variant="ghost" disabled>
              {approvalStatus === "pending" ? "Pending approval" : "Not approved"}
            </Button>
          )}

          {!configured ? null : connectionStatus === "connected" ? (
            <Button size="sm" variant="destructive" onClick={onDisconnect} disabled={disabled}>
              Disconnect
            </Button>
          ) : canConnect ? (
            <Button size="sm" onClick={onConnect} disabled={disabled}>
              Connect
            </Button>
          ) : (
            <Button size="sm" variant="ghost" disabled>
              Not enabled
            </Button>
          )}
        </div>
      </div>

      {(needsConfiguration || needsApproval) && (
        <div className="mt-4 rounded-lg border border-border-subtle bg-neutral-50 p-3 text-xs text-text-tertiary dark:bg-neutral-900/50 dark:border-neutral-800">
          {needsConfiguration && (
            <p className="mb-1">
              <strong>Not configured.</strong> An administrator must add provider
              credentials in admin integration settings before this provider can
              be used.
            </p>
          )}
          {needsApproval && (
            <p>
              <strong>Provider approval required.</strong>{" "}
              {approvalStatus === "pending"
                ? "Approval is pending with the platform administrator."
                : "This provider has not been approved for use."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
