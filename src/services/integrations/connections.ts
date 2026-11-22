/**
 * CALLBACX MARKETING — Integration connections service
 *
 * User-level provider connections (OAuth tokens, API keys).
 *
 * - Tokens are encrypted server-side (AES-256-GCM) before being written.
 * - Plaintext tokens are never logged or returned to the client.
 * - Connection status indicators: pending / connected / expired / revoked /
 *   error / disconnected.
 *
 * Accepts an optional `client` parameter; defaults to getSupabaseClient().
 */

import { getSupabaseClient, getCachedProfileId } from "@/lib/supabase/client";
import { getSupabaseAdminClient } from "@/lib/supabase/client";
import { decryptCredential } from "@/lib/integrations/vault";
import type { Database } from "@/lib/supabase/types/database";
import type {
  IntegrationProvider,
  IntegrationConnectionStatus,
  IntegrationConnectionRow,
} from "@/lib/integrations/types";
export type { IntegrationConnectionStatus };
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
} from "@/lib/errors";
import { IntegrationError } from "@/lib/integrations/types";
import { isStaff } from "./settings";

type Client = any;
type ConnectionRow = Database["public"]["Tables"]["integration_connections"]["Row"];

const CONNECTIONS_SELECT = `
  id, profile_id, provider, platform, platform_account_id, platform_username,
  scope, expires_at, status, last_synced_at, sync_error, created_at, updated_at
`;

function mapConnectionRow(row: ConnectionRow): IntegrationConnectionRow {
  return {
    id: row.id,
    profile_id: row.profile_id,
    provider: row.provider as IntegrationProvider,
    platform: row.platform ?? null,
    platform_account_id: row.platform_account_id ?? null,
    platform_username: row.platform_username ?? null,
    access_token_encrypted: row.access_token_encrypted,
    refresh_token_encrypted: row.refresh_token_encrypted ?? null,
    token_iv: row.token_iv,
    token_tag: row.token_tag,
    scope: row.scope ?? null,
    expires_at: row.expires_at ?? null,
    status: row.status as IntegrationConnectionStatus,
    last_synced_at: row.last_synced_at ?? null,
    sync_error: row.sync_error ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Connections
// ---------------------------------------------------------------------------

/**
 * List the current user's provider connections. Includes status indicators
 * (connected / expired / error / ...) but never token values.
 */
export async function listMyConnections(
  { provider, status, limit = 20, offset = 0 }: { provider?: IntegrationProvider; status?: IntegrationConnectionStatus; limit?: number; offset?: number } = {},
  client?: Client
): Promise<ServiceResult<IntegrationConnectionRow[]>> {
  const supabase = client ?? getSupabaseClient();

  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) return fail(Errors.authSessionRequired());

  try {
    let query = supabase
      .from("integration_connections")
      .select(CONNECTIONS_SELECT)
      .eq("profile_id", profileId)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (provider) query = query.eq("provider", provider);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return fail(mapSupabaseError(error));
    return ok((data ?? []).map(mapConnectionRow));
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Get a single connection by id (owner only).
 */
export async function getConnection(
  connectionId: string,
  client?: Client
): Promise<ServiceResult<IntegrationConnectionRow | null>> {
  const supabase = client ?? getSupabaseClient();

  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) return fail(Errors.authSessionRequired());

  try {
    const { data, error } = await supabase
      .from("integration_connections")
      .select(CONNECTIONS_SELECT)
      .eq("id", connectionId)
      .eq("profile_id", profileId)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    return ok(data ? mapConnectionRow(data) : null);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Mark a connection as disconnected (revoke locally). Owner only.
 * Does not call the provider — the provider-side token remains valid until
 * the provider's own revocation endpoint is called (where offered).
 */
export async function disconnectConnection(
  connectionId: string,
  client?: Client
): Promise<ServiceResult<void>> {
  const supabase = client ?? getSupabaseClient();

  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) return fail(Errors.authSessionRequired());

  try {
    const { error } = await supabase
      .from("integration_connections")
      .update({
        status: "disconnected",
        sync_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId)
      .eq("profile_id", profileId);

    if (error) return fail(mapSupabaseError(error));
    return ok(undefined);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Record the outcome of a connection attempt (used by OAuth callback and
 * sync jobs). Service-role or owner context.
 */
export async function recordConnectionResult(input: {
  connectionId: string;
  status: IntegrationConnectionStatus;
  platformAccountId?: string | null;
  platformUsername?: string | null;
  expiresAt?: string | null;
  syncError?: string | null;
}): Promise<ServiceResult<void>> {
  const supabase = getSupabaseAdminClient();

  try {
    const { error } = await supabase
      .from("integration_connections")
      .update({
        status: input.status,
        platform_account_id: input.platformAccountId ?? null,
        platform_username: input.platformUsername ?? null,
        expires_at: input.expiresAt ?? null,
        sync_error: input.syncError ?? null,
        last_synced_at: input.status === "connected" ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.connectionId);

    if (error) return fail(mapSupabaseError(error));
    return ok(undefined);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Append a sync log entry for a connection (audit trail for rate limits,
 * failures, retries).
 */
export async function logSync(input: {
  connectionId: string;
  provider: IntegrationProvider;
  action: string;
  status: "ok" | "rate_limited" | "failed" | "retrying";
  recordsSynced?: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  retryAfterSeconds?: number | null;
}): Promise<ServiceResult<void>> {
  const supabase = getSupabaseAdminClient();

  try {
    const { error } = await supabase.from("integration_sync_logs").insert({
      connection_id: input.connectionId,
      provider: input.provider,
      action: input.action,
      status: input.status,
      records_synced: input.recordsSynced ?? null,
      error_code: input.errorCode ?? null,
      error_message: input.errorMessage ?? null,
      retry_after_seconds: input.retryAfterSeconds ?? null,
    });

    if (error) return fail(mapSupabaseError(error));
    return ok(undefined);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Get decrypted tokens for a connection. Staff only (service role).
 * Used by sync jobs and webhook handlers. Plaintext tokens never leave the
 * server and are never logged.
 */
export async function getConnectionTokens(
  connectionId: string
): Promise<{
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: string | null;
} | null> {
  const supabase = getSupabaseAdminClient();

  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) {
    throw new IntegrationError("AUTH_SESSION_REQUIRED", "You must be signed in to perform this action.", 401);
  }
  if (!(await isStaff(supabase, profileId))) {
    throw new IntegrationError("ADMIN_NOT_STAFF", "Admin access required.", 403);
  }

  try {
    const { data, error } = await supabase
      .from("integration_connections")
      .select("access_token_encrypted, refresh_token_encrypted, token_iv, token_tag, expires_at, status")
      .eq("id", connectionId)
      .maybeSingle();

    if (error) {
      throw new IntegrationError(
        "INTEGRATION_CONNECTION_LOAD_FAILED",
        "Could not load connection tokens.",
        500,
        undefined,
        undefined,
      );
    }
    if (!data) return null;

    let accessToken: string;
    try {
      accessToken = decryptCredential({
        encryptedValue: data.access_token_encrypted,
        iv: data.token_iv,
        tag: data.token_tag,
      });
    } catch {
      throw new IntegrationError(
        "INTEGRATION_TOKEN_DECRYPT_FAILED",
        "Access token decryption failed.",
        500,
        undefined,
        undefined,
      );
    }

    let refreshToken: string | null = null;
    if (data.refresh_token_encrypted) {
      try {
        refreshToken = decryptCredential({
          encryptedValue: data.refresh_token_encrypted,
          iv: data.token_iv,
          tag: data.token_tag,
        });
      } catch {
        // Refresh token undecryptable — access token may still work.
      }
    }

    return {
      accessToken,
      refreshToken: refreshToken ?? null,
      expiresAt: data.expires_at ?? null,
    };
  } catch (error) {
    if (error instanceof IntegrationError) throw error;
    throw new IntegrationError(
      "INTEGRATION_CONNECTION_LOAD_FAILED",
      "Could not load connection tokens.",
      500,
      undefined,
      undefined,
    );
  }
}

async function getCurrentProfileId(supabase: Client): Promise<string | null> {
  return getCachedProfileId(supabase);
}
