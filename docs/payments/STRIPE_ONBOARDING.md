# CALLBACX TECHNOLOGY — Stripe Provider Onboarding & Financial Security Guide

This document covers the provider onboarding, verification, and operational
requirements for the payment and financial management system implemented in
`src/lib/payments/`, `src/services/payments.ts`, and
`src/app/api/webhooks/stripe/`.

## 1. Provider Selection

**Provider:** Stripe (server-side integration via the official `stripe` Node.js SDK,
v23).

An equivalent supported provider (e.g., Adyen, Braintree, PayPal/Braintree, or a
local acquiring bank) may be substituted. The integration is abstracted behind
`src/lib/payments/stripe.ts` and the provider-agnostic service layer in
`src/services/payments.ts` so the rest of the platform only depends on the
internal payment abstractions.

## 2. Environment Variables (server-side only)

| Variable | Purpose | Notes |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Server-side API key | **Never** expose to the browser. `sk_test_…` for test, `sk_live_…` for live. |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | From Stripe Dashboard → Developers → Webhooks → endpoint signing secret (`whsec_…`). |
| `STRIPE_PUBLISHABLE_KEY` | Client publishable key | Optional; only if client-side Stripe Elements/Checkout is used later. |
| `STRIPE_PLATFORM_FEE_PERCENT` | Default platform commission | Fraction → percent (e.g. `10` = 10%). Default `10`. |

All payment secrets must live in server-only environment variables / a secrets
manager. The client bundle must never contain Stripe keys.

## 3. Stripe Account Onboarding & Verification Requirements

Before any payment can be activated in **live mode**, ALL of the following must
be completed by the platform operator:

1. **Stripe account creation** and completion of the full onboarding flow.
2. **Identity verification** of the platform (KYC) — required by Stripe before
   moving from test to live mode.
3. **Business verification** — business legal name, entity type, tax ID, address,
   and control person details must be verified in the Stripe Dashboard.
4. **Bank account / payout method** setup (for creator payouts).
5. **Capability enablement** — Stripe Payments, Checkout, and Payouts capabilities
   must be enabled for the account.
6. **Webhook endpoint** — configure the endpoint URL:

   ```
   POST https://<your-domain>/api/webhooks/stripe
   ```

   and subscribe to at least:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.refunded`
   - `payment_intent.partially_refunded`
   - `checkout.session.completed`
   - `checkout.session.expired`

7. **Webhook signing secret** — copy into `STRIPE_WEBHOOK_SECRET`.
8. **Test-mode end-to-end tests** — complete the full happy path and failure paths
   with Stripe **test** keys:
   - Successful brand payment → invoice marked paid, transaction recorded,
     platform fee computed, campaign budget incremented, creator net recorded.
   - Declined payment → transaction status `failed`, no budget spend.
   - Refund → transaction status `refunded` / `partially_refunded`.

## 4. Go-Live Checklist (DO NOT ACTIVATE LIVE PAYMENTS UNTIL COMPLETE)

- [ ] Stripe test account fully verified and exercised end-to-end (all above).
- [ ] Live keys (`sk_live_…`) provisioned and stored server-side.
- [ ] Live webhook endpoint + `whsec_live_…` secret configured.
- [ ] Legal review completed (consumer billing disclosures, refund policy,
      tax / VAT obligations, processing agreements).
- [ ] Platform commission rate finalized and stored in `platform_fee_settings`.
- [ ] Customer-facing refund / cancellation policies published.
- [ ] Monitoring & alerting for failed webhooks in place.
- [ ] **Do not enable live payments** until all of the above are complete.

## 5. Payment Flow & Security Requirements

### Server-side processing
- All payment creation (Checkout Sessions) happens in server route handlers
  (`src/app/api/payments/checkout/route.ts`) via the service layer.
- The client is redirected to the Stripe-hosted Checkout page; CALLBACX never
  touches raw card data.

### Webhook verification
- `POST /api/webhooks/stripe` verifies the `Stripe-Signature` header using
  `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`.
- Invalid signatures are rejected with HTTP `400`.

### Idempotency
- Provider-level: Stripe Checkout Session `idempotency_key`.
- Platform-level: `payment_transactions.idempotency_key` (unique) plus
  `payment_webhook_events(provider, event_id)` deduplication.

### Never trust client-side payment confirmation
- Payment status is only mutated by verified webhooks or privileged server
  actions. Client-supplied payment status is never accepted.

### Database consistency
- Payment recording goes through the Postgres function
  `fn_record_payment_transaction`, whose side effects (platform commission in
  `platform_fees`, campaign budget in `campaigns.budget_spent`) run in the same
  database transaction (see migration `0017_financial_extensions.sql`).

### Sensitive data handling
- No card data is stored by CALLBACX. Stripe holds all payment method data.
- Secrets are server-only.

## 6. Financial Records & Statuses

Supported transaction statuses: `pending`, `succeeded`, `failed`, `refunded`,
`partially_refunded`, `cancelled`.

Supported refund workflow: staff creates refund → staff approves → provider
refund executed (`stripe.refunds.create`) → transaction marked refunded /
partially_refunded.

Supported payout statuses: `pending`, `processing`, `paid`, `failed`,
`cancelled`.

## 7. Operational Notes

- Webhook processing failures must be retried by Stripe (automatic retries with
  exponential backoff) and are safe due to idempotency.
- Reconciliation reports should be generated regularly against the date range of
  record.
