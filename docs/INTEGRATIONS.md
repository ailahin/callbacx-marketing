# External Integrations Architecture

CALLBACX TECHNOLOGY — external service integration layer. This document
describes the integration modules, security model, provider requirements and
known limitations. It is the authoritative reference for what is implemented
and what still requires manual provider-side setup.

## Architecture overview

Integration code lives in:

- `src/lib/integrations/` — low-level primitives: credential vault (AES-256-GCM), OAuth state + PKCE, retry/rate-limit handling, shared types.
- `src/services/integrations/` — reusable service layer:
  - `settings.ts` — platform-wide provider configuration + encrypted credential vault (admin only)
  - `connections.ts` — user-level connections, connection status indicators, token access
  - `oauth.ts` — OAuth 2.0 authorize + callback (Instagram, TikTok, YouTube)
  - `email.ts` — email delivery via Resend (or equivalent), transactional notifications, audit log
  - `stripe.ts` — Stripe payments, payouts, webhook signature verification
  - `storage.ts` — Supabase Storage server-side operations (buckets, uploads, signed URLs)
  - `social.ts` — Instagram / TikTok / YouTube provider clients
  - `sync.ts` — social metrics imports through authorised provider APIs
  - `webhooks.ts` — idempotent webhook ingestion with signature verification
- `src/app/api/integrations/` — HTTP API:
  - `GET/PATCH /api/integrations/settings` — provider settings (staff)
  - `POST /api/integrations/settings/credential` — store encrypted credential (staff)
  - `GET/DELETE /api/integrations/connections` — user connections (status indicators)
  - `GET /api/integrations/oauth/authorize` — start OAuth flow
  - `GET /api/integrations/oauth/callback` — complete OAuth flow
  - `POST /api/integrations/sync` — import social analytics
  - `POST /api/integrations/email/send` — send email
  - `POST /api/integrations/webhooks/:provider` — idempotent webhook ingestion
  - `GET /api/integrations/readiness` — provider readiness for status indicators
- `supabase/migrations/0015_integrations.sql` — schema: settings, credentials vault, OAuth states, connections, sync logs, webhook events, email notifications, RLS policies.
- `src/components/integrations/` — `ConnectionStatusBadge`, `IntegrationProviderCard`
- `src/app/dashboard/admin/integrations/page.tsx` — administrator integration settings
- `src/app/dashboard/creator/social/page.tsx` — creator social account connections

## Security model

1. **No plaintext secrets.** OAuth access/refresh tokens, API keys, client
   secrets and webhook signing secrets are encrypted with AES-256-GCM using
   `INTEGRATION_VAULT_KEY` (32 random bytes, base64, server-only env var)
   before being written to `integration_credentials`. Plaintext values are
   never logged and never returned to the client.

2. **Server-only credentials.** Reading credentials requires the Supabase
   service-role key (webhooks, sync jobs) or an authenticated staff session
   (admin UI). The service-role key is never exposed to the browser.

3. **OAuth state protection.** Every authorization request binds a single-use,
   expiry-bound (10 min) state value to a profile, plus a PKCE code verifier
   (RFC 7636). States are consumed exactly once (replay protection) and
   validated against the provider that issued them.

4. **RLS.** `integration_settings` and `integration_credentials` are staff
   only; `integration_connections` are owner-only; webhook/event tables are
   service-role only. No public access to credential data.

5. **No fabricated external data.** Provider APIs are called only with a
   stored, decrypted token. Metrics rows are written only from actual API
   responses; missing values are `null`, never synthetic. When a provider is
   not configured, services throw `INTEGRATION_NOT_CONFIGURED` instead of
   pretending to work.

## Provider matrix

| Provider | Purpose | Credentials needed | Approval needed | Status |
|---|---|---|---|---|
| Supabase Storage | Cloud file storage (buckets: brand-kits, campaign-assets, deliverable-submissions, exports, contracts) | Service role key (already configured) | No | Implemented, enabled by default |
| Resend | Transactional + marketing email delivery | `RESEND_API_KEY` + sender email | No (provider account) | Implemented, disabled until configured |
| Stripe | Payments, payouts, webhooks | `STRIPE_SECRET_KEY`, webhook signing secret | Yes (platform admin toggles approval) | Implemented, disabled until configured |
| Instagram | Account connections, basic metrics | Meta app client id + secret | Yes (Meta App Review for most scopes) | Implemented, disabled until configured |
| TikTok | Account connections, basic metrics | TikTok client key + secret | Yes (TikTok app review for business APIs) | Implemented, disabled until configured |
| YouTube | Channel connections, statistics | Google OAuth client id + secret | No (read-only, own channel) | Implemented, disabled until configured |
| Webhooks | Incoming webhook ingestion | Signing secret per provider (optional) | No | Implemented, enabled |

### Email delivery — Resend (or equivalent)

- Implemented with native `fetch` against `https://api.resend.com` so no
  provider SDK is required; swap the `callResendSend` implementation in
  `src/services/integrations/email.ts` to target another provider.
- `sendEmail(to, subject, body, from?, replyTo?)` — sends one email.
- `sendTransactionalNotification(...)` — category-based notification with an
  `email_notifications` audit row (status, provider message id, errors).
- Rate limits/transient failures: retried with exponential backoff + jitter;
  HTTP 429 honors `Retry-After`.
- Requires: `RESEND_API_KEY` in the credentials vault, `config.from_email`
  on the resend setting, provider enabled. Otherwise
  `INTEGRATION_NOT_CONFIGURED`.
- No email data is fabricated: if the provider cannot be reached, the send
  fails with an error and is audited as failed.

### Stripe payments

- `createPaymentIntent`, `getPaymentIntent`, `createCustomer`, `createPayout`
  over the Stripe API (`https://api.stripe.com/v1`), idempotency key on every
  mutating call.
- `verifyStripeWebhook(payload, signatureHeader, secret)` — Stripe-Signature
  header verification (HMAC-SHA256, 5-minute clock tolerance).
- Transactions are recorded in `payment_transactions` server-side only after
  provider confirmation (webhook handler), matching the existing payments
  service contract. No card numbers/CVVs are ever stored.
- Requires: `STRIPE_SECRET_KEY` + enabled + platform approval. Stripe itself
  requires an activated Stripe account; Connect/payouts require Stripe
  Connect onboarding.
- No payment data is fabricated: statuses reflect provider responses only.

### Social media OAuth — Instagram, TikTok, YouTube

Authorisation code flow with PKCE, single-use state, encrypted token storage.

**Instagram (Meta)**
- Endpoints: `https://api.instagram.com/oauth/authorize`,
  `https://api.instagram.com/oauth/access_token`,
  Graph API `https://graph.instagram.com/me`, token refresh via
  `/refresh_access_token`.
- Scopes requested: `instagram_basic`, `instagram_manage_insights`,
  `instagram_manage_comments`.
- Requirements: Meta developer app; Instagram Basic Display or Instagram Graph
  API product. Basic Display works without review for personal accounts; the
  Graph API permissions above require Meta App Review before they can be
  requested from people other than app admins/testers.
- Access tokens are short-lived; long-lived tokens (60 days) require the
  `ig_exchange_token` exchange — implemented as the basic token exchange;
  long-lived exchange and token refresh are available via
  `graph.instagram.com/refresh_access_token`.
- Limitations: insights/metrics (followers, engagement) require the
  `instagram_manage_insights` permission + app review; content publishing
  requires `instagram_content_publish` + review. We import only what the
  approved token permits; missing values are null.

**TikTok**
- Endpoints: `https://www.tiktokapis.com/v2/auth/authorize`,
  `https://open.tiktokapis.com/v2/oauth/token/`,
  user info `https://open.tiktokapis.com/v2/user/info/`.
- Scopes requested: `user.info.basic`, `video.list`, `user.profile`.
- Requirements: TikTok developer app. Business API / analytics endpoints
  require a TikTok Business Account and may require app review.
- Limitations: follower counts and video analytics are only available on
  business accounts with the appropriate access level; personal accounts
  return profile info only. Missing values are null.

**YouTube (Google)**
- Endpoints: Google OAuth `https://accounts.google.com/o/oauth2/v2/auth`,
  token `https://oauth2.googleapis.com/token`,
  YouTube Data API v3 `https://www.googleapis.com/youtube/v3/channels`.
- Scopes: `youtube.readonly`, `yt-analytics.readonly` (read-only import;
  analytics reports are not called in the initial implementation).
- Requirements: Google Cloud project with YouTube Data API v3 enabled.
- Limitations: API quota units apply; `channels.list` statistics is
  inexpensive. Channel statistics (subscriberCount, videoCount, viewCount)
  are imported for the authenticated account's own channel. No content is
  ever uploaded or modified.

### Social media analytics imports

- `sync.ts` imports metrics per connection into `social_metrics_snapshots`
  (append-only, traceable via `source` and `snapshotted_at`) and rolls up
  into `creator_analytics`.
- Sync is rate-limit aware: in-memory token bucket throttle plus provider
  429 handling with `Retry-After`. Failures are recorded in
  `integration_sync_logs` and the connection status is set to `error` /
  `expired` accordingly.
- Triggered via `POST /api/integrations/sync` (user's own connections) or
  `syncAllConnections` (staff).

### Webhook processing

- `integration_webhook_events` guarantees idempotent processing:
  `(provider, event_id)` is unique, duplicates are skipped.
- Stripe webhooks verified with `verifyStripeWebhook` before ingestion.
- Other providers verified against their configured webhook signing secret;
  unsigned webhooks are accepted when no secret is configured — configure a
  secret for production webhook sources.
- Handlers are registered per `(provider, event_type)` via
  `registerWebhookHandler`; one failing handler does not lose the event
  (it is still marked processed and the failure is logged).

## Connection status indicators

Connection lifecycle states: `pending`, `connected`, `expired`, `revoked`,
`error`, `disconnected`. Exposed through:

- `GET /api/integrations/connections` (list with status per connection)
- `GET /api/integrations/readiness` (provider-level configured/enabled/approval)
- `ConnectionStatusBadge` component (used on creator social page and admin
  integration settings)
- Provider cards in `src/app/dashboard/creator/social/page.tsx`

## Administrator integration settings

`/dashboard/admin/integrations` (platform administrators, `admin:settings`):

- Enable/disable providers
- Approve/reject providers requiring approval
- Store credentials (API keys, client secrets, webhook signing secrets)
  encrypted in the vault
- View credential keys (masked) and missing-configuration hints

Default migration rows create all providers disabled except
`supabase_storage` and `webhook` (approved). Stripe and social providers are
created `requires_approval = true`.

## Requirements & limitations summary

- **Do not assume access to restricted social media APIs.** Instagram/TikTok
  insights and YouTube analytics require app review and specific account
  types. The integration layer degrades gracefully: not-configured providers
  return `INTEGRATION_NOT_CONFIGURED`; missing scopes yield null metrics,
  never synthetic data.
- **External credentials required.** Resend API key, Stripe secret key, and
  OAuth client secrets must be obtained from the providers and configured by
  an administrator before those integrations work.
- **INTEGRATION_VAULT_KEY required.** Without it, no tokens or secrets can be
  stored; all OAuth/API integrations are unavailable.
- **Rate limits.** Provider rate limits are not under platform control;
  sync jobs should be scheduled with intervals appropriate to each provider
  (respect `Retry-After` responses).
- **No card data.** Stripe integration never touches raw card numbers; use
  Stripe Elements/Checkout on the client if card acceptance is needed later.
