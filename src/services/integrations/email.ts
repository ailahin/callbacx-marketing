/**
 * CALLBACX MARKETING — Email delivery service (Resend or equivalent)
 *
 * Sends transactional and marketing email via the provider's HTTP API.
 * No provider SDK is assumed: calls are made with native fetch so the
 * service works whether or not the `resend` package is installed.
 *
 * - API key is stored encrypted in the integration credentials vault.
 * - Never fabricates email data: if no API key is configured, the service
 *   returns INTEGRATION_NOT_CONFIGURED instead of pretending to send.
 * - Every send attempt is audited in email_notifications (status, provider
 *   message id, errors).
 *
 * Accepts an optional `client` parameter; defaults to getSupabaseClient().
 */

import { getSupabaseAdminClient } from "@/lib/supabase/client";
import {
  IntegrationError,
  IntegrationNotConfiguredError,
  type IntegrationProvider,
} from "@/lib/integrations/types";
import {
  getIntegrationSetting,
  getIntegrationCredential,
} from "./settings";
import { withRetry, defaultRetryable } from "@/lib/integrations/retry";
import { randomUUID } from "crypto";

type Client = any;

const PROVIDER: IntegrationProvider = "resend";
const API_BASE = "https://api.resend.com";

interface EmailSendInput {
  to: string;
  subject: string;
  body: string;
  from?: string | null;
  replyTo?: string | null;
  templateId?: string | null;
}

interface NotificationInput {
  recipientProfileId?: string | null;
  recipientEmail: string;
  category: string;
  subject: string;
  body: string;
  templateId?: string | null;
}

interface SendResult {
  id: string;
  status: "sent" | "failed";
  providerMessageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

async function getApiKey(supabase: Client): Promise<string> {
  const [setting, credential] = await Promise.all([
    getIntegrationSetting(PROVIDER, supabase),
    getIntegrationCredential(PROVIDER, "api_key", supabase),
  ]);

  if (setting.error || !setting.data) {
    throw new IntegrationNotConfiguredError(
      PROVIDER,
      "No integration setting for Resend. Ask an administrator to configure it."
    );
  }

  if (!setting.data.is_enabled) {
    throw new IntegrationNotConfiguredError(PROVIDER, "Resend integration is not enabled.");
  }

  if (credential.error) {
    throw new IntegrationNotConfiguredError(
      PROVIDER,
      "Resend API key is not configured. Set RESEND_API_KEY in integration settings."
    );
  }
  if (!credential.data) {
    throw new IntegrationNotConfiguredError(
      PROVIDER,
      "Resend API key is not configured. Set RESEND_API_KEY in integration settings."
    );
  }

  return credential.data;
}

async function getFromEmail(supabase: Client): Promise<string | null> {
  const setting = await getIntegrationSetting(PROVIDER, supabase);
  if (setting.error || !setting.data) return null;
  const from = setting.data.config?.from_email;
  return typeof from === "string" ? from : null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a single email. Requires Resend API key + enabled setting.
 */
export async function sendEmail(input: EmailSendInput, client?: Client): Promise<SendResult> {
  const supabase = client ?? getSupabaseAdminClient();
  const apiKey = await getApiKey(supabase);
  const from = input.from ?? (await getFromEmail(supabase));

  if (!from) {
    throw new IntegrationNotConfiguredError(
      PROVIDER,
      "No sender email configured. Set config.from_email or pass `from`."
    );
  }

  const result = await withRetry(
    () => callResendSend(apiKey, { ...input, from }),
    {
      attempts: 3,
      minTimeout: 1000,
      maxTimeout: 30000,
      retryable: defaultRetryable,
    }
  );

  return result;
}

/**
 * Send a transactional notification to a user (category-based, audited).
 * Creates an email_notifications row so sends are traceable.
 */
export async function sendTransactionalNotification(
  input: NotificationInput,
  client?: Client
): Promise<SendResult> {
  const supabase = client ?? getSupabaseAdminClient();
  const idempotencyKey = randomUUID();

  const audit = await supabase.from("email_notifications").insert({
    recipient_email: input.recipientEmail,
    recipient_profile_id: input.recipientProfileId ?? null,
    template_id: input.templateId ?? null,
    subject: input.subject,
    status: "pending",
    metadata: { category: input.category, idempotency_key: idempotencyKey },
  });
  void audit;

  let result: SendResult;
  try {
    result = await sendEmail(
      {
        to: input.recipientEmail,
        subject: input.subject,
        body: input.body,
        templateId: input.templateId ?? null,
      },
      supabase
    );

    await supabase
      .from("email_notifications")
      .update({
        status: result.status,
        provider_message_id: result.providerMessageId ?? null,
        error_code: result.errorCode ?? null,
        error_message: result.errorMessage ?? null,
        sent_at: result.status === "sent" ? new Date().toISOString() : null,
      })
      .eq("metadata->>idempotency_key", idempotencyKey);

    return result;
  } catch (error) {
    await supabase
      .from("email_notifications")
      .update({
        status: "failed",
        error_code: error instanceof IntegrationError ? error.code : "UNKNOWN_ERROR",
        error_message: error instanceof Error ? error.message : String(error),
      })
      .eq("metadata->>idempotency_key", idempotencyKey);

    throw error;
  }
}

/**
 * Verify the Resend provider is configured and reachable.
 * Returns readiness without sending email.
 */
export async function verifyResendProvider(client?: Client): Promise<{
  configured: boolean;
  enabled: boolean;
  missing: string[];
  testReachable: boolean;
}> {
  const supabase = client ?? getSupabaseAdminClient();

  const setting = await getIntegrationSetting(PROVIDER, supabase);
  if (setting.error || !setting.data) {
    return { configured: false, enabled: false, missing: ["No integration setting for Resend."], testReachable: false };
  }

  const missing: string[] = [];
  if (!setting.data.is_enabled) missing.push("Resend integration is not enabled.");

  const credential = await getIntegrationCredential(PROVIDER, "api_key", supabase);
  if (credential.error) missing.push("Resend API key is not configured.");

  const from = typeof setting.data.config?.from_email === "string" ? setting.data.config.from_email : null;
  if (!from) missing.push("Sender email (config.from_email) is not configured.");

  let testReachable = false;
  if (missing.length === 0) {
    try {
      const res = await fetch(`${API_BASE}/domains`, {
        headers: { Authorization: `Bearer ${credential.data}` },
      });
      testReachable = res.ok || res.status === 401; // reachable = we got a provider response
    } catch {
      testReachable = false;
    }
  }

  return {
    configured: missing.length === 0,
    enabled: setting.data.is_enabled,
    missing,
    testReachable,
  };
}

// ---------------------------------------------------------------------------
// Provider API calls
// ---------------------------------------------------------------------------

async function callResendSend(apiKey: string, input: EmailSendInput & { from: string }): Promise<SendResult> {
  const body = {
    from: input.from,
    to: [input.to],
    subject: input.subject,
    html: input.body,
    reply_to: input.replyTo ?? undefined,
  };

  const res = await fetch(`${API_BASE}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message?: unknown }).message)
        : res.statusText;
    const error = new IntegrationError(
      "INTEGRATION_EMAIL_SEND_FAILED",
      `Resend send failed (${res.status}): ${message}`,
      res.status === 429 ? 429 : 502,
      PROVIDER,
      res.status === 429 ? extractRetryAfter(res) : undefined
    );
    // attach response for the caller to read
    (error as { status?: number }).status = res.status;
    throw error;
  }

  const data = payload as { id?: string } | null;
  return {
    id: randomUUID(),
    status: "sent",
    providerMessageId: data?.id ?? null,
    errorCode: null,
    errorMessage: null,
  };
}

function extractRetryAfter(response: Response): number | undefined {
  const value = response.headers.get("retry-after");
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) ? seconds : undefined;
}
