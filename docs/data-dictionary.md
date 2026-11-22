# BUNORE — Data Dictionary

> Canonical column reference for the public schema. Generated from
> `supabase/migrations/0001..0014`. Types are the PostgreSQL types; "Null" = nullable.

## Conventions
- `PK` uuid primary key; `FK` foreign key.
- All `*_at` are `timestamptz` (UTC).
- Money is `numeric` (never float).

---

## Identity (0002)

### profiles
| Column | Type | Null | Notes |
|---|---|---|---|
| id | uuid | no | PK |
| auth_user_id | uuid | no | FK → auth.users.id (unique) |
| full_name | text | yes | |
| avatar_url | text | yes | public storage URL |
| headline | text | yes | |
| bio | text | yes | |
| location | text | yes | public display |
| website_url | text | yes | must match `^https?://` |
| is_public | boolean | no | default true |
| status | account_status | no | default 'active' |
| created_at / updated_at | timestamptz | no | UTC |
| deleted_at | timestamptz | yes | soft delete |

### profile_private
| Column | Type | Null | Notes |
|---|---|---|---|
| id | uuid | no | PK |
| profile_id | uuid | no | FK → profiles.id (unique) |
| phone | text | yes | owner-only |
| date_of_birth | date | yes | |
| address | jsonb | yes | default `{}` |
| id_document_url | text | yes | private storage |
| updated_at | timestamptz | no | |

### user_roles / permissions / role_permissions
- user_roles: id, name, slug (unique), description, is_privileged, is_system, created_at
- permissions: id, name, slug (unique), resource, action, description, created_at
- role_permissions: role_id (FK), permission_id (FK), granted_at

### profile_user_roles
profile_id (FK), role_id (FK), assigned_by (auth.users), assigned_at

### user_preferences
profile_id (PK/FK), email_notifications, push_notifications, newsletter, theme, language, updated_at

### user_sessions
id, profile_id (FK), user_agent, ip_address, last_active_at, created_at — **no tokens stored**

---

## Brands (0003)

### brands
id, owner_id (FK profiles), name, legal_name, trade_name, description, website_url,
contact_email, contact_phone, address (jsonb), brand_category_id (FK), logo_url,
brand_kit (jsonb), verification_status, verified_at, verified_by, is_active, status,
created_at, updated_at, deleted_at

### brand_members
id, brand_id (FK), profile_id (FK), role (membership_role, `<> 'owner'`), is_active,
invited_by (FK profiles), joined_at, created_at, updated_at — unique(brand_id, profile_id)

### brand_invitations
id, brand_id, email, role, token, token_hash, invited_by, accepted_by, expires_at,
accepted_at, status, created_at

### brand_verifications
id, brand_id, document_type, document_url, status, submitted_at, reviewed_at,
reviewed_by, notes, created_at

### brand_billing_profiles
id, brand_id (unique), company_name, tax_id (restricted), billing_email, address,
payment_provider (default 'stripe'), provider_customer_id, created_at, updated_at

### brand_categories
id, name, slug (unique), description, created_at

---

## Creators (0004)

### creator_profiles
id, profile_id (FK, unique), display_name, bio, location (jsonb), languages (text[]),
avatar_url, cover_url, contact_email, website_url, availability_status, collaboration_preferences (jsonb),
verification_status, is_active, created_at, updated_at, deleted_at

### creator_categories / creator_niches
- creator_categories: id, name, slug (unique), description, created_at
- creator_niches: id, category_id (FK), name, slug, description, created_at

### creator_profile_categories / creator_profile_niches
Join tables (creator_profile_id, creator_category_id / creator_niche_id)

### creator_social_accounts
id, creator_profile_id, platform, platform_user_id, username, profile_url, is_verified,
followers_count (bigint), engagement_rate (numeric(5,2)), metrics_source (manual|platform_api),
last_synced_at, created_at, updated_at — unique(creator_profile_id, platform, username)

### creator_portfolios
id, creator_profile_id, title, description, is_public, sort_order, created_at, updated_at

### creator_media
id, creator_profile_id, portfolio_id (FK nullable), storage_path, media_kind, title,
caption, duration_seconds, created_at

### creator_rates
id, creator_profile_id, service_type, min_rate, max_rate (numeric(12,2)), currency, created_at, updated_at

### creator_availability
id, creator_profile_id, start_date, end_date, status, note, created_at

### creator_verifications
id, creator_profile_id, document_type, document_url, status, submitted_at, reviewed_at,
reviewed_by, notes, created_at

---

## Campaigns (0005)

### campaigns
id, brand_id (FK), title, description, brief, category_id (FK), status (campaign_status),
objective, target_audience (jsonb), budget_total (numeric(14,2)), budget_currency,
compensation_model, payment_terms, start_date, end_date, application_deadline,
location_requirements (jsonb), platform_requirements (text[]), visibility, approval_required,
approved_at, approved_by, is_active, created_at, updated_at, deleted_at

### campaign_categories / campaign_niches
Same shape as creator categories/niches.

### campaign_campaign_niches
Join table (campaign_id, campaign_niche_id)

### campaign_requirements
id, campaign_id, requirement, is_mandatory, order_index

### campaign_deliverables
id, campaign_id, title, description, deliverable_type, platform, due_date, requirements (jsonb),
is_required, created_at, updated_at

### campaign_media
id, campaign_id, storage_path, media_kind, title, alt_text, created_at

### campaign_budget_allocations
id, campaign_id, allocation_type, amount (numeric(12,2)), currency, description, created_at

---

## Applications & Collaborations (0006)

### campaign_applications
id, campaign_id, creator_profile_id, cover_letter, proposed_rate (numeric(12,2)), currency,
status (application_status), applied_at, reviewed_at, reviewed_by, rejection_reason —
unique(campaign_id, creator_profile_id)

### collaboration_invitations
id, campaign_id, brand_id, creator_profile_id, invited_by, proposed_fee, currency, message,
token, token_hash, status (invitation_status), expires_at, responded_at, created_at

### collaborations
id, campaign_id, brand_id, creator_profile_id, status (collaboration_status), agreed_fee,
currency, contract_id (FK nullable), started_at, completed_at, created_at, updated_at, deleted_at

### collaboration_deliverables
id, collaboration_id, campaign_deliverable_id (FK nullable), title, description, due_date,
status (deliverable_status), created_at, updated_at

### deliverable_submissions
id, collaboration_deliverable_id, creator_profile_id, submission_url, storage_path,
media_kind, notes, submitted_at

### deliverable_reviews
id, deliverable_submission_id, reviewer_id, rating (1-5), feedback, status, created_at,
updated_at — unique(deliverable_submission_id, reviewer_id)

### collaboration_contracts
id, collaboration_id (unique), storage_path, contract_type, signed_at, signed_by_brand,
signed_by_creator, created_at

### collaboration_status_history
id, collaboration_id, from_status, to_status, changed_by, reason, created_at

---

## Messaging (0007)

### conversations
id, type (direct|group), title, created_by, created_at, updated_at

### conversation_participants
id, conversation_id, profile_id, joined_at, left_at, last_read_at, is_muted —
unique(conversation_id, profile_id)

### messages
id, conversation_id, sender_id, body, message_type (text|file|system), edited_at,
deleted_at, created_at

### message_attachments
id, message_id, storage_path, file_name, mime_type, file_size (bigint), created_at

### notifications
id, recipient_id, actor_id, type, title, body, data (jsonb), read_at, created_at

### notification_preferences
profile_id (PK), email_enabled, push_enabled, categories (jsonb), updated_at

---

## Payments (0008)

### payment_transactions
id, collaboration_id (FK nullable), invoice_id (FK nullable), provider,
provider_payment_id, idempotency_key (unique), amount (numeric(12,2)), currency,
status (payment_status), fee_amount, creator_amount, metadata (jsonb), created_at, updated_at

### invoices
id, invoice_number (unique), collaboration_id, brand_id, creator_profile_id, amount,
currency, status (invoice_status), due_date, paid_at, pdf_storage_path, created_at, updated_at

### creator_payouts
id, creator_profile_id, payment_transaction_id (FK nullable), amount, currency,
status (payout_status), provider_payout_id, paid_at, created_at, updated_at

### platform_fees
id, payment_transaction_id, amount, currency, rate (numeric(5,4), 0-1), created_at

### refunds
id, payment_transaction_id, amount, currency, reason, status (refund_status),
provider_refund_id, created_at, processed_at, processed_by

### payment_webhook_events
id, provider, event_id, event_type, payload (jsonb), processed, processed_at, created_at —
unique(provider, event_id)

---

## Analytics (0009)

### campaign_analytics
id, campaign_id, metric_date (date), impressions, reach, engagement, clicks, conversions,
revenue (numeric(12,2)), source, collected_at — unique(campaign_id, metric_date)

### creator_analytics
id, creator_profile_id, metric_date, impressions, reach, engagement, clicks, conversions,
revenue, source, collected_at — unique(creator_profile_id, metric_date)

### social_metrics_snapshots
id, creator_social_account_id, followers_count, engagement_rate, snapshotted_at, source

### conversion_events
id, campaign_id, collaboration_id, creator_profile_id, event_type, value (numeric(12,2)),
currency, occurred_at, source, metadata (jsonb), created_at

### platform_analytics
id, metric_date, metric_name, metric_value (numeric), metadata (jsonb), created_at —
unique(metric_date, metric_name)

---

## Reputation & Moderation (0010)

### reviews
id, collaboration_id, reviewer_id, reviewee_id, rating (1-5), title, body, is_public,
created_at, updated_at — unique(collaboration_id, reviewer_id); check reviewer ≠ reviewee

### review_responses
id, review_id, responder_id, body, created_at, updated_at — unique(review_id, responder_id)

### disputes
id, collaboration_id, opened_by, status (dispute_status), reason, resolution, resolved_by,
resolved_at, created_at, updated_at — one open per collaboration (partial unique)

### support_tickets
id, profile_id, subject, status (ticket_status), priority (ticket_priority), assigned_to,
created_at, updated_at

### support_ticket_messages
id, support_ticket_id, sender_id, body, is_internal, created_at

### moderation_reports
id, reporter_id, reported_profile_id, reported_resource_type, reported_resource_id, reason,
status (report_status), created_at, updated_at

### moderation_actions
id, moderation_report_id, admin_id, action_type, target_type, target_id, details (jsonb), created_at

---

## Administration (0011)

### admin_activity_logs
id, admin_id, action, target_type, target_id, metadata (jsonb), ip_address, user_agent, created_at

### audit_logs
id, actor_id (nullable = system), action, resource_type, resource_id, old_values, new_values,
created_at — **append-only**

### platform_settings
id, setting_key (unique), setting_value (jsonb), category, is_public, updated_by, updated_at

### system_notifications
id, title, body, target_role, created_at, expires_at

### feature_flags
id, flag_key (unique), enabled, rollout_percentage (0-100), conditions (jsonb), updated_at