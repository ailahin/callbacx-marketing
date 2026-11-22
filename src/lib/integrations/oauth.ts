/**
 * CALLBACX MARKETING — OAuth state & PKCE helper
 *
 * Short-lived, one-time OAuth authorization states stored server-side.
 * Used by the OAuth authorize/callback route handlers to:
 * 1. Bind an authorization request to a profile (and a return URL).
 * 2. Store the PKCE code verifier (RFC 7636) where the provider supports it.
 * 3. Validate state on callback and consume it exactly once (replay protection).
 *
 * States expire after 10 minutes (configurable).
 */

import { randomBytes } from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/client";
import { IntegrationError } from "./types";

type Client = any;

const STATE_TTL_SECONDS = 10 * 60; // 10 minutes

export interface OAuthStatePayload {
  provider: string;
  profileId?: string | null;
  redirectTo?: string | null;
  codeVerifier?: string | null;
}

/**
 * Generate a cryptographically random OAuth state value.
 */
export function generateOAuthState(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Generate a PKCE code verifier (RFC 7636).
 */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Derive the PKCE code challenge from a verifier (SHA-256, base64url).
 * Used when building the authorization URL.
 */
export async function codeChallengeFromVerifier(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Store a new OAuth state. Returns the state value to embed in the
 * authorization URL.
 */
export async function createOAuthState(
  payload: OAuthStatePayload,
  client?: Client
): Promise<string> {
  const supabase = client ?? getSupabaseAdminClient();
  const state = generateOAuthState();
  const codeVerifier = payload.codeVerifier ?? generateCodeVerifier();
  const expiresAt = new Date(Date.now() + STATE_TTL_SECONDS * 1000).toISOString();

  const { error } = await supabase.from("integration_oauth_states").insert({
    provider: payload.provider,
    state,
    code_verifier: codeVerifier,
    profile_id: payload.profileId ?? null,
    redirect_to: payload.redirectTo ?? null,
    expires_at: expiresAt,
  });

  if (error) {
    throw new IntegrationError(
      "INTEGRATION_OAUTH_STATE_STORE_FAILED",
      "Could not store OAuth state.",
      500,
      payload.provider,
      undefined,
    );
  }

  return state;
}

/**
 * Validate and consume an OAuth state exactly once.
 * Returns the stored payload, or throws if missing/expired/tampered.
 */
export async function consumeOAuthState(
  state: string,
  client?: Client
): Promise<OAuthStatePayload> {
  const supabase = client ?? getSupabaseAdminClient();

  // Lock the row for update so concurrent callback requests cannot both
  // consume the same state (replay protection).
  const { data, error } = await supabase
    .from("integration_oauth_states")
    .select("*, provider, code_verifier, profile_id, redirect_to, expires_at")
    .eq("state", state)
    .maybeSingle();

  if (error) {
    throw new IntegrationError(
      "INTEGRATION_OAUTH_STATE_LOAD_FAILED",
      "Could not load OAuth state.",
      500,
      undefined,
      undefined,
    );
  }

  if (!data) {
    throw new IntegrationError(
      "INTEGRATION_OAUTH_STATE_INVALID",
      "OAuth state is invalid or has already been used.",
      400,
    );
  }

  const now = new Date().toISOString();
  if (data.expires_at < now) {
    await supabase.from("integration_oauth_states").delete().eq("state", state);
    throw new IntegrationError(
      "INTEGRATION_OAUTH_STATE_EXPIRED",
      "OAuth state has expired. Start the connection flow again.",
      410,
    );
  }

  // Consume (delete) the state so it cannot be reused.
  await supabase.from("integration_oauth_states").delete().eq("state", state);

  return {
    provider: data.provider,
    profileId: data.profile_id ?? null,
    redirectTo: data.redirect_to ?? null,
    codeVerifier: data.code_verifier ?? null,
  };
}

/**
 * Clean up expired states (callable from a scheduled job / admin action).
 */
export async function purgeExpiredOAuthStates(client?: Client): Promise<number> {
  const supabase = client ?? getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("integration_oauth_states")
    .delete()
    .lt("expires_at", now)
    .select("id");

  if (error) {
    throw new IntegrationError(
      "INTEGRATION_OAUTH_STATE_PURGE_FAILED",
      "Could not purge expired OAuth states.",
      500,
      undefined,
      undefined,
    );
  }

  return data?.length ?? 0;
}

// ---------------------------------------------------------------------------
// Browser-safe base64 helper (Next.js server runtime has btoa/atob)
// ---------------------------------------------------------------------------

function btoa(input: string): string {
  return Buffer.from(input, "binary").toString("base64");
}
