/**
 * CALLBACX — POST /api/webhooks/stripe
 *
 * Stripe webhook receiver.
 * - Verifies the Stripe signature (StripeSignatureVerificationError → 400).
 * - Deduplicates by (provider, event_id) via the idempotent ingestion guard.
 * - Applies the financial outcome server-side (payment → succeeded/failed,
 *   refund → refunded/partially_refunded) through the payments service.
 * - Never trusts client-side payment confirmation: authoritative state changes
 *   only happen here, after signature verification.
 */

import { getStripeClient, getStripeWebhookSecret } from "@/lib/payments/stripe";
import { withErrorHandler } from "@/lib/errors";
import { applyPaymentWebhookOutcome } from "@/services/payments";

export const dynamic = "force-dynamic";

type StripeEventLike = {
  id: string;
  type: string;
  data?: { object?: StripeProviderObject };
};

type StripeProviderObject = {
  id?: string;
  amount?: number;
  amount_received?: number;
  amount_refunded?: number;
  amount_total?: number;
  currency?: string;
  status?: string;
  metadata?: Record<string, string>;
  payment_intent?: string | null;
};

type WebhookOutcome = {
  provider: string;
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: "pending" | "succeeded" | "failed" | "refunded" | "partially_refunded" | "cancelled";
  providerPaymentId: string;
  amount: number;
  currency: string;
  collaborationId?: string | null;
  invoiceId?: string | null;
};

function toOutcome(event: StripeEventLike): WebhookOutcome | null {
  const object = (event.data?.object ?? {}) as StripeProviderObject;
  const metadata = (object.metadata ?? {}) as Record<string, string>;

  switch (event.type) {
    case "payment_intent.succeeded": {
      return {
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        payload: object,
        status: "succeeded",
        providerPaymentId: object.id ?? event.id,
        amount: object.amount_received ?? object.amount ?? 0,
        currency: object.currency ?? "USD",
        collaborationId: metadata.collaboration_id ?? null,
        invoiceId: metadata.invoice_id ?? null,
      };
    }
    case "payment_intent.payment_failed": {
      return {
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        payload: object,
        status: "failed",
        providerPaymentId: object.id ?? event.id,
        amount: object.amount ?? 0,
        currency: object.currency ?? "USD",
        collaborationId: metadata.collaboration_id ?? null,
        invoiceId: metadata.invoice_id ?? null,
      };
    }
    case "payment_intent.refunded": {
      return {
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        payload: object,
        status: "refunded",
        providerPaymentId: object.id ?? event.id,
        amount: object.amount_refunded ?? object.amount ?? 0,
        currency: object.currency ?? "USD",
        collaborationId: metadata.collaboration_id ?? null,
        invoiceId: metadata.invoice_id ?? null,
      };
    }
    case "payment_intent.partially_refunded": {
      return {
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        payload: object,
        status: "partially_refunded",
        providerPaymentId: object.id ?? event.id,
        amount: object.amount_refunded ?? object.amount ?? 0,
        currency: object.currency ?? "USD",
        collaborationId: metadata.collaboration_id ?? null,
        invoiceId: metadata.invoice_id ?? null,
      };
    }
    case "checkout.session.completed": {
      const pi = object.payment_intent;
      return {
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        payload: object,
        status: "succeeded",
        providerPaymentId: String(pi ?? object.id ?? event.id),
        amount: object.amount_total ?? 0,
        currency: object.currency ?? "USD",
        collaborationId: metadata.collaboration_id ?? null,
        invoiceId: metadata.invoice_id ?? null,
      };
    }
    case "checkout.session.expired": {
      const cs = object as StripeProviderObject;
      return {
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        payload: object,
        status: "cancelled",
        providerPaymentId: String(cs.id ?? event.id),
        amount: cs.amount_total ?? 0,
        currency: cs.currency ?? "USD",
        collaborationId: metadata.collaboration_id ?? null,
        invoiceId: metadata.invoice_id ?? null,
      };
    }
    default:
      return null;
  }
}

export const POST = withErrorHandler(async (request: Request) => {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json(
      { error: { code: "WEBHOOK_MISSING_SIGNATURE", message: "Missing stripe-signature header." } },
      { status: 400 },
    );
  }

  const stripe = getStripeClient();
  const secret = getStripeWebhookSecret();

  let event: StripeEventLike;
  try {
    const constructed = stripe.webhooks.constructEvent(rawBody, signature, secret);
    event = constructed as unknown as StripeEventLike;
  } catch (error) {
    const err = error as { type?: string };
    if (err?.type === "invalid_signature") {
      return Response.json(
        { error: { code: "WEBHOOK_INVALID_SIGNATURE", message: "Invalid Stripe webhook signature." } },
        { status: 400 },
      );
    }
    throw error;
  }

  const outcome = toOutcome(event);
  if (!outcome) {
    // Unhandled event type — acknowledge without financial mutation.
    return Response.json({ received: true });
  }

  const result = await applyPaymentWebhookOutcome(outcome);
  if (result.error) throw result.error;

  return Response.json({ received: true });
});
