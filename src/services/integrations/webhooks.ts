/**
 * CALLBACX TECHNOLOGY — Webhook processing service
 *
 * Idempotent ingestion of provider webhooks (Stripe, Resend, social
 * platforms, custom).
 *
 * - Every incoming event is recorded in integration_webhook_events before
 *   processing; (provider, event_id) is unique so the same webhook is
 *   processed exactly once.
 * - Signatures are verified where the provider signs webhooks
 *   (Stripe-Signature via src/services/integrations/stripe.ts; generic
 *   HMAC-SHA256 for others using a configured webhook secret).
 * - Handlers are registered per (provider, event_type). Failures are
 *   logged; one handler throwing does not prevent other events from being
 *   recorded.
 *
 * Route handlers should call processWebhook with the raw request body and
 * signature header.
 */

import { getSupabaseAdminClient } from "@/lib/supabase/client";
import { createHmac, timingSafeEqual } from "crypto";
import {
  Errors,
  fail,
  mapSupabaseError,
  ok,
  type ServiceResult,
} from "@/lib/errors";
import type { IntegrationProvider } from "@/lib/integrations/types";
import { getIntegrationCredential } from "./settings";

type Client = any;

export type WebhookHandler = (payload: {
  provider: string;
  eventType: string;
  data: unknown;
  created?: number | null;
}) => Promise<void> | void;

interface RegisteredHandler {
  eventType: string;
  handler: WebhookHandler;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const registry = new Map<string, RegisteredHandler[]>();

/**
 * Register a handler for (provider, event_type).
 * Multiple handlers may be registered for the same key; they run in order.
 */
export function registerWebhookHandler(
  provider: string,
  eventType: string,
  handler: WebhookHandler
): void {
  const key = `${provider}:${eventType}`;
  const handlers = registry.get(key) ?? [];
  handlers.push({ eventType, handler });
  registry.set(key, handlers);
}

/**
 * List registered keys (for debugging / health checks).
 */
export function listRegisteredWebhooks(): string[] {
  return Array.from(registry.keys());
}

// ---------------------------------------------------------------------------
// Processing
// ---------------------------------------------------------------------------

export interface ProcessWebhookInput {
  provider: string;
  rawBody: string | Buffer;
  signatureHeader: string | null;
  eventId: string;
  eventType: string;
  data: unknown;
  created?: number | null;
}

/**
 * Process an incoming webhook idempotently.
 * Returns { processed: boolean } where processed=false means the event was
 * already seen (duplicate) and skipped.
 */
export async function processWebhook(
  input: ProcessWebhookInput,
  client?: Client
): Promise<ServiceResult<{ processed: boolean; skipped: boolean }>> {
  const supabase = client ?? getSupabaseAdminClient();

  // Idempotency: record the event before processing so duplicates are
  // detected even if the handler is slow and the provider retries.
  const { data: existing } = await supabase
    .from("integration_webhook_events")
    .select("id, processed")
    .eq("provider", input.provider)
    .eq("event_id", input.eventId)
    .maybeSingle();

  if (existing) {
    if (existing.processed) {
      return ok({ processed: true, skipped: true });
    }
    // Previously recorded but not yet processed: mark and proceed below.
  } else {
    const { error } = await supabase.from("integration_webhook_events").insert({
      provider: input.provider,
      event_id: input.eventId,
      event_type: input.eventType,
      payload: input.data ?? {},
      processed: false,
    });
    if (error) return fail(mapSupabaseError(error));
  }

  // Signature verification when a secret is configured for the provider.
  const signatureValid = await verifyWebhookSignature(supabase, input);
  if (!signatureValid) {
    await markProcessed(supabase, input.provider, input.eventId, false);
    return fail(Errors.forbidden("Webhook signature verification failed."));
  }

  // Dispatch to registered handlers.
  const key = `${input.provider}:${input.eventType}`;
  const handlers = registry.get(key) ?? [];
  let lastError: unknown = null;

  for (const handler of handlers) {
    try {
      await handler.handler({
        provider: input.provider,
        eventType: input.eventType,
        data: input.data,
        created: input.created ?? null,
      });
    } catch (error) {
      lastError = error;
      console.error(
        `[integrations] webhook handler failed for ${input.provider}#${input.eventType}:`,
        error instanceof Error ? error.stack : String(error)
      );
    }
  }

  await markProcessed(supabase, input.provider, input.eventId, true);

  if (lastError) {
    return fail(
      Errors.internal("One or more webhook handlers failed.", lastError instanceof Error ? lastError : new Error(String(lastError)))
    );
  }

  return ok({ processed: true, skipped: false });
}

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

async function verifyWebhookSignature(
  supabase: Client,
  input: ProcessWebhookInput
): Promise<boolean> {
  // Stripe signatures are verified by the Stripe service using the Stripe
  // secret; route handlers for Stripe call verifyStripeWebhook directly and
  // pass signatureHeader: null here to skip re-verification.
  if (input.provider === "stripe") return true;

  const secret = await getIntegrationCredential(input.provider as IntegrationProvider, "webhook_signing_secret", supabase);
  if (secret.error) {
    return true;
  }
  if (!secret.data) {
    return true;
  }

  if (!input.signatureHeader) return false;

  const body = input.rawBody instanceof Buffer ? input.rawBody.toString("utf8") : input.rawBody;
  const signingKey: string = secret.data as string;
  const expected = createHmac("sha256", signingKey).update(body).digest("hex");

  return constantTimeEquals(input.signatureHeader, expected);
}

function constantTimeEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

async function markProcessed(
  supabase: Client,
  provider: string,
  eventId: string,
  processed: boolean,
): Promise<void> {
  await supabase
    .from("integration_webhook_events")
    .update({
      processed,
      processed_at: processed ? new Date().toISOString() : null,
    })
    .eq("provider", provider)
    .eq("event_id", eventId);
}
