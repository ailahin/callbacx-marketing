# CALLBACX MARKETING — Entity Relationship Diagram

> Generated from `supabase/migrations/0001..0014`. This is the authoritative
> structural view. Regenerate with a tool (e.g. `pgviz`, `dbdiagram.io`) if the
> schema changes.

## Legend

- `PK` primary key (uuid)
- `FK` foreign key
- `•` not null (required)
- `○` nullable
- Arrows point from child (many) to parent (one): `child }──|| parent`
- Dashed relationship = logical (enforced by RLS/app logic, not a hard FK)

---

## Module 1 — Identity & User Management (migration 0002)

```
auth.users (Supabase managed)
   │ 1
   │
   │ 1..1 (profiles.auth_user_id)
   ▼
profiles ────|| profile_private          (1:1, owner-only private data)
   │
   ├──|| user_preferences                (1:1)
   ├──|| user_sessions                   (1:N, session metadata)
   ├──} profile_user_roles }──|| user_roles
   │                              │
   │                              }──|| role_permissions }──|| permissions
   │
   └──} (used by brands.owner_id, creator_profiles.profile_id)
```

**Key rules**
- `profiles.id` = public profile. `profiles.auth_user_id` → `auth.users.id` (unique).
- `profile_private` is a separate table (owner-only) so public reads never expose PII.
- Multiple roles per user via `profile_user_roles` (M:N).
- Privileged roles (`platform_admin`, `moderator`) cannot be self-assigned — enforced
  by `trg_guard_privileged_role_assignment` + RLS.

---

## Module 2 — Brand Management (migration 0003)

```
profiles ────|| brands                  (brands.owner_id)
   │                │
   │                ├──} brand_members }──|| profiles
   │                ├──} brand_invitations (email-based, token_hash)
   │                ├──} brand_verifications
   │                ├──|| brand_billing_profiles (1:1)
   │                ├──} campaigns (see Module 4)
   │                └──|| brand_categories
```

**Key rules**
- One brand → many members. `brand_members.role <> 'owner'` (owner is `brands.owner_id`).
- Brand owner is implicitly a manager; `brand_members` holds the rest of the team.
- `brand_invitations` store `token_hash` only (raw token hashed server-side).
- `brand_billing_profiles` holds `tax_id` / `provider_customer_id` (RLS-restricted).

---

## Module 3 — Creator & Influencer Management (migration 0004)

```
profiles ────|| creator_profiles      (1:1)
   │                │
   │                ├──} creator_profile_categories }──|| creator_categories
   │                ├──} creator_profile_niches }──|| creator_niches }──|| creator_categories
   │                ├──} creator_social_accounts
   │                ├──} creator_portfolios
   │                ├──} creator_media
   │                ├──} creator_rates
   │                ├──} creator_availability
   │                └──} creator_verifications
```

**Key rules**
- Social accounts: `metrics_source ∈ {manual, platform_api}`. Never fabricate metrics.
- No passwords or OAuth tokens stored; official API connections update verified
  metrics server-side via integration credentials (pending configuration).
- `creator_media` / `creator_portfolios` point to Supabase Storage paths.

---

## Module 4 — Campaign Management (migration 0005)

```
brands ────|| campaigns
   │             │
   │             ├──|| campaign_categories
   │             ├──} campaign_campaign_niches }──|| campaign_niches }──|| campaign_categories
   │             ├──} campaign_requirements
   │             ├──} campaign_deliverables
   │             ├──} campaign_media
   │             └──} campaign_budget_allocations
```

**Key rules**
- Campaign status: `draft → pending_approval → published → paused → completed`
  (terminal: `archived`, `cancelled`). Enforced by `trg_campaign_status_transition`.
- Budget in `numeric(14,2)`; allocation amounts in `numeric(12,2)`.
- Visibility: `public | brand_only | invite_only`.

---

## Module 5 — Applications & Collaborations (migration 0006)

```
campaigns }──|| campaign_applications }──|| creator_profiles
   │
   ├──} collaboration_invitations }──|| creator_profiles
   ├──} collaborations ────|| brand_id (brands)
   │        │  ├──} collaboration_deliverables
   │        │  ├──} deliverable_submissions }──|| creator_profiles
   │        │  ├──} deliverable_reviews }──|| deliverable_submissions
   │        │  ├──|| collaboration_contracts (1:1)
   │        │  └──} collaboration_status_history
   │        └──|| collaboration_contracts.contract_id (1:1)
```

**Key rules**
- Duplicate application blocked: `unique(campaign_id, creator_profile_id)`.
- Collaboration status transitions enforced by `trg_collaboration_status_transition`.
- Deliverable status transitions enforced by `trg_deliverable_status_transition`.
- Application status transitions enforced by `trg_application_status_transition`.
- One open dispute per collaboration (partial unique index, Module 9).

---

## Module 6 — Messaging & Notifications (migration 0007)

```
profiles ────|| conversations          (created_by)
   │                │
   │                └──} conversation_participants }──|| profiles
   │                          │
   │                          └──} messages }──|| profiles
   │                                    └──} message_attachments
   │
   ├──} notifications (recipient_id, actor_id)
   └──|| notification_preferences (1:1)
```

**Key rules**
- Access gate: `is_conversation_participant()` (active participant row required).
- `conversation_participants.left_at` marks departure.
- Notifications are server-inserted (no client insert policy).

---

## Module 7 — Payments & Financial (migration 0008)

```
collaborations ─┐
                ├─< payment_transactions >─|| invoices (1:N each)
                │        │  ├──|| creator_payouts (1:N)
                │        │  ├──|| platform_fees (1:N)
                │        │  └──|| refunds (1:N)
                │        └──|| payment_webhook_events (provider,event_id unique)
```

**Key rules**
- `payment_transactions.idempotency_key` unique → idempotent processing.
- `status = 'succeeded'` requires `provider_payment_id` (check constraint) and is
  only set server-side after provider confirmation.
- No card numbers / CVVs stored. Provider abstracted (`provider` column).
- `platform_fees.rate ∈ [0,1]`.

---

## Module 8 — Analytics (migration 0009)

```
campaigns ────|| campaign_analytics          (append snapshots, unique per day)
creator_profiles ────|| creator_analytics    (append snapshots)
creator_social_accounts ────|| social_metrics_snapshots (append-only)
campaigns / collaborations / creator_profiles ────|| conversion_events
platform_analytics (global roll-ups, unique per date+name)
```

**Key rules**
- `source ∈ {platform_api, manual, estimated}` + `collected_at` for traceability.
- Historical snapshots never overwritten (unique per entity + `metric_date`).

---

## Module 9 — Reputation, Moderation & Support (migration 0010)

```
collaborations ────|| reviews }──|| profiles (reviewer_id, reviewee_id)
   │                   └──} review_responses }──|| profiles (responder_id)
   ├──|| disputes (opened_by, resolved_by)
   │
support_tickets }──|| profiles
   └──} support_ticket_messages }──|| profiles (sender_id)

moderation_reports (reporter_id, reported_profile_id)
   └──} moderation_actions (admin_id, moderation_report_id)
```

**Key rules**
- Reviews tied to a collaboration; one per reviewer per collaboration.
- `reviews_not_self` check prevents self-review.
- Disputes: one open per collaboration.
- `support_ticket_messages.is_internal` = staff-only.

---

## Module 10 — Administration & Audit (migration 0011)

```
profiles ────|| admin_activity_logs
audit_logs (actor_id nullable = system; append-only)
platform_settings
system_notifications
feature_flags
```

**Key rules**
- `audit_logs` is append-only (trigger blocks UPDATE/DELETE).
- Ordinary users cannot read `audit_logs`; staff only.

---

## Cross-module summary

| Domain | Parent | Child (examples) |
|---|---|---|
| Identity | auth.users | profiles, profile_private, user_sessions |
| Brands | profiles | brands, brand_members, brand_invitations |
| Creators | profiles | creator_profiles + 8 sub-tables |
| Campaigns | brands | campaigns + 6 sub-tables |
| Applications | campaigns, creator_profiles | campaign_applications, collaborations |
| Collaborations | campaigns, brands, creator_profiles | deliverables, submissions, contracts |
| Messaging | profiles | conversations, participants, messages |
| Payments | collaborations | transactions, invoices, payouts, refunds |
| Analytics | campaigns, creator_profiles | analytics tables, conversion_events |
| Moderation | collaborations | reviews, disputes, tickets, reports |
| Admin | profiles | activity_logs, audit_logs, settings, flags |

All foreign keys use `ON DELETE` policies appropriate to the relationship
(`cascade` for owned children, `restrict`/`set null` for financial/audit records).