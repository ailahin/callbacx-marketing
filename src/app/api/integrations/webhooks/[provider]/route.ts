/**
 * CALLBACX — POST /api/integrations/webhooks/[provider]
 *
 * Idempotent webhook ingestion for any provider (Stripe, Resend, social,
 * custom).
 *
 * Stripe webhooks: the raw body is verified against the Stripe webhook
 * signing secret (stored encrypted in the credentials vault) before the
 * event is trusted.
 * Other providers: verified against their configured webhook signing
 * secret inside processWebhook; accepted unsigned when no secret is
 * configured (see docs/INTEGRATIONS.md).
 *
 * No user session is required — webhooks are server-to-server callbacks.
 */

import { withErrorHandler } from "@/lib/errors";
import { Errors } from "@/lib/errors";
import { processWebhook } from "@/services/integrations";
import { verifyStripeWebhook } from "@/services/integrations";
import { integrationWebhookProcessSchema } from "@/lib/validations";
import { getIntegrationCredentialServerSide } from "@/services/integrations/settings";
import { getSupabaseAdminClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (request: Request, route: { params: Promise<{ provider: string }> }) => {
  const { provider } = await route.params;
  const signatureHeader = request.headers.get("stripe-signature") ?? request.headers.get("x-signature") ?? null;
  const rawBody = await request.text();

  let eventId: string;
  let eventType: string;
  let data: unknown;
  let created: number | undefined;

  if (provider === "stripe") {
    // Stripe signs the raw body; verify before trusting the payload.
    const secret = await getStripeWebhookSecret();
    const event = verifyStripeWebhook(rawBody, signatureHeader, secret);
    eventId = event.id;
    eventType = event.type;
    data = event.data;
    created = event.created;
  } else {
    const body = integrationWebhookProcessSchema.parse(JSON.parse(rawBody || "{}"));
    eventId = body.event_id;
    eventType = body.event_type;
    data = body.payload;
  }

  const result = await processWebhook(
    {
      provider,
      rawBody,
      signatureHeader: provider === "stripe" ? null : signatureHeader,
      eventId,
      eventType,
      data,
      created,
    },
    getSupabaseAdminClient()
  );

  if (result.error) throw result.error;
  return Response.json({ data: result.data });
});

async function getStripeWebhookSecret(): Promise<string> {
  const credential = await getIntegrationCredentialServerSide("stripe", "webhook_signing_secret");
  if (credential.error) throw Errors.internal("Stripe webhook signing secret is not configured.");
  if (!credential.data) throw Errors.internal("Stripe webhook signing secret is not configured.");
  return credential.data;
}
