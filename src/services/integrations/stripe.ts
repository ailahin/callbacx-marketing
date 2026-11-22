/**
 * CALLBACX TECHNOLOGY — Stripe payment integration
 *
 * Calls the Stripe API over HTTP (no `stripe` SDK assumed).
 *
 * - Secret key stored encrypted in the integration credentials vault.
 * - Idempotency keys on every mutating call (Stripe Idempotency-Key header).
 * - Webhook signature verification (Stripe-Signature header, HMAC-SHA256).
 * - No card data is ever stored or handled by this service.
 * - Never fabricates payment data: missing key returns
 *   INTEGRATION_NOT_CONFIGURED.
 *
 * Recording transactions to payment_transactions is done by the webhook
 * handler (see src/app/api/integrations/webhooks) after provider
 * confirmation, matching the existing payments service contract.
 *
 * Accepts an optional `client` parameter; defaults to getSupabaseClient().
 */

import { getSupabaseAdminClient } from "@/lib/supabase/client";
import {
  createHmac,
  timingSafeEqual,
} from "crypto";
import {
  IntegrationError,
  IntegrationNotConfiguredError,
  type IntegrationProvider,
} from "@/lib/integrations/types";
import {
  getIntegrationSetting,
  getIntegrationCredential,
  getIntegrationCredentialServerSide,
  getIntegrationSettingServerSide,
} from "./settings";
import { withRetry, defaultRetryable } from "@/lib/integrations/retry";

type Client = any;

const PROVIDER: IntegrationProvider = "stripe";
const API_BASE = "https://api.stripe.com/v1";

interface StripePaymentIntentInput {
  amount: number; // minor units (cents)
  currency: string;
  customer?: string | null;
  invoiceId?: string | null;
  collaborationId?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown>;
  idempotencyKey: string;
}

interface StripePayoutInput {
  amount: number; // minor units
  currency: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
  idempotencyKey: string;
}

interface PaymentIntentResult {
  id: string;
  status: string;
  amount: number;
  currency: string;
  clientSecret?: string | null;
  latestCharge?: string | null;
  metadata: Record<string, unknown>;
}

interface PayoutResult {
  id: string;
  status: string;
  amount: number;
  currency: string;
  arrivalDate?: string | null;
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

async function getSecretKey(): Promise<string> {
  const [setting, credential] = await Promise.all([
    getIntegrationSettingServerSide(PROVIDER),
    getIntegrationCredentialServerSide(PROVIDER, "secret_key"),
  ]);

  if (setting.error || !setting.data) {
    throw new IntegrationNotConfiguredError(
      PROVIDER,
      "No integration setting for Stripe. Ask an administrator to configure it."
    );
  }

  if (!setting.data.is_enabled) {
    throw new IntegrationNotConfiguredError(PROVIDER, "Stripe integration is not enabled.");
  }
  if (setting.data.requires_approval && setting.data.approval_status !== "approved") {
    throw new IntegrationNotConfiguredError(
      PROVIDER,
      `Stripe approval is "${setting.data.approval_status}". An administrator must approve it first.`
    );
  }

  if (credential.error) {
    throw new IntegrationNotConfiguredError(
      PROVIDER,
      "Stripe secret key is not configured. Set STRIPE_SECRET_KEY in integration settings."
    );
  }
  if (!credential.data) {
    throw new IntegrationNotConfiguredError(
      PROVIDER,
      "Stripe secret key is not configured. Set STRIPE_SECRET_KEY in integration settings."
    );
  }

  return credential.data;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a Stripe PaymentIntent. Idempotent via idempotency key.
 */
export async function createPaymentIntent(
  input: StripePaymentIntentInput
): Promise<PaymentIntentResult> {
  const secretKey = await getSecretKey();

  const body = new URLSearchParams({
    amount: String(Math.round(input.amount)),
    currency: input.currency,
    ...(input.customer ? { customer: input.customer } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.metadata ? { metadata: JSON.stringify(input.metadata) } : {}),
  });

  const result = await withRetry(
    () => stripeRequest("POST", "/payment_intents", secretKey, body, input.idempotencyKey),
    { attempts: 3, minTimeout: 1000, maxTimeout: 30000, retryable: defaultRetryable }
  );

  return mapPaymentIntent(result.data);
}

/**
 * Retrieve a PaymentIntent by id (e.g. to confirm fulfillment).
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<PaymentIntentResult> {
  const secretKey = await getSecretKey();

  const result = await withRetry(
    () => stripeRequest("GET", `/payment_intents/${paymentIntentId}`, secretKey),
    { attempts: 3, minTimeout: 1000, maxTimeout: 30000, retryable: defaultRetryable }
  );

  return mapPaymentIntent(result.data);
}

/**
 * Create a Stripe customer.
 */
export async function createCustomer(
  input: { email: string; name?: string | null; metadata?: Record<string, unknown> },
  client?: Client
): Promise<{ id: string; email: string }> {
  const secretKey = await getSecretKey();

  const body = new URLSearchParams({ email: input.email });
  if (input.name) body.set("name", input.name);
  if (input.metadata) body.set("metadata", JSON.stringify(input.metadata));

  const result = await withRetry(
    () => stripeRequest("POST", "/customers", secretKey, body, undefined),
    { attempts: 3, minTimeout: 1000, maxTimeout: 30000, retryable: defaultRetryable }
  );

  return { id: String((result.data as Record<string, unknown>).id), email: String((result.data as Record<string, unknown>).email) };
}

/**
 * Create a Stripe payout (platform to connected account / bank account).
 * Platform fee split is handled off-Stripe via payment_transactions/
 * platform_fees; this service only moves funds out.
 */
export async function createPayout(input: StripePayoutInput, client?: Client): Promise<PayoutResult> {
  const secretKey = await getSecretKey();

  const body = new URLSearchParams({
    amount: String(Math.round(input.amount)),
    currency: input.currency,
    ...(input.description ? { description: input.description } : {}),
    ...(input.metadata ? { metadata: JSON.stringify(input.metadata) } : {}),
  });

  const result = await withRetry(
    () => stripeRequest("POST", "/payouts", secretKey, body, input.idempotencyKey),
    { attempts: 3, minTimeout: 1000, maxTimeout: 30000, retryable: defaultRetryable }
  );

  const d = result.data as Record<string, unknown>;
  return {
    id: String(d.id ?? ""),
    status: String(d.status ?? ""),
    amount: Number(d.amount ?? 0),
    currency: String(d.currency ?? ""),
    arrivalDate: typeof d.arrival_date === "string" ? d.arrival_date : null,
  };
}

/**
 * Verify a Stripe webhook signature and return the parsed event.
 * Throws if the signature is invalid or the timestamp is too old.
 *
 * Expected header: Stripe-Signature: t=1678896622,v1=...
 */
export function verifyStripeWebhook(
  payload: string | Buffer,
  signatureHeader: string | null,
  webhookSecret: string
): { type: string; id: string; data: unknown; created: number } {
  if (!signatureHeader) {
    throw new IntegrationError("INTEGRATION_WEBHOOK_SIGNATURE_MISSING", "Missing Stripe-Signature header.", 400, PROVIDER);
  }

  const parts = parseStripeSignature(signatureHeader);
  const timestamp = Number(parts.t);
  const signature = parts.v1;

  if (!timestamp || !signature) {
    throw new IntegrationError("INTEGRATION_WEBHOOK_SIGNATURE_INVALID", "Malformed Stripe-Signature header.", 400, PROVIDER);
  }

  // Tolerance: 5 minutes clock skew.
  if (Date.now() - timestamp * 1000 > 5 * 60 * 1000) {
    throw new IntegrationError("INTEGRATION_WEBHOOK_TIMESTAMP_STALE", "Stripe webhook timestamp is outside tolerance.", 400, PROVIDER);
  }

  const signedPayload = `${timestamp}.${payload instanceof Buffer ? payload.toString("utf8") : payload}`;
  const expected = createHmac("sha256", webhookSecret).update(signedPayload, "utf8").digest("hex");

  if (!timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"))) {
    throw new IntegrationError("INTEGRATION_WEBHOOK_SIGNATURE_INVALID", "Stripe webhook signature mismatch.", 400, PROVIDER);
  }

  const event = JSON.parse(typeof payload === "string" ? payload : payload.toString("utf8"));
  return {
    type: event.type,
    id: event.id,
    data: event.data,
    created: event.created,
  };
}

/**
 * Check Stripe readiness (setting enabled, secret key configured).
 */
export async function verifyStripeProvider(client?: Client): Promise<{
  configured: boolean;
  enabled: boolean;
  missing: string[];
}> {
  const supabase = client ?? getSupabaseAdminClient();

  const setting = await getIntegrationSetting(PROVIDER, supabase);
  if (setting.error || !setting.data) {
    return { configured: false, enabled: false, missing: ["No integration setting for Stripe."] };
  }

  const missing: string[] = [];
  if (!setting.data.is_enabled) missing.push("Stripe integration is not enabled.");
  if (setting.data.requires_approval && setting.data.approval_status !== "approved") {
    missing.push(`Stripe approval is "${setting.data.approval_status}".`);
  }

  const credential = await getIntegrationCredential(PROVIDER, "secret_key", supabase);
  if (credential.error) missing.push("Stripe secret key is not configured.");

  return { configured: missing.length === 0, enabled: setting.data.is_enabled, missing };
}

// ---------------------------------------------------------------------------
// Stripe API over fetch (form-encoded body per Stripe API)
// ---------------------------------------------------------------------------

async function stripeRequest(
  method: "GET" | "POST",
  path: string,
  secretKey: string,
  body?: URLSearchParams,
  idempotencyKey?: string | undefined
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
  };

  if (method === "POST") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    ...(method === "POST" && body ? { body: body.toString() } : {}),
  });

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error?: { message?: unknown } }).error?.message ?? res.statusText)
        : res.statusText;
    const error = new IntegrationError(
      "INTEGRATION_STRIPE_REQUEST_FAILED",
      `Stripe API error (${res.status}): ${message}`,
      res.status === 429 ? 429 : 502,
      PROVIDER,
      res.status === 429 ? extractRetryAfter(res) : undefined
    );
    throw error;
  }

  return { ok: true, status: res.status, data: payload };
}

function mapPaymentIntent(data: unknown): PaymentIntentResult {
  const d = data as Record<string, unknown>;
  return {
    id: String(d.id ?? ""),
    status: String(d.status ?? ""),
    amount: Number(d.amount ?? 0),
    currency: String(d.currency ?? ""),
    clientSecret: typeof d.client_secret === "string" ? d.client_secret : null,
    latestCharge: typeof d.latest_charge === "string" ? d.latest_charge : null,
    metadata: (d.metadata as Record<string, unknown>) ?? {},
  };
}

function parseStripeSignature(header: string): { t?: string; v1?: string } {
  const parts: Record<string, string> = {};
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    parts[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return { t: parts.t, v1: parts.v1 };
}

function extractRetryAfter(response: Response): number | undefined {
  const value = response.headers.get("retry-after");
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) ? seconds : undefined;
}
