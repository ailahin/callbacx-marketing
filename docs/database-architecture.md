# BUNORE — Database Architecture

## Overview

BUNORE's database is a single PostgreSQL (Supabase) database in the `public`
schema, built from ordered SQL migrations. It backs the Next.js web app today and
the future Expo/React Native app tomorrow (same backend, same RLS).

- **Auth**: Supabase Auth owns `auth.users`. The app references it via
  `profiles.auth_user_id`. There is no duplicate auth system.
- **Identity**: `profiles` is public; `profile_private` holds PII (owner-only).
- **Tenancy**: brands are the business unit. `brand_members` +
  `brands.owner_id` define brand-scoped access; `is_*` helper functions centralise
  the checks so RLS never trusts client-supplied ids.
- **Financial**: all money is `numeric`/`decimal`. Provider integration is abstract
  (`provider`, `provider_*_id` columns). Payments become `succeeded` only after
  server-side provider confirmation; webhook ingestion is idempotent.
- **Analytics**: append-only snapshots with `source` + `collected_at` so every
  statistic is traceable.
- **Audit**: `audit_logs` is append-only; ordinary users cannot read it.

## Migration layout

| File | Module |
|---|---|
| `0001_extensions_and_types.sql` | pgcrypto, uuid-ossp, all enum types |
| `0002_identity.sql` | profiles, profile_private, roles, permissions, prefs, sessions |
| `0003_brands.sql` | brand_categories, brands, brand_members, invitations, verifications, billing |
| `0004_creators.sql` | creator_categories, niches, profiles, social accounts, portfolios, media, rates, availability, verifications |
| `0005_campaigns.sql` | campaign categories, niches, campaigns, requirements, deliverables, media, budget allocations |
| `0006_applications_collaborations.sql` | applications, invitations, collaborations, deliverables, submissions, reviews, contracts, status history |
| `0007_messaging_notifications.sql` | conversations, participants, messages, attachments, notifications, preferences |
| `0008_payments.sql` | payment_transactions, invoices, payouts, fees, refunds, webhook events |
| `0009_analytics.sql` | campaign/creator analytics, social snapshots, conversion events, platform analytics |
| `0010_moderation_support.sql` | reviews, responses, disputes, tickets, ticket messages, reports, actions |
| `0011_admin.sql` | admin_activity_logs, audit_logs, platform_settings, system_notifications, feature_flags |
| `0012_functions.sql` | helper functions + status-transition triggers |
| `0013_rls_policies.sql` | RLS enable + policies, triggers, composite indexes |
| `0014_storage.sql` | storage buckets + object policies |

Migrations are idempotent where possible (`create ... if not exists`,
`on conflict do nothing` in the seed). Re-running on a clean local database is safe.

## Design conventions

- **UUIDs** for all primary keys (`gen_random_uuid()`).
- **`timestamptz`** for all timestamps, defaulted to `timezone('utc', now())`.
- **`numeric`** for money (`numeric(12,2)` / `numeric(14,2)`); never float.
- **Soft deletion** via `deleted_at` on user-facing entities (profiles, brands,
  creator_profiles, campaigns, collaborations, messages). Financial/audit tables
  are append-only and never soft-deleted.
- **Unique constraints** encode business invariants (one application per creator
  per campaign, one contract per collaboration, idempotency keys, one open dispute).
- **Composite indexes** cover common query shapes (brand+status+date,
  creator+status, conversation+created_at, invoice+created).

## Server-side enforcement (not client-trusted)

- Status transitions are enforced by triggers (`trg_*_status_transition`).
- Privileged role assignment is guarded by
  `trg_guard_privileged_role_assignment` (only staff can grant privileged roles;
  users may self-assign only the `creator` role).
- `audit_logs` is append-only (`trg_audit_logs_append_only`).
- All RLS policies use `auth.uid()` and the `is_*`/`can_*` helper functions
  (declared in `0012`/`0013`). No policy compares against a client-provided id.

## Row Level Security

See `docs/security-model.md` for the full policy matrix. Summary:
- Every table with user/business data has RLS enabled.
- Public read: `profiles` (public), `brands` (active), `creator_profiles` (active),
  published public `campaigns`, public `creator_portfolios`, public `creator_media`,
  reference tables (categories/niches/roles/permissions/feature flags).
- Owner/member-scoped writes via helper functions.
- Conversation access is participant-gated.
- Payment records are readable only by collaboration participants and staff.
- `notifications`, analytics inserts, payment mutations, and audit inserts are
  server-only (no client insert policy, or `auth.uid() is null` guard).

## Storage

Buckets (see `0014_storage.sql`):

| Bucket | Public | Path | Write scope |
|---|---|---|---|
| `brand-logos` | yes | `{brand_id}/...` | brand owner/admin |
| `creator-avatars` | yes | `{profile_id}/...` | profile owner |
| `creator-portfolios` | yes | `{creator_profile_id}/...` | creator owner |
| `campaign-assets` | yes | `{campaign_id}/...` | brand member |
| `deliverable-submissions` | no | `{collaboration_id}/...` | collaboration participant |
| `contracts` | no | `{collaboration_id}/...` | collaboration participant |
| `messages` | no | `{conversation_id}/...` | conversation participant |

File-size and MIME-type limits are set on each bucket. Private buckets are never
publicly accessible; access is participant-gated.

## Retention & deletion

- User-facing rows are soft-deleted (`deleted_at`). Hard deletion of a user
  cascades through FK `ON DELETE CASCADE` (profiles, creator_profiles, etc.).
- `audit_logs`, `payment_transactions`, `payment_webhook_events`,
  `platform_fees` are retained indefinitely for financial/audit compliance.
- `social_metrics_snapshots` and analytics rows are append-only and retained
  (historical traceability); purge policy is an operational decision, not in schema.
- Brand invitations and collaboration invitations expire via `expires_at`; expired
  rows can be archived by a scheduled job (not in schema).

## Scalability & future integrations

- Social account integration is abstracted: `creator_social_accounts` stores
  `metrics_source` (`manual` | `platform_api`). Official API connections update
  `followers_count`/`engagement_rate` server-side; credentials live in a secrets
  vault (pending configuration — see `docs/setup-and-deployment.md`).
- Payment provider is abstracted (`provider` column, `provider_*_id` refs). Stripe
  or another provider can be added without schema change; webhook ingestion is
  idempotent via `payment_webhook_events(provider, event_id)`.
- Expo/React Native uses the same Supabase client + service layer in
  `src/services/database/` (UI-independent).

## Known constraints / non-goals (this phase)

- No frontend dashboards (explicitly out of scope).
- No real auth users seeded (seed guards on `auth.users` existence; create users
  via Supabase Auth signup flow).
- External API credentials (social platforms, payment provider) are pending
  configuration and documented as integration interfaces.