/**
 * CALLBACX MARKETING — Integration types
 *
 * Shared types for the external integration layer:
 * providers, connection status, settings, connections, sync results.
 */

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

export const INTEGRATION_PROVIDERS = {
  resend: "resend",
  stripe: "stripe",
  instagram: "instagram",
  tiktok: "tiktok",
  youtube: "youtube",
  supabaseStorage: "supabase_storage",
  webhook: "webhook",
} as const;

export type IntegrationProvider =
  | "resend"
  | "stripe"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "supabase_storage"
  | "webhook";

export const SOCIAL_PROVIDERS: IntegrationProvider[] = ["instagram", "tiktok", "youtube"];

/**
 * Providers that cannot be used until the admin has supplied credentials
 * AND (where required) the provider has approved the app.
 */
export const PROVIDERS_REQUIRING_CREDENTIALS: IntegrationProvider[] = [
  "resend",
  "stripe",
  "instagram",
  "tiktok",
  "youtube",
];

// ---------------------------------------------------------------------------
// Connection status
// ---------------------------------------------------------------------------

export type IntegrationConnectionStatus =
  | "pending"
  | "connected"
  | "expired"
  | "revoked"
  | "error"
  | "disconnected";

export const CONNECTION_STATUS_LABELS: Record<IntegrationConnectionStatus, string> = {
  pending: "Pending",
  connected: "Connected",
  expired: "Token expired",
  revoked: "Revoked",
  error: "Error",
  disconnected: "Disconnected",
};

export function isConnectionActive(status: IntegrationConnectionStatus): boolean {
  return status === "connected";
}

// ---------------------------------------------------------------------------
// Sync / action statuses used in integration_sync_logs
// ---------------------------------------------------------------------------

export type IntegrationActionStatus = "ok" | "rate_limited" | "failed" | "retrying";

// ---------------------------------------------------------------------------
// Social metrics (never fabricated — values come straight from provider APIs)
// ---------------------------------------------------------------------------

export interface SocialAccountProfile {
  platformAccountId: string;
  username: string;
  name?: string | null;
  profileUrl?: string | null;
  profilePictureUrl?: string | null;
  isVerified?: boolean | null;
}

export interface SocialMetrics {
  followersCount?: number | null;
  followingCount?: number | null;
  postsCount?: number | null;
  engagementRate?: number | null;
  impressions?: number | null;
  reach?: number | null;
  videoViews?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  clicks?: number | null;
  conversions?: number | null;
  revenue?: number | null;
  /** UTC date the metrics describe (default: today). */
  metricDate?: string;
}

export interface SyncResult {
  action: string;
  status: IntegrationActionStatus;
  recordsSynced: number;
  retryAfterSeconds?: number;
  errorCode?: string;
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Errors thrown by integration services
// ---------------------------------------------------------------------------

export class IntegrationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly provider?: IntegrationProvider | string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "IntegrationError";
  }
}

export class IntegrationNotConfiguredError extends IntegrationError {
  constructor(provider: IntegrationProvider | string, detail?: string) {
    super(
      "INTEGRATION_NOT_CONFIGURED",
      `${provider} integration is not configured. ${detail ?? "Ask an administrator to set up credentials and approve the provider."}`,
      403,
      provider,
    );
  }
}

export class IntegrationRateLimitedError extends IntegrationError {
  constructor(provider: IntegrationProvider | string, retryAfterSeconds?: number) {
    super(
      "INTEGRATION_RATE_LIMITED",
      `Provider rate limit reached. Retry after ${retryAfterSeconds ?? 60} seconds.`,
      429,
      provider,
      retryAfterSeconds,
    );
  }
}

export class IntegrationNotConnectedError extends IntegrationError {
  constructor(provider: IntegrationProvider | string) {
    super(
      "INTEGRATION_NOT_CONNECTED",
      `No active ${provider} connection. Connect the account first.`,
      403,
      provider,
    );
  }
}

export class IntegrationTokenExpiredError extends IntegrationError {
  constructor(provider: IntegrationProvider | string) {
    super(
      "INTEGRATION_TOKEN_EXPIRED",
      `${provider} access token has expired. Re-authenticate the account.`,
      403,
      provider,
    );
  }
}

// ---------------------------------------------------------------------------
// Credential vault input/output
// ---------------------------------------------------------------------------

export interface EncryptedCredential {
  encryptedValue: string; // base64 ciphertext
  iv: string;             // base64
  tag: string;            // base64 (auth tag)
}

export interface IntegrationSettingsRow {
  id: string;
  provider: IntegrationProvider;
  label: string;
  description: string | null;
  config: Record<string, unknown>;
  is_enabled: boolean;
  requires_approval: boolean;
  approval_status: "pending" | "approved" | "rejected";
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationConnectionRow {
  id: string;
  profile_id: string;
  provider: IntegrationProvider;
  platform: string | null;
  platform_account_id: string | null;
  platform_username: string | null;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  token_iv: string;
  token_tag: string;
  scope: string | null;
  expires_at: string | null;
  status: IntegrationConnectionStatus;
  last_synced_at: string | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}
