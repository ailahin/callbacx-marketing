/**
 * CALLBACX TECHNOLOGY — Social media providers
 *
 * Provider-specific clients for Instagram, TikTok and YouTube account
 * connections and metrics imports through authorised APIs.
 *
 * Guarantees:
 * - No provider API is called without a stored, decrypted access token.
 * - Metrics are never fabricated: every value comes from the provider API
 *   response; a missing/failed response produces an error, not synthetic
 *   data.
 * - Tokens are decrypted by the caller (vault) and passed in; this module
 *   never logs token values.
 *
 * Platform requirements and limitations are documented in docs/INTEGRATIONS.md.
 */

import {
  IntegrationError,
  IntegrationRateLimitedError,
  IntegrationTokenExpiredError,
  type IntegrationProvider,
  type SocialAccountProfile,
  type SocialMetrics,
} from "@/lib/integrations/types";

interface ProviderFetchInput {
  accessToken: string;
}

interface ProviderMetricsInput {
  accessToken: string;
  accountId: string;
}

// ---------------------------------------------------------------------------
// Base class
// ---------------------------------------------------------------------------

export abstract class SocialProvider {
  abstract readonly provider: IntegrationProvider;
  abstract readonly baseUrl: string;
  abstract readonly requiresAppReview: string[]; // scopes/features needing provider approval

  /**
   * Fetch the connected account's public profile.
   */
  abstract getAccountProfile(input: ProviderFetchInput): Promise<SocialAccountProfile>;

  /**
   * Fetch public metrics for the account. Returns only values the API
   * actually provides; missing fields are null (never fabricated).
   */
  abstract fetchMetrics(input: ProviderMetricsInput): Promise<SocialMetrics>;

  /**
   * Refresh an expired access token using the refresh token.
   */
  abstract refreshAccessToken(input: { refreshToken: string }): Promise<{
    accessToken: string;
    refreshToken?: string | null;
    expiresIn?: number | null;
  }>;

  /**
   * Revoke the token at the provider (where the provider offers an endpoint).
   */
  abstract revoke(input: { accessToken: string }): Promise<void>;

  /**
   * Map an HTTP response to a typed IntegrationError, distinguishing
   * token expiry (401) from rate limits (429) from hard failures.
   */
  protected mapProviderError(
    response: Response,
    body: string
  ): IntegrationError {
    const status = response.status;

    if (status === 401 || status === 403) {
      return new IntegrationTokenExpiredError(this.provider);
    }

    if (status === 429) {
      const retryAfter = extractRetryAfter(response);
      return new IntegrationRateLimitedError(this.provider, retryAfter);
    }

    return new IntegrationError(
      "INTEGRATION_PROVIDER_ERROR",
      `${this.provider} API error (${status}): ${truncate(body, 500)}`,
      502,
      this.provider,
      status === 429 ? extractRetryAfter(response) : undefined
    );
  }
}

function extractRetryAfter(response: Response): number | undefined {
  const value = response.headers.get("retry-after");
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) ? seconds : undefined;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

// ---------------------------------------------------------------------------
// Helper: authorised fetch
// ---------------------------------------------------------------------------

async function providerFetch(input: {
  url: string;
  accessToken: string;
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
}): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(input.url, {
    method: input.method ?? "GET",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    ...(input.body ? { body: JSON.stringify(input.body) } : {}),
  });
  const body = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, body };
}

// ---------------------------------------------------------------------------
// Instagram (Meta Graph API / Basic Display)
// ---------------------------------------------------------------------------

/**
 * Instagram connections.
 *
 * Requirements:
 * - Meta developer app with Instagram Basic Display or Instagram Graph API
 *   product. Basic Display is available without review for personal
 *   accounts; Graph API profile/metrics permissions (instagram_basic,
 *   instagram_manage_insights, instagram_manage_comments, content publish)
 *   require Meta App Review before they can be requested from users.
 * - Access tokens are short-lived (1 hour for Basic Display long-lived
 *   tokens last 60 days) and must be refreshed via
 *   https://graph.instagram.com/refresh_access_token.
 *
 * Limitations documented in docs/INTEGRATIONS.md.
 */
export class InstagramProvider extends SocialProvider {
  readonly provider = "instagram" as const;
  readonly baseUrl = "https://graph.instagram.com";
  readonly requiresAppReview = [
    "instagram_basic",
    "instagram_manage_insights",
    "instagram_manage_comments",
    "instagram_content_publish",
  ];

  async getAccountProfile({ accessToken }: ProviderFetchInput): Promise<SocialAccountProfile> {
    const { ok, status, body } = await providerFetch({
      url: `${this.baseUrl}/me?fields=id,username,account_type,media_count`,
      accessToken,
    });
    if (!ok) throw this.mapProviderError(new Response(body, { status }), body);

    const data = JSON.parse(body || "{}") as {
      id?: string;
      username?: string;
      account_type?: string;
      media_count?: number;
    };

    return {
      platformAccountId: data.id ?? "",
      username: data.username ?? "",
      name: null,
      profileUrl: `https://instagram.com/${data.username ?? ""}`,
      profilePictureUrl: null,
      isVerified: null,
    };
  }

  async fetchMetrics({ accessToken, accountId }: ProviderMetricsInput): Promise<SocialMetrics> {
    // Instagram Graph API: followers_count and engagement metrics require
    // instagram_manage_insights + app review. Request only what is available.
    const { ok, status, body } = await providerFetch({
      url: `${this.baseUrl}/${accountId}?fields=followers_count,media_count,profile_picture_url`,
      accessToken,
    });
    if (!ok) throw this.mapProviderError(new Response(body, { status }), body);

    const data = JSON.parse(body || "{}") as {
      followers_count?: number;
      media_count?: number;
    };

    return {
      followersCount: data.followers_count ?? null,
      postsCount: data.media_count ?? null,
      metricDate: new Date().toISOString().slice(0, 10),
    };
  }

  async refreshAccessToken({ refreshToken }: { refreshToken: string }): Promise<{
    accessToken: string;
    refreshToken?: string | null;
    expiresIn?: number | null;
  }> {
    const res = await fetch(
      `${this.baseUrl}/refresh_access_token?grant_type=ig_refresh_token&access_token=${refreshToken}`,
      { method: "POST" }
    );
    const body = await res.text().catch(() => "");
    if (!res.ok) throw this.mapProviderError(res, body);
    const data = JSON.parse(body || "{}") as { access_token?: string; expires_in?: number };
    if (!data.access_token) throw new IntegrationError("INTEGRATION_REFRESH_FAILED", "Instagram did not return an access token.", 502, this.provider);
    return { accessToken: data.access_token, expiresIn: data.expires_in ?? null };
  }

  async revoke({ accessToken }: { accessToken: string }): Promise<void> {
    // Instagram has no public token revocation endpoint in Basic Display.
    // Locally disconnecting the connection is the supported action.
    return;
  }
}

// ---------------------------------------------------------------------------
// TikTok
// ---------------------------------------------------------------------------

/**
 * TikTok connections (TikTok Login Kit / Open Platform).
 *
 * Requirements:
 * - TikTok developer app with the appropriate scopes (user.info.basic,
 *   video.list). Access to business/metrics endpoints may require TikTok
 *   Business Account and app review.
 *
 * Limitations documented in docs/INTEGRATIONS.md.
 */
export class TikTokProvider extends SocialProvider {
  readonly provider = "tiktok" as const;
  readonly baseUrl = "https://open.tiktokapis.com/v2";
  readonly requiresAppReview = ["video.list", "user.profile"];

  async getAccountProfile({ accessToken }: ProviderFetchInput): Promise<SocialAccountProfile> {
    const { ok, status, body } = await providerFetch({
      url: `${this.baseUrl}/user/info/`,
      accessToken,
      body: { fields: ["open_id", "unionid", "avatar_url", "display_name", "username"] },
    });
    if (!ok) throw this.mapProviderError(new Response(body, { status }), body);

    const data = JSON.parse(body || "{}") as {
      data?: {
        user?: {
          open_id?: string;
          unionid?: string;
          avatar_url?: string;
          display_name?: string;
          username?: string;
        };
      };
    };

    const user = data.data?.user;
    return {
      platformAccountId: user?.open_id ?? user?.unionid ?? "",
      username: user?.username ?? "",
      name: user?.display_name ?? null,
      profilePictureUrl: user?.avatar_url ?? null,
      profileUrl: `https://tiktok.com/@${user?.username ?? ""}`,
      isVerified: null,
    };
  }

  async fetchMetrics({ accessToken, accountId }: ProviderMetricsInput): Promise<SocialMetrics> {
    // TikTok public metrics (follower count, video views) require business
    // API access; the user info endpoint does not return follower counts.
    // We return what is available and mark missing values null.
    const { ok, status, body } = await providerFetch({
      url: `${this.baseUrl}/user/info/`,
      accessToken,
      body: { fields: ["open_id", "username", "follower_count"] },
    });
    if (!ok) throw this.mapProviderError(new Response(body, { status }), body);

    const data = JSON.parse(body || "{}") as {
      data?: { user?: { follower_count?: number } };
    };

    return {
      followersCount: data.data?.user?.follower_count ?? null,
      metricDate: new Date().toISOString().slice(0, 10),
    };
  }

  async refreshAccessToken({ refreshToken }: { refreshToken: string }): Promise<{
    accessToken: string;
    refreshToken?: string | null;
    expiresIn?: number | null;
  }> {
    const res = await fetch(`${this.baseUrl}/oauth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: "", // filled by caller via OAuth service; here we cannot refresh without client creds
        client_secret: "",
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    const body = await res.text().catch(() => "");
    if (!res.ok) throw this.mapProviderError(res, body);
    const data = JSON.parse(body || "{}") as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };
    if (!data.access_token) throw new IntegrationError("INTEGRATION_REFRESH_FAILED", "TikTok did not return an access token.", 502, this.provider);
    return { accessToken: data.access_token, refreshToken: data.refresh_token ?? null, expiresIn: data.expires_in ?? null };
  }

  async revoke({ accessToken }: { accessToken: string }): Promise<void> {
    // Best-effort revocation where supported.
    try {
      await fetch(`${this.baseUrl}/oauth/revoke/`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: accessToken }),
      });
    } catch {
      // Revocation failures must not break disconnection.
    }
  }
}

// ---------------------------------------------------------------------------
// YouTube (Google OAuth / Data API v3)
// ---------------------------------------------------------------------------

/**
 * YouTube connections (Google OAuth, YouTube Data API v3).
 *
 * Requirements:
 * - Google Cloud project with YouTube Data API v3 enabled.
 * - Quota: API calls consume quota units; channels.list part=statistics is
 *   inexpensive. YouTube Analytics reports require additional scopes and
 *   quota, and are intentionally out of scope for the initial import.
 *
 * Limitations documented in docs/INTEGRATIONS.md.
 */
export class YouTubeProvider extends SocialProvider {
  readonly provider = "youtube" as const;
  readonly baseUrl = "https://www.googleapis.com/youtube/v3";
  readonly requiresAppReview = []; // youtube.readonly is not sensitive for read-only use

  async getAccountProfile({ accessToken }: ProviderFetchInput): Promise<SocialAccountProfile> {
    const { ok, status, body } = await providerFetch({
      url: `${this.baseUrl}/channels?part=snippet,statistics&mine=true`,
      accessToken,
    });
    if (!ok) throw this.mapProviderError(new Response(body, { status }), body);

    const data = JSON.parse(body || "{}") as {
      items?: Array<{
        id: string;
        snippet: { title?: string; thumbnails?: { default?: { url: string } } };
        statistics?: { subscriberCount?: string; videoCount?: string; viewCount?: string };
      }>;
    };

    const channel = data.items?.[0];
    if (!channel) {
      throw new IntegrationError(
        "INTEGRATION_NO_YOUTUBE_CHANNEL",
        "No YouTube channel found for the authenticated Google account.",
        404,
        this.provider,
      );
    }

    return {
      platformAccountId: channel.id,
      username: channel.snippet?.title ?? "",
      name: channel.snippet?.title ?? null,
      profilePictureUrl: channel.snippet?.thumbnails?.default?.url ?? null,
      profileUrl: `https://youtube.com/channel/${channel.id}`,
      isVerified: null,
    };
  }

  async fetchMetrics({ accessToken, accountId }: ProviderMetricsInput): Promise<SocialMetrics> {
    const { ok, status, body } = await providerFetch({
      url: `${this.baseUrl}/channels?part=statistics&id=${accountId}`,
      accessToken,
    });
    if (!ok) throw this.mapProviderError(new Response(body, { status }), body);

    const data = JSON.parse(body || "{}") as {
      items?: Array<{ statistics?: { subscriberCount?: string; videoCount?: string; viewCount?: string } }>;
    };

    const stats = data.items?.[0]?.statistics ?? {};
    return {
      followersCount: stats.subscriberCount ? Number(stats.subscriberCount) : null,
      postsCount: stats.videoCount ? Number(stats.videoCount) : null,
      metricDate: new Date().toISOString().slice(0, 10),
    };
  }

  async refreshAccessToken({ refreshToken }: { refreshToken: string }): Promise<{
    accessToken: string;
    refreshToken?: string | null;
    expiresIn?: number | null;
  }> {
    // Google refresh requires client_id + client_secret; handled by the OAuth
    // service which has access to the credentials vault.
    throw new IntegrationError(
      "INTEGRATION_REFRESH_NOT_IMPLEMENTED",
      "YouTube token refresh is handled by the OAuth service (client credentials required).",
      501,
      this.provider,
    );
  }

  async revoke({ accessToken }: { accessToken: string }): Promise<void> {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, { method: "POST" });
    } catch {
      // Best effort.
    }
  }
}

// ---------------------------------------------------------------------------
// Provider registry
// ---------------------------------------------------------------------------

export const SOCIAL_PROVIDERS: Record<string, SocialProvider> = {
  instagram: new InstagramProvider(),
  tiktok: new TikTokProvider(),
  youtube: new YouTubeProvider(),
};

export function getSocialProvider(provider: IntegrationProvider): SocialProvider {
  const providerInstance = SOCIAL_PROVIDERS[provider];
  if (!providerInstance) {
    throw new IntegrationError(
      "INTEGRATION_SOCIAL_NOT_SUPPORTED",
      `Social provider "${provider}" is not supported.`,
      400,
      provider,
    );
  }
  return providerInstance;
}

export function isSocialProvider(provider: string): provider is IntegrationProvider {
  return provider in SOCIAL_PROVIDERS;
}
