/**
 * CALLBACX MARKETING — Auth service
 *
 * Secure registration, login, email verification, and password recovery.
 * Uses the Supabase anon key for client-facing auth flows.
 * The service-role (admin) client is used ONLY in server-side functions
 * and never exposed to the browser.
 *
 * All functions accept an optional `client` parameter so route handlers can
 * pass a cookie-bound server client; otherwise `getSupabaseClient()` is used.
 *
 * All functions return ServiceResult<T> for consistent error handling.
 */

import { getSupabaseClient } from "@/lib/supabase/client";
import { getSupabaseAdminClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types/database";
import type { Profiles } from "@/lib/supabase/types/database";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceError,
  type ServiceResult,
} from "@/lib/errors";
import type { SignupInput, LoginInput, ResetPasswordInput, UpdatePasswordInput } from "@/lib/validations";

type Client = any;

// ---------------------------------------------------------------------------
// Client-side auth (anon key — safe for browser and server components)
// ---------------------------------------------------------------------------

/**
 * Register a new user. Creates the auth identity via Supabase Auth, then
 * creates the linked public profile. Profile insert relies on RLS
 * (profiles_own_insert: auth.uid() = auth_user_id).
 */
export async function signUp(
  input: SignupInput,
  client?: Client
): Promise<ServiceResult<{ userId: string }>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { full_name: input.full_name },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify`,
      },
    });

    if (error) {
      return fail(mapAuthError(error));
    }

    if (!data.user) {
      return fail(Errors.internal("Failed to create account."));
    }

    // Create the public profile linked to the auth user.
    // RLS allows the authenticated user to insert their own profile.
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: data.user.id,
        auth_user_id: data.user.id,
        full_name: input.full_name,
        is_public: true,
        status: "active",
      });

    if (profileError) {
      console.error("[auth.signUp] Profile creation failed:", profileError);
      // Don't block signup; user can complete profile later.
    }

    return ok({ userId: data.user.id });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Sign in with email and password.
 */
export async function signIn(
  input: LoginInput,
  client?: Client
): Promise<ServiceResult<{ accessToken: string; expiresAt: number }>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      return fail(mapAuthError(error));
    }

    if (!data.session || !data.user) {
      return fail(Errors.authInvalidCredentials());
    }

    return ok({
      accessToken: data.session.access_token,
      expiresAt: data.session.expires_at || 0,
    });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Sign out the current user.
 */
export async function signOut(client?: Client): Promise<ServiceResult<void>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { error } = await supabase.auth.signOut();
    if (error) return fail(mapSupabaseError(error));
    return ok(undefined);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Request a password reset email. Supabase sends a magic link to the user.
 * Never reveals whether the email exists (Supabase handles this generically).
 */
export async function resetPassword(
  input: ResetPasswordInput,
  client?: Client
): Promise<ServiceResult<void>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    if (error) return fail(mapSupabaseError(error));

    // Always return success to avoid email enumeration.
    return ok(undefined);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Update the password of the currently authenticated user.
 * Requires a valid session (user must be signed in).
 */
export async function updatePassword(
  input: UpdatePasswordInput,
  client?: Client
): Promise<ServiceResult<void>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { error } = await supabase.auth.updateUser({
      password: input.new_password,
    });

    if (error) return fail(mapSupabaseError(error));
    return ok(undefined);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Get the current session (access token + expiry).
 */
export async function getSession(
  client?: Client
): Promise<ServiceResult<{ accessToken: string | null; expiresAt: number | null }>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return fail(mapSupabaseError(error));

    return ok({
      accessToken: data.session?.access_token ?? null,
      expiresAt: data.session?.expires_at ?? null,
    });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Get the currently authenticated user's auth identity.
 */
export async function getCurrentAuthUser(
  client?: Client
): Promise<ServiceResult<{ id: string; email: string | null }>> {
  const supabase = client ?? getSupabaseClient();

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return fail(mapSupabaseError(error));

    if (!data.user) {
      return fail(Errors.authSessionRequired());
    }

    return ok({ id: data.user.id, email: data.user.email ?? null });
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Server-side auth (admin client — service role, server-only)
// ---------------------------------------------------------------------------

/**
 * Verify an email verification token server-side.
 * Called from API routes (never from the browser).
 */
export async function verifyEmail(input: {
  tokenHash: string;
  type: "signup" | "recovery";
}): Promise<ServiceResult<void>> {
  // Admin client required: verifying a token bypasses normal auth flow.
  const supabase = getSupabaseAdminClient();

  try {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: input.tokenHash,
      type: input.type === "signup" ? "signup" : "recovery",
    });

    if (error) return fail(mapSupabaseError(error));
    return ok(undefined);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Resend email verification. Server-side only (rate-limited by Supabase).
 */
export async function resendVerification(email: string): Promise<ServiceResult<void>> {
  const supabase = getSupabaseAdminClient();

  try {
    const { error } = await supabase.auth.resend({
      email,
      type: "signup",
    });

    if (error) return fail(mapSupabaseError(error));

    // Always return success to avoid email enumeration.
    return ok(undefined);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Create a profile for an existing auth user (server-side, e.g. after
 * admin-created accounts or post-signup completion).
 * Uses the admin client so it works even if RLS profile insert is restricted.
 */
export async function createProfileServerSide(profile: {
  id: string;
  authUserId: string;
  fullName?: string | null;
  isPublic?: boolean;
}): Promise<ServiceResult<Profiles>> {
  const supabase = getSupabaseAdminClient();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: profile.id,
        auth_user_id: profile.authUserId,
        full_name: profile.fullName ?? null,
        is_public: profile.isPublic ?? true,
        status: "active",
      })
      .select("*")
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.internal("Profile was not created."));

    return ok(data);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapAuthError(error: Error): ServiceError {
  const message = error.message || "Authentication failed.";

  const lower = message.toLowerCase();

  if (lower.includes("invalid login") || lower.includes("wrong password")) {
    return Errors.authInvalidCredentials();
  }
  if (lower.includes("already registered") || lower.includes("user already exists")) {
    return Errors.authEmailExists();
  }
  if (lower.includes("email not confirmed") || lower.includes("email_unconfirmed")) {
    return Errors.authEmailUnverified();
  }
  if (lower.includes("weak password") || lower.includes("password should")) {
    return Errors.authWeakPassword();
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return Errors.internal("Too many attempts. Please try again later.", error);
  }

  return Errors.internal(message, error);
}


