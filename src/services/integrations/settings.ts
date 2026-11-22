/**
 * CALLBACX MARKETING — Integration settings service
 *
 * Platform-wide provider configuration. Admin-only.
 *
 * - Settings rows hold non-secret config (from email, webhook url patterns,
 *   platform fee percent, ...).
 * - Secrets (API keys, client secrets, webhook signing secrets) live in
 *   integration_credentials, encrypted server-side with AES-256-GCM.
 * - Providers are disabled by default; enabling one requires credentials and
 *   (where the provider demands it) administrator approval.
 *
 * Accepts an optional `client` parameter; defaults to getSupabaseClient().
 */

import { getSupabaseClient, getCachedProfileId } from "@/lib/supabase/client";
import { getSupabaseAdminClient } from "@/lib/supabase/client";
import { encryptCredential, decryptCredential } from "@/lib/integrations/vault";
import type {
  IntegrationSettingsRow,
  IntegrationProvider,
} from "@/lib/integrations/types";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
} from "@/lib/errors";
import type {
  IntegrationSettingUpdateInput,
  IntegrationCredentialSetInput,
} from "@/lib/validations";
import type { Database } from "@/lib/supabase/types/database";

type Client = any;
type SettingsRow = Database["public"]["Tables"]["integration_settings"]["Row"];
type CredentialsRow = Database["public"]["Tables"]["integration_credentials"]["Row"];

const SETTINGS_SELECT = `
  id, provider, label, description, config, is_enabled,
  requires_approval, approval_status, approved_at, approved_by,
  created_at, updated_at
`;

function mapSettingsRow(row: SettingsRow): IntegrationSettingsRow {
  return {
    id: row.id,
    provider: row.provider as IntegrationProvider,
    label: row.label,
    description: row.description ?? null,
    config: (row.config as Record<string, unknown>) ?? {},
    is_enabled: row.is_enabled,
    requires_approval: row.requires_approval,
    approval_status: row.approval_status as "pending" | "approved" | "rejected",
    approved_at: row.approved_at ?? null,
    approved_by: row.approved_by ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Settings (admin)
// ---------------------------------------------------------------------------

/**
 * List all provider settings. Staff only.
 */
export async function listIntegrationSettings(client?: Client): Promise<ServiceResult<IntegrationSettingsRow[]>> {
  const supabase = client ?? getSupabaseClient();

  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) return fail(Errors.authSessionRequired());
  if (!(await isStaff(supabase, profileId))) return fail(Errors.adminNotStaff());

  try {
    const { data, error } = await supabase
      .from("integration_settings")
      .select(SETTINGS_SELECT)
      .order("provider", { ascending: true });

    if (error) return fail(mapSupabaseError(error));
    return ok((data ?? []).map(mapSettingsRow));
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Get one provider setting. Staff only.
 */
export async function getIntegrationSetting(
  provider: IntegrationProvider,
  client?: Client
): Promise<ServiceResult<IntegrationSettingsRow | null>> {
  const supabase = client ?? getSupabaseClient();

  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) return fail(Errors.authSessionRequired());
  if (!(await isStaff(supabase, profileId))) return fail(Errors.adminNotStaff());

  try {
    const { data, error } = await supabase
      .from("integration_settings")
      .select(SETTINGS_SELECT)
      .eq("provider", provider)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    return ok(data ? mapSettingsRow(data) : null);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Update a provider setting (non-secret config only). Staff only.
 * Use setIntegrationCredential for secrets.
 */
export async function updateIntegrationSetting(
  provider: IntegrationProvider,
  input: IntegrationSettingUpdateInput,
  client?: Client
): Promise<ServiceResult<IntegrationSettingsRow>> {
  const supabase = client ?? getSupabaseClient();

  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) return fail(Errors.authSessionRequired());
  if (!(await isStaff(supabase, profileId))) return fail(Errors.adminNotStaff());

  const update: Record<string, unknown> = {};
  if (input.label !== undefined) update.label = input.label;
  if (input.description !== undefined) update.description = input.description;
  if (input.config !== undefined) update.config = input.config;
  if (input.is_enabled !== undefined) update.is_enabled = input.is_enabled;
  if (input.requires_approval !== undefined) update.requires_approval = input.requires_approval;
  if (input.approval_status !== undefined) {
    update.approval_status = input.approval_status;
    if (input.approval_status === "approved") {
      update.approved_at = new Date().toISOString();
      update.approved_by = profileId;
    } else {
      update.approved_at = null;
      update.approved_by = null;
    }
  }
  update.updated_at = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from("integration_settings")
      .update(update)
      .eq("provider", provider)
      .select(SETTINGS_SELECT)
      .single();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.notFound(`Integration setting "${provider}"`));

    return ok(mapSettingsRow(data));
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Set (encrypt and store) a provider credential. Staff only.
 * The value is encrypted with AES-256-GCM before being written.
 */
export async function setIntegrationCredential(
  input: IntegrationCredentialSetInput,
  client?: Client
): Promise<ServiceResult<void>> {
  const supabase = client ?? getSupabaseAdminClient();

  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) return fail(Errors.authSessionRequired());
  if (!(await isStaff(supabase, profileId))) return fail(Errors.adminNotStaff());

  let encrypted: { encryptedValue: string; iv: string; tag: string };
  try {
    encrypted = encryptCredential(input.value);
  } catch (error) {
    return fail(
      error instanceof Error
        ? Errors.internal("Credential encryption failed.", error)
        : Errors.internal("Credential encryption failed.")
    );
  }

  try {
    const { error } = await supabase
      .from("integration_credentials")
      .upsert(
        {
          provider: input.provider,
          credential_key: input.credential_key,
          encrypted_value: encrypted.encryptedValue,
          iv: encrypted.iv,
          tag: encrypted.tag,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "provider, credential_key" }
      );

    if (error) return fail(mapSupabaseError(error));
    return ok(undefined);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Get a decrypted provider credential. Staff only.
 * The plaintext value is returned in memory only — never logged.
 */
export async function getIntegrationCredential(
  provider: IntegrationProvider,
  credentialKey: string,
  client?: Client
): Promise<ServiceResult<string>> {
  const supabase = client ?? getSupabaseAdminClient();

  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) return fail(Errors.authSessionRequired());
  if (!(await isStaff(supabase, profileId))) return fail(Errors.adminNotStaff());

  return getCredentialPlaintext(provider, credentialKey, supabase);
}

/**
 * Server-side credential read without a user session.
 * For webhooks, sync jobs and other privileged server operations.
 * Callers must run in server-side code only.
 */
export async function getIntegrationCredentialServerSide(
  provider: IntegrationProvider,
  credentialKey: string
): Promise<ServiceResult<string>> {
  const supabase = getSupabaseAdminClient();
  return getCredentialPlaintext(provider, credentialKey, supabase);
}

/**
 * Server-side setting read without a user session.
 */
export async function getIntegrationSettingServerSide(
  provider: IntegrationProvider
): Promise<ServiceResult<IntegrationSettingsRow | null>> {
  const supabase = getSupabaseAdminClient();

  try {
    const { data, error } = await supabase
      .from("integration_settings")
      .select(SETTINGS_SELECT)
      .eq("provider", provider)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    return ok(data ? mapSettingsRow(data) : null);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

async function getCredentialPlaintext(
  provider: IntegrationProvider,
  credentialKey: string,
  supabase: Client
): Promise<ServiceResult<string>> {
  try {
    const { data, error } = await supabase
      .from("integration_credentials")
      .select("encrypted_value, iv, tag")
      .eq("provider", provider)
      .eq("credential_key", credentialKey)
      .maybeSingle();

    if (error) return fail(mapSupabaseError(error));
    if (!data) return fail(Errors.notFound(`Credential "${credentialKey}" for provider "${provider}"`));

    let plaintext: string;
    try {
      plaintext = decryptCredential({
        encryptedValue: data.encrypted_value,
        iv: data.iv,
        tag: data.tag,
      });
    } catch (error) {
      return fail(
        error instanceof Error
          ? Errors.internal("Credential decryption failed.", error)
          : Errors.internal("Credential decryption failed.")
      );
    }

    return ok(plaintext);
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

/**
 * Check whether a provider is usable: setting exists, enabled, approved (if
 * required), and credentials are present. Staff only.
 */
export async function getProviderReadiness(
  provider: IntegrationProvider,
  client?: Client
): Promise<ServiceResult<{
  provider: IntegrationProvider;
  configured: boolean;
  enabled: boolean;
  approvalStatus: string | null;
  requiresApproval: boolean;
  missing: string[];
}>> {
  const supabase = client ?? getSupabaseClient();

  const profileId = await getCurrentProfileId(supabase);
  if (!profileId) return fail(Errors.authSessionRequired());
  if (!(await isStaff(supabase, profileId))) return fail(Errors.adminNotStaff());

  const setting = await getIntegrationSetting(provider, supabase);
  if (setting.error || !setting.data) {
    return fail(Errors.notFound(`Integration setting "${provider}"`));
  }

  const missing: string[] = [];
  if (!setting.data.is_enabled) missing.push("Provider is not enabled.");
  if (setting.data.requires_approval && setting.data.approval_status !== "approved") {
    missing.push(`Provider approval is "${setting.data.approval_status}".`);
  }

  const credentials = await listCredentialsForProvider(provider, supabase);
  if (credentials.error) return fail(credentials.error);
  if (!credentials.data || credentials.data.length === 0) missing.push("No credentials configured.");

  return ok({
    provider,
    configured: missing.length === 0,
    enabled: setting.data.is_enabled,
    approvalStatus: setting.data.approval_status,
    requiresApproval: setting.data.requires_approval,
    missing,
  });
}

// ---------------------------------------------------------------------------
// Credentials listing (metadata only — never plaintext)
// ---------------------------------------------------------------------------

async function listCredentialsForProvider(
  provider: IntegrationProvider,
  supabase: Client
): Promise<ServiceResult<{ provider: string; credential_key: string; created_at: string }[]>> {
  try {
    const { data, error } = await supabase
      .from("integration_credentials")
      .select("provider, credential_key, created_at")
      .eq("provider", provider);

    if (error) return fail(mapSupabaseError(error));
    return ok((data ?? []).map((row: CredentialsRow) => ({
      provider: row.provider,
      credential_key: row.credential_key,
      created_at: row.created_at,
    })));
  } catch (error) {
    return fail(mapSupabaseError(error));
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getCurrentProfileId(supabase: Client): Promise<string | null> {
  return getCachedProfileId(supabase);
}

async function isStaff(supabase: Client, profileId: string): Promise<boolean> {
  const { data } = await supabase.rpc("is_staff", { p_profile: profileId });
  return data === true;
}

export { isStaff };
export type { IntegrationSettingsRow };
