/**
 * CALLBACX TECHNOLOGY — Stripe integration (server-side only)
 *
 * Server-side payment processing primitives. All monetary values handled by
 * the platform are decimals / numbers rounded to 2dp — never floats for money.
 *
 * Security:
 * - STRIPE_SECRET_KEY is server-only (never exposed to the browser).
 * - STRIPE_WEBHOOK_SECRET is required to verify webhook signatures.
 * - Live keys (sk_live_...) must only be used after provider account
 *   verification, business verification and end-to-end tests are complete.
 */

import Stripe from "stripe";
import { IntegrationError, IntegrationNotConfiguredError } from "@/lib/integrations/types";

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new IntegrationNotConfiguredError("stripe", "STRIPE_SECRET_KEY is not configured.");
  }

  if (_stripe) return _stripe;

  _stripe = new Stripe(secretKey, {
    typescript: true,
    maxNetworkRetries: 2,
  });

  return _stripe;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new IntegrationError(
      "INTEGRATION_WEBHOOK_SECRET_MISSING",
      "STRIPE_WEBHOOK_SECRET is not configured. Webhook endpoints cannot be verified without it.",
      500,
      "stripe",
    );
  }
  return secret;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Default platform commission rate (10%) when no setting row has been saved yet. */
export const DEFAULT_PLATFORM_FEE_PERCENT = 10;

export function getPlatformFeePercentFromEnv(): number {
  const raw = process.env.STRIPE_PLATFORM_FEE_PERCENT;
  const parsed = raw ? Number(raw) : DEFAULT_PLATFORM_FEE_PERCENT;
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return DEFAULT_PLATFORM_FEE_PERCENT;
  return parsed;
}

export function isStripeLiveMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_live_");
}

// ---------------------------------------------------------------------------
// Money helpers (server-side, decimal-safe rounding to cents)
// ---------------------------------------------------------------------------

export function toMinorUnits(amount: number, currency: string = "USD"): number {
  // Stripe expects integer minor units (cents for USD).
  const minor = Math.round(amount * 100);
  if (!Number.isFinite(minor) || minor < 0) return 0;
  return minor;
}

export function fromMinorUnits(minor: number, currency: string = "USD"): number {
  const divisor = currency === "JPY" ? 1 : 100;
  return minor / divisor;
}

/**
 * Compute platform fee + creator net amount from a gross amount and a
 * commission rate (fraction, e.g. 0.10). Rounded to 2 decimal places.
 */
export function computeSplit(amount: number, rateFraction: number): { fee: number; creatorAmount: number } {
  const safeRate = Math.min(Math.max(rateFraction, 0), 1);
  const fee = Math.round(amount * 100 * safeRate) / 100;
  const creatorAmount = Math.round((amount - fee) * 100) / 100;
  return { fee, creatorAmount };
}

// ---------------------------------------------------------------------------
// Supported webhook event types → internal payment status mapping
// ---------------------------------------------------------------------------

export type StripeWebhookEventName =
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "payment_intent.refunded"
  | "payment_intent.partially_refunded"
  | "checkout.session.completed"
  | "checkout.session.expired";

export interface StripeWebhookOutcome {
  eventType: StripeWebhookEventName;
  /** Provider payment reference (PaymentIntent id or Checkout Session id). */
  providerPaymentId: string;
  /** Internal payment status derived from the provider event. */
  status:
    | "pending"
    | "succeeded"
    | "failed"
    | "refunded"
    | "partially_refunded"
    | "cancelled";
  amount: number;
  currency: string;
  /** Raw provider payload for audit trail. */
  payload: Record<string, unknown>;
  /** Idempotency key derived deterministically from provider + event id. */
  idempotencyKey: string;
}
