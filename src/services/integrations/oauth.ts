/**
 * CALLBACX MARKETING — OAuth service
 *
 * Starts and completes OAuth 2.0 / OpenID Connect flows for social
 * providers where official APIs permit (Instagram, TikTok, YouTube).
 *
 * - State values are single-use and expiry-bound (PKCE + state replay
 *   protection via integration_oauth_states).
 * - Authorization URLs are provider-specific; scopes request only the data
 *   this platform needs (profile + public metrics).
 * - Access/refresh tokens are encrypted at rest; plaintext is never logged.
 *
 * Providers marked as requiring approval are not usable until an
 * administrator enables and approves them AND supplies client credentials.
 */

import { getSupabaseAdminClient } from "@/lib/supabase/client";
import { encryptCredential } from "@/lib/integrations/vault";
import {
  createOAuthState,
  consumeOAuthState,
  type OAuthStatePayload,
} from "@/lib/integrations/oauth";
import {
  IntegrationError,
  IntegrationNotConfiguredError,
  type IntegrationProvider,
} from "@/lib/integrations/types";
import {
  getIntegrationSetting,
  getIntegrationCredential,
  type IntegrationSettingsRow,
} from "./settings";
import {
  recordConnectionResult,
  type IntegrationConnectionStatus,
} from "./connections";

type Client = any;

const REDIRECT_PATH = "/api/integrations/oauth/callback";

/**
 * Resolve the public app URL used for OAuth redirect URIs.
 */
function appBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    throw new IntegrationError(
      "INTEGRATION_APP_URL_MISSING",
      "NEXT_PUBLIC_APP_URL is not set. OAuth redirect URIs cannot be built.",
      500,
    );
  }
  return url.replace(/\/$/, "");
}

/**
 * Provider credential keys stored in the vault.
 */
const CLIENT_SECRET_KEY = "client_secret";

/**
 * Read the client_id for a provider: settings.config.client_id first, then
 * provider-specific env var (documented in .env.local.example).
 */
async function getClientId(
  provider: IntegrationProvider,
  setting: IntegrationSettingsRow
): Promise<string> {
  const configClientId = setting.config?.client_id;
  if (typeof configClientId === "string" && configClientId.length > 0) {
    return configClientId;
  }

  const envVar = envClientIdVar(provider);
  const value = envVar ? process.env[envVar] : undefined;
  if (value) return value;

  throw new IntegrationNotConfiguredError(
    provider,
    `Set ${envVar ?? "settings.config.client_id"} for this provider.`
  );
}

function envClientIdVar(provider: IntegrationProvider): string | undefined {
  switch (provider) {
    case "instagram": return "INSTAGRAM_CLIENT_ID";
    case "tiktok": return "TIKTOK_CLIENT_KEY";
    case "youtube": return "YOUTUBE_CLIENT_ID";
    default: return undefined;
  }
}

async function getClientSecret(
  provider: IntegrationProvider,
  supabase: Client
): Promise<string> {
  const result = await getIntegrationCredential(provider, CLIENT_SECRET_KEY, supabase);
  if (result.error) {
    throw new IntegrationNotConfiguredError(
      provider,
      `Client secret not configured. Ask an administrator to set it in integration settings.`
    );
  }
  if (!result.data) {
    throw new IntegrationNotConfiguredError(
      provider,
      `Client secret not configured. Ask an administrator to set it in integration settings.`
    );
  }
  return result.data;
}

// ---------------------------------------------------------------------------
// Provider authorization endpoints
// ---------------------------------------------------------------------------

interface ProviderEndpoints {
  authorize: string;
  token: string;
  scopes: string[];
}

/**
 * Official OAuth endpoints. Scopes request profile + public metrics only.
 * Note: several scopes (e.g. instagram content publish, insights) require
 * the app to pass platform app review before they can be requested at all.
 */
const PROVIDER_ENDPOINTS: Record<IntegrationProvider, ProviderEndpoints | undefined> = {
  instagram: {
    authorize: "https://api.instagram.com/oauth/authorize",
    token: "https://api.instagram.com/oauth/access_token",
    scopes: ["instagram_basic", "instagram_manage_insights", "instagram_manage_comments"],
  },
  tiktok: {
    authorize: "https://www.tiktok.com/v2/auth/authorize",
    token: "https://open.tiktokapis.com/v2/oauth/token/",
    scopes: ["user.info.basic", "video.list", "user.profile"],
  },
  youtube: {
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ],
  },
  resend: undefined,
  stripe: undefined,
  supabase_storage: undefined,
  webhook: undefined,
} as const;

function providerEndpoints(provider: IntegrationProvider): ProviderEndpoints {
  const endpoints = PROVIDER_ENDPOINTS[provider];
  if (!endpoints) {
    throw new IntegrationError(
      "INTEGRATION_OAUTH_NOT_SUPPORTED",
      `OAuth is not implemented for provider "${provider}".`,
      400,
      provider,
    );
  }
  return endpoints;
}

// ---------------------------------------------------------------------------
// Authorize
// ---------------------------------------------------------------------------

export interface OAuthAuthorizeResult {
  authorizationUrl: string;
  state: string;
  codeVerifier: string;
  provider: IntegrationProvider;
  scopes: string[];
}
/**
 * Build the provider authorization URL and store a single-use OAuth state
 * (with PKCE code verifier where supported).
 */
export async function getOAuthAuthorizationUrl(
  input: { provider: IntegrationProvider; profileId: string; redirectTo?: string | null },
  client?: Client
): Promise<OAuthAuthorizeResult> {
  const supabase = client ?? getSupabaseAdminClient();
  const { provider, profileId, redirectTo } = input;

  const setting = await getIntegrationSetting(provider, supabase);
  if (setting.error || !setting.data) {
    throw new IntegrationError(
      "INTEGRATION_NOT_FOUND",
      `No integration setting for provider "${provider}".`,
      404,
      provider,
    );
  }

  if (!setting.data.is_enabled) {
    throw new IntegrationNotConfiguredError(provider, "Provider is not enabled by an administrator.");
  }
  if (setting.data.requires_approval && setting.data.approval_status !== "approved") {
    throw new IntegrationNotConfiguredError(
      provider,
      `Provider approval is "${setting.data.approval_status}". An administrator must approve it first.`
    );
  }

  const clientId = await getClientId(provider, setting.data);
  const endpoints = providerEndpoints(provider);
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await codeChallengeFromVerifier(codeVerifier);

  const statePayload: OAuthStatePayload = {
    provider,
    profileId,
    redirectTo: redirectTo ?? null,
    codeVerifier,
  };
  const state = await createOAuthState(statePayload, supabase);

  const redirectUri = `${appBaseUrl()}${REDIRECT_PATH}`;
  const params = new URLSearchParams({
    provider,
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: endpoints.scopes.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
  });

  const authorizationUrl = `${endpoints.authorize}?${params.toString()}`;

  return {
    authorizationUrl,
    state,
    codeVerifier,
    provider,
    scopes: endpoints.scopes,
  };
}

/**
 * Exchange an authorization code for tokens and create/update the user's
 * connection record. Called by the OAuth callback route handler.
 */
export async function completeOAuthFlow(
  input: { provider: IntegrationProvider; code: string; state: string },
  client?: Client
): Promise<{
  provider: IntegrationProvider;
  connectionId: string;
  status: IntegrationConnectionStatus;
  platform: string | null;
  platformAccountId: string | null;
  platformUsername: string | null;
  expiresAt: string | null;
  redirectTo: string | null;
}> {
  const supabase = client ?? getSupabaseAdminClient();
  const { provider, code, state } = input;

  const payload = await consumeOAuthState(state, supabase);
  if (payload.provider !== provider) {
    throw new IntegrationError("INTEGRATION_OAUTH_STATE_MISMATCH", "OAuth state provider mismatch.", 400);
  }
  if (!payload.profileId) {
    throw new IntegrationError("INTEGRATION_OAUTH_STATE_NO_PROFILE", "OAuth state is not bound to a profile.", 400);
  }

  const setting = await getIntegrationSetting(provider, supabase);
  if (setting.error || !setting.data) {
    throw new IntegrationError("INTEGRATION_NOT_FOUND", `No integration setting for provider "${provider}".`, 404, provider);
  }

  const clientId = await getClientId(provider, setting.data);
  const clientSecret = await getClientSecret(provider, supabase);
  const endpoints = providerEndpoints(provider);

  // Exchange code for tokens (provider token endpoint, server-to-server).
  const tokenResponse = await fetchTokenEndpoint(endpoints.token, {
    clientId,
    clientSecret,
    code,
    redirectUri: `${appBaseUrl()}${REDIRECT_PATH}`,
    codeVerifier: payload.codeVerifier ?? undefined,
    provider,
  });

  if (!tokenResponse.ok) {
    const body = await tokenResponse.text().catch(() => "");
    throw new IntegrationError(
      "INTEGRATION_OAUTH_TOKEN_EXCHANGE_FAILED",
      `Provider token exchange failed (${tokenResponse.status}): ${body}`,
      tokenResponse.status === 429 ? 429 : 400,
      provider,
      tokenResponse.status === 429 ? extractRetryAfter(tokenResponse) : undefined,
    );
  }

  const tokens = (await tokenResponse.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
    // Meta-specific
    user_id?: string;
    username?: string;
    // Platform-specific account fields may vary; read defensively.
    open_id?: string;
    unionid?: string;
    email?: string;
    picture?: string;
    display_name?: string;
    [key: string]: unknown;
  };

  if (!tokens.access_token) {
    throw new IntegrationError(
      "INTEGRATION_OAUTH_NO_ACCESS_TOKEN",
      "Provider did not return an access token.",
      400,
      provider,
    );
  }

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  const platform = inferPlatform(provider);
  const platformAccountId =
    tokens.user_id ?? tokens.open_id ?? tokens.unionid ?? null;
  const platformUsername =
    tokens.username ?? tokens.email ?? tokens.display_name ?? null;

  // Create or update the connection for this profile + provider + account.
  const connection = await upsertConnection(
    supabase,
    payload.profileId,
    provider,
    platform,
    platformAccountId,
    platformUsername,
    tokens.access_token,
    tokens.refresh_token ?? null,
    endpoints.scopes.join(" "),
    expiresAt
  );

  await recordConnectionResult({
    connectionId: connection.id,
    status: "connected",
    platformAccountId: connection.platform_account_id ?? null,
    platformUsername: connection.platform_username ?? null,
    expiresAt: connection.expires_at ?? null,
  });

  return {
    provider,
    connectionId: connection.id,
    status: "connected",
    platform: connection.platform ?? null,
    platformAccountId: connection.platform_account_id ?? null,
    platformUsername: connection.platform_username ?? null,
    expiresAt: connection.expires_at ?? null,
    redirectTo: payload.redirectTo ?? null,
  };
}

// ---------------------------------------------------------------------------
// Token endpoint (fetch-based; no provider SDK assumed)
// ---------------------------------------------------------------------------

interface TokenExchangeInput {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  codeVerifier?: string | undefined;
  provider: IntegrationProvider;
}

async function fetchTokenEndpoint(
  url: string,
  input: TokenExchangeInput
): Promise<Response> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    redirect_uri: input.redirectUri,
    code: input.code,
  });

  // TikTok uses client_key/client_secret; Instagram and Google use
  // client_id/client_secret.
  if (input.provider === "tiktok") {
    body.set("client_key", input.clientId);
    body.set("client_secret", input.clientSecret);
  } else {
    body.set("client_id", input.clientId);
    body.set("client_secret", input.clientSecret);
  }

  if (input.codeVerifier) body.set("code_verifier", input.codeVerifier);

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}

function extractRetryAfter(response: Response): number | undefined {
  const value = response.headers.get("retry-after");
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) ? seconds : undefined;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoaUrl(array);
}

async function codeChallengeFromVerifier(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  return btoaUrl(new Uint8Array(digest));
}

function btoaUrl(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function inferPlatform(provider: IntegrationProvider): string | null {
  switch (provider) {
    case "instagram": return "instagram";
    case "tiktok": return "tiktok";
    case "youtube": return "youtube";
    default: return null;
  }
}

async function upsertConnection(
  supabase: Client,
  profileId: string,
  provider: IntegrationProvider,
  platform: string | null,
  platformAccountId: string | null,
  platformUsername: string | null,
  accessToken: string,
  refreshToken: string | null,
  scope: string | null,
  expiresAt: string | null
) {
  // Try to find an existing connection for this profile + provider + account.
  let query = supabase
    .from("integration_connections")
    .select("id, access_token_encrypted, refresh_token_encrypted, token_iv, token_tag")
    .eq("profile_id", profileId)
    .eq("provider", provider);

  if (platformAccountId) {
    query = query.eq("platform_account_id", platformAccountId);
  }

  const { data: existing } = await query.maybeSingle();

  // Encrypt tokens.
  const { encryptedValue, iv, tag } = encryptCredential(accessToken);
  const refreshEncrypted = refreshToken ? encryptCredential(refreshToken) : null;

  const updatePayload = {
    platform,
    platform_account_id: platformAccountId ?? null,
    platform_username: platformUsername ?? null,
    access_token_encrypted: encryptedValue,
    refresh_token_encrypted: refreshEncrypted?.encryptedValue ?? null,
    token_iv: iv,
    token_tag: tag,
    scope,
    expires_at: expiresAt ?? null,
    status: "connected" as const,
    sync_error: null,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { data, error } = await supabase
      .from("integration_connections")
      .update(updatePayload)
      .eq("id", existing.id)
      .select("id, provider, platform, platform_account_id, platform_username, expires_at, status")
      .single();
    if (error) throw new IntegrationError("INTEGRATION_CONNECTION_UPDATE_FAILED", "Could not update connection.", 500, provider, undefined);
    return data;
  }

  const { data, error } = await supabase
    .from("integration_connections")
    .insert({
      profile_id: profileId,
      provider,
      platform,
      platform_account_id: platformAccountId ?? null,
      platform_username: platformUsername ?? null,
      access_token_encrypted: encryptedValue,
      refresh_token_encrypted: refreshEncrypted?.encryptedValue ?? null,
      token_iv: iv,
      token_tag: tag,
      scope,
      expires_at: expiresAt ?? null,
      status: "connected",
    })
    .select("id, provider, platform, platform_account_id, platform_username, expires_at, status")
    .single();

  if (error) throw new IntegrationError("INTEGRATION_CONNECTION_CREATE_FAILED", "Could not create connection.", 500, provider, undefined);
  return data;
}
