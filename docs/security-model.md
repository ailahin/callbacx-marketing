# BUNORE — Security Model & RLS Policy Reference

## Principles

1. **Never trust client input.** All access decisions use `auth.uid()` (session-local,
   never spoofable) and the `is_*` / `can_*` helper functions in migrations
   `0012`/`0013`. No policy compares a row to a client-supplied user id, role value,
   or ownership claim.
2. **Least privilege.** Brand members see only their brand's resources; creators see
   only their own profiles/applications; conversations are participant-only; payment
   records are restricted to collaboration participants and staff.
3. **Public profile fields only.** `profiles` exposes public fields to everyone;
   `profile_private` (PII) is owner-only.
4. **Server-side privileged ops.** Payments become `succeeded` only after provider
   confirmation; webhook ingestion is idempotent; analytics and notification inserts
   have no client policy.
5. **Service-role key is server-only.** `getSupabaseAdminClient()` throws if called
   in the browser. It is never bundled into client code.

## Roles

| Role | Slug | Privileged | Notes |
|---|---|---|---|
| Platform Administrator | `platform_admin` | yes | Full access; staff |
| Moderator | `moderator` | yes | Moderation/disputes/reports; staff |
| Support Agent | `support` | no | Tickets/reports; staff |
| Brand Owner | `brand_owner` | no | Owns a brand |
| Brand Admin | `brand_admin` | no | Manages brand team/campaigns |
| Brand Member | `brand_member` | no | Contributes within scope |
| Creator | `creator` | no | Own creator profile |

`is_staff()` = `platform_admin` OR `moderator` OR `support`.

## Helper functions (migrations 0012/0013)

| Function | Purpose |
|---|---|
| `current_profile_id()` | auth.uid() if a live profile exists, else null |
| `has_role(profile, role)` / `has_any_role(profile, roles)` | role checks |
| `is_brand_owner(brand, profile)` | brands.owner_id match |
| `is_brand_member(brand, profile)` | active brand_members row |
| `can_manage_brand(brand, profile)` | owner or active admin/member |
| `is_campaign_brand(campaign, profile)` | campaign→brand owner |
| `is_campaign_brand_member(campaign, profile)` | owner or brand member |
| `creator_profile_for_profile(profile)` | creator_profiles.id for a profile |
| `is_creator_profile_owner(creator_profile, profile)` | ownership check |
| `is_platform_admin/is_moderator/is_staff(profile)` | staff checks |
| `is_collaboration_participant(collab, profile)` | creator owner or brand manager |
| `is_conversation_participant(conv, profile)` | active participant row |
| `is_deliverable_submission_owner(submission, profile)` | creator ownership |

## RLS policy matrix (summary)

| Table | Read | Write |
|---|---|---|
| profiles | own OR public OR staff | own (insert/update); soft-delete own/staff |
| profile_private | owner | owner |
| user_roles / permissions / role_permissions | all read | staff |
| profile_user_roles | own or staff | staff; self-insert `creator` only |
| user_preferences / user_sessions | owner (sessions: +staff read) | owner |
| brand_categories | all read | staff |
| brands | active OR owner/member | owner insert; manager update; owner/staff delete |
| brand_members | brand owner/member/staff | manager |
| brand_invitations | manager/inviter/staff | manager insert; manager/acceptee update |
| brand_verifications | manager/staff | manager insert; staff update |
| brand_billing_profiles | manager/staff | manager |
| creator_categories / niches | all read | staff |
| creator_profiles | active OR owner/staff | owner/staff |
| creator_profile_categories / niches | all read | owner/staff |
| creator_social_accounts | owner/staff | owner |
| creator_portfolios | public OR owner | owner |
| creator_media | all read | owner |
| creator_rates / availability | owner/staff | owner |
| creator_verifications | owner/staff | owner insert; staff update |
| campaign_categories / niches | all read | staff |
| campaigns | published+public OR brand member | brand member insert/update; owner/staff delete |
| campaign_requirements/deliverables/media/budget | all read | brand member |
| campaign_applications | brand member OR applicant OR staff | creator insert (no dup); brand/applicant update |
| collaboration_invitations | brand manager OR creator OR staff | brand insert; brand/creator update |
| collaborations | participant OR staff | participant insert/update; staff delete |
| collaboration_deliverables | participant OR staff | participant |
| deliverable_submissions | participant OR staff | creator owner/staff |
| deliverable_reviews | participant OR staff | participant |
| collaboration_contracts | participant OR staff | participant/staff |
| collaboration_status_history | participant OR staff | staff/system insert |
| conversations | participant OR staff | creator (created_by) insert; participant update |
| conversation_participants | participant OR staff | staff/creator insert; own update/delete |
| messages | participant OR staff | participant insert; own update/delete |
| message_attachments | participant OR staff | participant insert |
| notifications | recipient | recipient update (read); server insert only |
| notification_preferences | owner | owner |
| payment_transactions | participant OR staff | server/staff insert+update |
| invoices | brand owner OR creator OR staff | brand owner/staff |
| creator_payouts | creator owner OR staff | server/staff insert |
| platform_fees | staff | server insert |
| refunds | participant OR staff | staff/server insert |
| payment_webhook_events | staff | server insert |
| campaign_analytics | brand member OR staff | server insert |
| creator_analytics | creator owner OR staff | server insert |
| social_metrics_snapshots | creator owner OR staff | server insert |
| conversion_events | brand/creator/staff per scope | server insert |
| platform_analytics | staff | server insert |
| reviews | public OR participant OR staff | participant insert; author update |
| review_responses | participant OR staff | reviewee insert |
| disputes | participant OR staff | participant insert; staff update |
| support_tickets | owner OR staff | owner insert; owner/staff update |
| support_ticket_messages | sender OR staff OR ticket owner | sender/staff insert |
| moderation_reports | reporter OR staff | reporter insert; staff update |
| moderation_actions | staff | staff insert |
| admin_activity_logs | staff | staff/server insert |
| audit_logs | staff | server insert; append-only trigger |
| platform_settings | public OR staff | staff |
| system_notifications | all/admin/brand/creator per target_role | staff |
| feature_flags | all read | staff |

## Storage policies (migration 0014)

- Public buckets (`brand-logos`, `creator-avatars`, `creator-portfolios`,
  `campaign-assets`): public read; write gated by ownership/brand membership.
- Private buckets (`deliverable-submissions`, `contracts`, `messages`):
  participant-only (`is_collaboration_participant` / `is_conversation_participant`).
- Path segment 2 is the tenant/owner id used by the policies.

## Sensitive operations (server-only)

- **Payments**: insert/update of `payment_transactions`, `creator_payouts`,
  `platform_fees`, `refunds` require `auth.uid() is null` (service role) or staff.
  `status = 'succeeded'` requires `provider_payment_id`.
- **Webhook ingestion**: `payment_webhook_events` is insert-only by the service role;
  `(provider, event_id)` unique → idempotent.
- **Audit**: `audit_logs` inserts are service-role only; updates/deletes blocked by
  trigger; reads staff-only.

## Known limitations / pending

- No MFA enforcement in schema (Supabase Auth handles it).
- OAuth tokens for social platforms are stored in an external vault (pending
  configuration), never in the database.
- Rate limiting / WAF is a platform concern (Supabase/edge), not in schema.
- Row-level encryption of PII (e.g. tax_id) is application responsibility; the
  columns are access-controlled via RLS but not encrypted at rest by the app.