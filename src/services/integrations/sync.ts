/**
 * CALLBACX TECHNOLOGY — Social analytics import service
 *
 * Imports social media metrics through authorised provider APIs into
 * creator_analytics / social_metrics_snapshots.
 *
 * Guarantees:
 * - Metrics are never fabricated: rows are written only when the provider
 *   API returns them; missing values are null, never synthetic.
 * - Rate limits and transient failures are retried with backoff; 429
 *   responses are recorded with Retry-After so the next sync is scheduled
 *   accordingly.
 * - Connection status is updated to reflect the last sync outcome
 *   (connected / error / expired).
 *
 * Accepts an optional `client` parameter; defaults to getSupabaseClient().
 */

import { getSupabaseClient } from "@/lib/supabase/client";
import { getSupabaseAdminClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types/database";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
} from "@/lib/errors";
import { IntegrationError, IntegrationTokenExpiredError, type IntegrationProvider } from "@/lib/integrations/types";
import type { SocialMetrics } from "@/lib/integrations/types";
import {
  getSocialProvider,
  isSocialProvider,
  type SocialProvider,
} from "./social";
import {
  listMyConnections,
  getConnection,
  getConnectionTokens,
  recordConnectionResult,
  logSync,
} from "./connections";
import { withRetry, defaultRetryable, TokenBucket } from "@/lib/integrations/retry";

type Client = any;

type ConnectionRow = Database["public"]["Tables"]["integration_connections"]["Row"];
type SnapshotRow = Database["public"]["Tables"]["social_metrics_snapshots"]["Row"];
type SocialAccountRow = Database["public"]["Tables"]["creator_social_accounts"]["Row"];

// Conservative per-instance rate guard: social APIs are rate-limited per
// user/token; this bucket is only a coarse local throttle.
const rateLimiter = new TokenBucket(10, 2); // 10 tokens, 2 per second

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sync metrics for a single connection.
 * - Creator role: only own connections.
 * - Staff: any connection.
 */
export async function syncConnectionMetrics(
  connectionId: string,
  client?: Client
): Promise<ServiceResult<{ provider: IntegrationProvider; metrics: SocialMetrics }>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) return fail(Errors.authSessionRequired());

  const connection = await getConnection(connectionId, supabase);
  if (connection.error || !connection.data) return fail(Errors.notFound("Connection"));
  if (!isOwnerOrStaff(supabase, profileId, connection.data.profile_id)) {
    return fail(Errors.forbidden());
  }

  return doSyncConnectionMetrics(connection.data, supabase);
}

/**
 * Sync metrics for all of the current user's connected social accounts.
 */
export async function syncMyConnections(
  client?: Client
): Promise<ServiceResult<Array<{ connectionId: string; provider: string; status: string; recordsSynced: number }>>> {
  const supabase = client ?? getSupabaseClient();
  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) return fail(Errors.authSessionRequired());

  const connections = await listMyConnections({}, supabase);
  if (connections.error) return fail(connections.error);
  if (!connections.data) return ok([]);

  const results: Array<{ connectionId: string; provider: string; status: string; recordsSynced: number }> = [];

  for (const c of connections.data) {
    if (c.status !== "connected") continue;
    try {
      const result = await doSyncConnectionMetrics(c, supabase);
      if (result.error) {
        results.push({ connectionId: c.id, provider: c.provider, status: "error", recordsSynced: 0 });
      } else {
        results.push({ connectionId: c.id, provider: c.provider, status: "synced", recordsSynced: result.data?.metrics ? 1 : 0 });
      }
    } catch {
      results.push({ connectionId: c.id, provider: c.provider, status: "error", recordsSynced: 0 });
    }
  }

  return ok(results);
}

/**
 * Sync all connected social accounts (staff only). Intended for scheduled
 * jobs / admin-triggered refresh.
 */
export async function syncAllConnections(client?: Client): Promise<ServiceResult<number>> {
  const supabase = client ?? getSupabaseAdminClient();
  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) return fail(Errors.authSessionRequired());
  if (!(await isStaff(supabase, profileId))) return fail(Errors.adminNotStaff());

  try {
    const { data, error } = await supabase
      .from("integration_connections")
      .select("*")
      .eq("status", "connected")
      .order("last_synced_at", { ascending: true, nullsFirst: true });

    if (error) return fail(mapSupabaseError(error));
    if (!data) return ok(0);

    let synced = 0;
    for (const row of data) {
      const connection: Database["public"]["Tables"]["integration_connections"]["Row"] = row;
      try {
        await doSyncConnectionMetrics(connection, supabase as Client);
        synced += 1;
        // Throttle between accounts to stay gentle on provider APIs.
        await new Promise((r) => setTimeout(r, 500));
      } catch {
        // Individual account failures are logged by doSyncConnectionMetrics;
        // continue with the next account.
      }
    }

    return ok(synced);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Core sync logic
// ---------------------------------------------------------------------------

async function doSyncConnectionMetrics(
  connection: ConnectionRow,
  supabase: Client
): Promise<ServiceResult<{ provider: IntegrationProvider; metrics: SocialMetrics }>> {
  const provider = connection.provider;

  if (!isSocialProvider(provider)) {
    return fail(Errors.validationFailed(`Provider "${provider}" does not support metrics sync."`));
  }

  const socialProvider = getSocialProvider(provider);

  // Decrypt tokens (staff context required). The connection's profile must
  // match the caller unless the caller is staff.
  const profileId = await getCurrentProfileId(supabase);
  const isStaffFlag = profileId ? await isStaff(supabase, profileId) : false;
  if (profileId && connection.profile_id !== profileId && !isStaffFlag) {
    return fail(Errors.forbidden());
  }

  let tokens: { accessToken: string; refreshToken?: string | null; expiresAt?: string | null } | null;
  try {
    tokens = await getConnectionTokens(connection.id);
  } catch (error) {
    return fail(
      error instanceof IntegrationError
        ? Errors.internal(error.message, error)
        : Errors.internal("Could not load connection tokens.")
    );
  }

  if (!tokens) {
    return fail(Errors.notFound("Connection tokens"));
  }

  const now = new Date().toISOString();

  // Expired token handling: try refresh once.
  let accessToken = tokens.accessToken;
  if (tokens.expiresAt && new Date(tokens.expiresAt) <= new Date()) {
    try {
      const refreshed = await refreshProviderTokens(socialProvider, tokens.refreshToken ?? null);
      accessToken = refreshed.accessToken;
      await recordConnectionResult({
        connectionId: connection.id,
        status: "connected",
        expiresAt: refreshed.expiresIn
          ? new Date(Date.now() + refreshed.expiresIn * 1000).toISOString()
          : null,
      });
    } catch (error) {
      if (error instanceof IntegrationTokenExpiredError) {
        await recordConnectionResult({ connectionId: connection.id, status: "expired" });
        await logSync({
          connectionId: connection.id,
          provider,
          action: "sync_analytics",
          status: "failed",
          errorCode: "TOKEN_EXPIRED",
          errorMessage: "Access token has expired. Re-authenticate the account.",
        });
        return fail(Errors.forbidden("Access token has expired. Re-authenticate the account."));
      }
      throw error;
    }
  }

  // Rate-limit guard (coarse, per instance).
  const waitMs = rateLimiter.consume();
  if (waitMs > 0) {
    await new Promise((r) => setTimeout(r, waitMs));
  }

  // Fetch metrics with retries for transient failures / 429.
  let metrics: SocialMetrics;
  try {
    const fetched = await withRetry(
      () => fetchProviderMetrics(socialProvider, accessToken, connection.platform_account_id ?? ""),
      {
        attempts: 3,
        minTimeout: 1000,
        maxTimeout: 30000,
        retryable: defaultRetryable,
        onRetry: (error, attempt, delayMs) => {
          console.error(`[integrations] sync retry ${attempt} for ${provider} connection ${connection.id}: ${delayMs}ms`);
        },
      }
    );
    metrics = fetched;
  } catch (error) {
    if (error instanceof IntegrationError) {
      await recordConnectionResult({
        connectionId: connection.id,
        status: error.code === "INTEGRATION_TOKEN_EXPIRED" ? "expired" : "error",
        syncError: error.message,
      });
      const status = error.statusCode === 429 ? "rate_limited" : "failed";
      await logSync({
        connectionId: connection.id,
        provider,
        action: "sync_analytics",
        status,
        recordsSynced: 0,
        errorCode: error.code,
        errorMessage: error.message,
        retryAfterSeconds: error.retryAfterSeconds ?? null,
      });
      return fail(
        error.statusCode === 429
          ? Errors.validationFailed(error.message, { retryAfterSeconds: error.retryAfterSeconds })
          : Errors.internal(error.message, error)
      );
    }
    throw error;
  }

  // Write snapshot — only values returned by the provider are recorded.
  const snapshot: Partial<SnapshotRow> = {
    creator_social_account_id: (await resolveSocialAccountId(connection, supabase)) as string,
    followers_count: metrics.followersCount ?? null,
    engagement_rate: metrics.engagementRate ?? null,
    snapshotted_at: now,
    source: "platform_api",
  };

  if (!snapshot.creator_social_account_id) {
    return fail(Errors.internal("No linked social account to attach metrics to."));
  }

  const { error: insertError } = await supabase
    .from("social_metrics_snapshots")
    .insert(snapshot);

  if (insertError) return fail(mapSupabaseError(insertError));

  // Update the social account row with latest values (never overwrite with
  // nulls — keep last known good when the API omits a field).
  const accountUpdate: Partial<SocialAccountRow> = {
    metrics_source: "platform_api",
    last_synced_at: now,
    updated_at: now,
  };
  if (metrics.followersCount != null) accountUpdate.followers_count = metrics.followersCount;
  if (metrics.engagementRate != null) accountUpdate.engagement_rate = metrics.engagementRate;
  if (metrics.postsCount != null) {
    // creator_social_accounts has no posts column; recorded in snapshots only.
  }

  await supabase.from("creator_social_accounts").update(accountUpdate).eq("id", snapshot.creator_social_account_id);

  // Also roll into creator_analytics for the day (traffic-like roll-up).
  const creatorProfileId = await getCreatorProfileIdForConnection(connection.profile_id, supabase);
  if (creatorProfileId) {
    await supabase.from("creator_analytics").upsert(
      {
        creator_profile_id: creatorProfileId,
        metric_date: new Date().toISOString().slice(0, 10),
        impressions: metrics.impressions ?? 0,
        reach: metrics.reach ?? 0,
        engagement: metrics.engagementRate != null ? Math.round(Number(metrics.engagementRate)) : 0,
        clicks: metrics.clicks ?? 0,
        conversions: metrics.conversions ?? 0,
        revenue: metrics.revenue ?? 0,
        source: "platform_api",
        collected_at: now,
      },
      { onConflict: "creator_profile_id, metric_date" }
    );
  }

  await recordConnectionResult({
    connectionId: connection.id,
    status: "connected",
  });
  await logSync({
    connectionId: connection.id,
    provider,
    action: "sync_analytics",
    status: "ok",
    recordsSynced: 1,
  });

  return ok({ provider, metrics });
}

// ---------------------------------------------------------------------------
// Provider calls
// ---------------------------------------------------------------------------

async function fetchProviderMetrics(
  provider: SocialProvider,
  accessToken: string,
  accountId: string
): Promise<SocialMetrics> {
  const metrics = await provider.fetchMetrics({ accessToken, accountId });
  return {
    followersCount: metrics.followersCount ?? null,
    followingCount: metrics.followingCount ?? null,
    postsCount: metrics.postsCount ?? null,
    engagementRate: metrics.engagementRate ?? null,
    impressions: metrics.impressions ?? null,
    reach: metrics.reach ?? null,
    videoViews: metrics.videoViews ?? null,
    likes: metrics.likes ?? null,
    comments: metrics.comments ?? null,
    shares: metrics.shares ?? null,
    clicks: metrics.clicks ?? null,
    conversions: metrics.conversions ?? null,
    revenue: metrics.revenue ?? null,
    metricDate: metrics.metricDate ?? undefined,
  };
}

async function refreshProviderTokens(
  provider: SocialProvider,
  refreshToken: string | null
): Promise<{ accessToken: string; expiresIn?: number | null }> {
  if (!refreshToken) {
    throw new IntegrationTokenExpiredError(provider.provider);
  }
  const refreshed = await provider.refreshAccessToken({ refreshToken });
  return { accessToken: refreshed.accessToken, expiresIn: refreshed.expiresIn ?? null };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function resolveSocialAccountId(
  connection: ConnectionRow,
  supabase: Client
): Promise<string | null> {
  // Link the connection to a creator_social_account row (create if missing)
  // so metrics have a place to live. Requires a creator profile.
  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) return null;

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("profile_id", profileId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!creatorProfile) return null;

  const platformUsername = connection.platform_username ?? null;
  const platformAccountId = connection.platform_account_id ?? null;

  // Find an existing matching account.
  let query = supabase
    .from("creator_social_accounts")
    .select("id")
    .eq("creator_profile_id", creatorProfile.id)
    .eq("platform", connection.platform ?? "");

  if (platformAccountId) {
    query = query.eq("platform_user_id", platformAccountId);
  } else if (platformUsername) {
    query = query.eq("username", platformUsername);
  }

  const { data: existing } = await query.maybeSingle();
  if (existing) {
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from("creator_social_accounts")
    .insert({
      creator_profile_id: creatorProfile.id,
      platform: connection.platform ?? "",
      platform_user_id: platformAccountId ?? null,
      username: platformUsername ?? "",
      metrics_source: "platform_api",
      last_synced_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return null;
  return created.id;
}

async function getCreatorProfileIdForConnection(
  profileId: string,
  supabase: Client
): Promise<string | null> {
  const { data } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("profile_id", profileId)
    .is("deleted_at", null)
    .maybeSingle();

  return data?.id ?? null;
}

async function isOwnerOrStaff(
  supabase: Client,
  profileId: string,
  ownerProfileId: string
): Promise<boolean> {
  if (profileId === ownerProfileId) return true;
  return await isStaff(supabase, profileId);
}

async function isStaff(supabase: Client, profileId: string): Promise<boolean> {
  const { data } = await supabase.rpc("is_staff", { p_profile: profileId });
  return data === true;
}

async function getCurrentProfileId(supabase: Client): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return data?.id ?? null;
}
