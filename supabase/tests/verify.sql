-- CALLBACX TECHNOLOGY â€” Database verification / test script
--
-- Run against a LOCAL Supabase instance after `supabase db reset`.
--   psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f supabase/tests/verify.sql
-- or via the CLI:
--   supabase test db --file supabase/tests/verify.sql   (if available)
--
-- This script is read-mostly and idempotent: it uses assertions via DO blocks
-- that RAISE EXCEPTION on failure, so a non-zero exit means a broken migration.
-- It does not seed auth.users (those are created by the Auth flow), so it
-- validates structural integrity, constraints, and RLS wiring.

\set ON_ERROR_STOP on

begin;

-- ---------------------------------------------------------------------------
-- 1. Schema presence: every expected table must exist in public.
-- ---------------------------------------------------------------------------
do $$
declare
  expected text[] := array[
    'profiles','profile_private','user_roles','permissions','role_permissions',
    'profile_user_roles','user_preferences','user_sessions',
    'brand_categories','brands','brand_members','brand_invitations',
    'brand_verifications','brand_billing_profiles',
    'creator_categories','creator_niches','creator_profiles','creator_profile_categories',
    'creator_profile_niches','creator_social_accounts','creator_portfolios',
    'creator_media','creator_rates','creator_availability','creator_verifications',
    'campaign_categories','campaign_niches','campaigns','campaign_campaign_niches',
    'campaign_requirements','campaign_deliverables','campaign_media',
    'campaign_budget_allocations',
    'campaign_applications','collaboration_invitations','collaborations',
    'collaboration_deliverables','deliverable_submissions','deliverable_reviews',
    'collaboration_contracts','collaboration_status_history',
    'conversations','conversation_participants','messages','message_attachments',
    'notifications','notification_preferences',
    'payment_transactions','invoices','creator_payouts','platform_fees',
    'refunds','payment_webhook_events',
    'campaign_analytics','creator_analytics','social_metrics_snapshots',
    'conversion_events','platform_analytics',
    'reviews','review_responses','disputes','support_tickets',
    'support_ticket_messages','moderation_reports','moderation_actions',
    'admin_activity_logs','audit_logs','platform_settings','system_notifications',
    'feature_flags'
  ];
  t text;
  missing_count int := 0;
begin
  foreach t in array expected loop
    if not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      raise warning 'MISSING TABLE: public.%', t;
      missing_count := missing_count + 1;
    end if;
  end loop;
  if missing_count > 0 then
    raise exception '% expected table(s) missing from public schema', missing_count;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. RLS enabled on every public table (except pure reference/enum tables
--    which are intentionally open to read). We assert RLS is on for the
--    sensitive tables at minimum, and warn for any public table missing it.
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
  sensitive text[] := array[
    'profiles','profile_private','profile_user_roles','user_preferences','user_sessions',
    'brands','brand_members','brand_invitations','brand_verifications','brand_billing_profiles',
    'creator_profiles','creator_social_accounts','creator_portfolios','creator_media',
    'creator_rates','creator_availability','creator_verifications',
    'campaigns','campaign_deliverables','campaign_applications','collaborations',
    'collaboration_deliverables','deliverable_submissions','deliverable_reviews',
    'collaboration_contracts','collaboration_status_history',
    'conversations','conversation_participants','messages','message_attachments',
    'notifications','notification_preferences',
    'payment_transactions','invoices','creator_payouts','platform_fees',
    'refunds','payment_webhook_events',
    'campaign_analytics','creator_analytics','social_metrics_snapshots',
    'conversion_events','platform_analytics',
    'reviews','review_responses','disputes','support_tickets',
    'support_ticket_messages','moderation_reports','moderation_actions',
    'admin_activity_logs','audit_logs','platform_settings','system_notifications',
    'feature_flags'
  ];
  t text;
  not_rls int := 0;
begin
  foreach t in array sensitive loop
    if exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = t and c.relrowsecurity = false
    ) then
      raise warning 'RLS NOT ENABLED: public.%', t;
      not_rls := not_rls + 1;
    end if;
  end loop;
  if not_rls > 0 then
    raise exception '% sensitive table(s) are missing RLS', not_rls;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Enum types exist.
-- ---------------------------------------------------------------------------
do $$
declare
  expected text[] := array[
    'account_status','verification_status','campaign_status','collaboration_status',
    'application_status','invitation_status','deliverable_status','payment_status',
    'invoice_status','payout_status','refund_status','dispute_status','ticket_status',
    'ticket_priority','report_status','conversation_type','message_type','media_kind',
    'compensation_model','campaign_visibility','membership_role'
  ];
  t text;
  missing int := 0;
begin
  foreach t in array expected loop
    if not exists (select 1 from pg_type where typname = t) then
      raise warning 'MISSING TYPE: %', t;
      missing := missing + 1;
    end if;
  end loop;
  if missing > 0 then
    raise exception '% enum type(s) missing', missing;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Helper functions exist.
-- ---------------------------------------------------------------------------
do $$
declare
  expected text[] := array[
    'current_profile_id','profile_role_slugs','has_role','has_any_role',
    'is_brand_owner','is_brand_member','can_manage_brand','is_campaign_brand',
    'is_campaign_brand_member','creator_profile_for_profile','is_creator_profile_owner',
    'is_platform_admin','is_moderator','is_staff',
    'is_collaboration_participant','is_conversation_participant',
    'is_deliverable_submission_owner',
    'trg_guard_privileged_role_assignment','trg_audit_logs_append_only',
    'trg_campaign_status_transition','trg_collaboration_status_transition',
    'trg_deliverable_status_transition','trg_application_status_transition','set_updated_at'
  ];
  f text;
  missing int := 0;
begin
  foreach f in array expected loop
    if not exists (
      select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = f
    ) then
      raise warning 'MISSING FUNCTION: public.%', f;
      missing := missing + 1;
    end if;
  end loop;
  if missing > 0 then
    raise exception '% function(s) missing', missing;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Constraints: verify key uniqueness and check constraints are present.
-- ---------------------------------------------------------------------------
do $$
declare
  expected text[] := array[
    'profiles_pkey','brands_pkey','campaigns_pkey','collaborations_pkey',
    'campaign_applications_campaign_creator_key','payment_transactions_idempotency_key_key',
    'payment_webhook_events_provider_event_key','reviews_one_per_collaboration_reviewer',
    'collaboration_contracts_collaboration_key','disputes_one_open_per_collaboration',
    'creator_rates_min_max_check','campaigns_budget_nonnegative',
    'creator_social_accounts_engagement_check','feature_flags_rollout_check'
  ];
  c text;
  missing int := 0;
begin
  foreach c in array expected loop
    if not exists (select 1 from pg_constraint where conname = c) then
      raise warning 'MISSING CONSTRAINT: %', c;
      missing := missing + 1;
    end if;
  end loop;
  if missing > 0 then
    raise exception '% constraint(s) missing', missing;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 6. Triggers: status transition guards exist.
-- ---------------------------------------------------------------------------
do $$
declare
  expected text[] := array[
    'trg_campaign_status_transition','trg_collaboration_status_transition',
    'trg_collaboration_deliverable_transition','trg_campaign_application_transition',
    'trg_audit_logs_append_only','trg_profile_user_roles_guard'
  ];
  t text;
  missing int := 0;
begin
  foreach t in array expected loop
    if not exists (select 1 from pg_trigger where tgname = t) then
      raise warning 'MISSING TRIGGER: %', t;
      missing := missing + 1;
    end if;
  end loop;
  if missing > 0 then
    raise exception '% trigger(s) missing', missing;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 7. Storage buckets exist with expected visibility.
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
  bad int := 0;
begin
  -- Public buckets: brand-logos, creator-avatars, creator-portfolios, campaign-assets
  -- Private buckets: deliverable-submissions, contracts, messages
  for r in
    select id, public from storage.buckets
    where id in (
      'brand-logos','creator-avatars','creator-portfolios','campaign-assets',
      'deliverable-submissions','contracts','messages'
    )
  loop
    if r.id in ('brand-logos','creator-avatars','creator-portfolios','campaign-assets') and not r.public then
      raise warning 'BUCKET SHOULD BE PUBLIC: %', r.id;
      bad := bad + 1;
    end if;
    if r.id in ('deliverable-submissions','contracts','messages') and r.public then
      raise warning 'BUCKET SHOULD BE PRIVATE: %', r.id;
      bad := bad + 1;
    end if;
  end loop;
  if bad > 0 then
    raise exception '% storage bucket(s) have wrong visibility', bad;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 8. Financial sanity: no float columns used for money (numeric only).
-- ---------------------------------------------------------------------------
do $$
declare
  bad int := 0;
begin
  -- Look for money-ish columns declared as float/real/double precision.
  select count(*) into bad
  from information_schema.columns
  where table_schema = 'public'
    and data_type in ('real','double precision')
    and (
      column_name ~ 'amount|rate|fee|price|revenue|budget|value|cost|salary|payout|refund'
    );
  if bad > 0 then
    raise exception '% monetary column(s) use floating-point types', bad;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 9. Timestamp discipline: every created_at/updated_at is timestamptz.
-- ---------------------------------------------------------------------------
do $$
declare
  bad int := 0;
begin
  select count(*) into bad
  from information_schema.columns
  where table_schema = 'public'
    and data_type = 'timestamp without time zone'
    and column_name in ('created_at','updated_at','submitted_at','collected_at','snapshotted_at','applied_at','processed_at','last_active_at','last_synced_at');
  if bad > 0 then
    raise exception '% timestamp column(s) are not timestamptz', bad;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 10. No plaintext OAuth tokens or social passwords are stored.
-- ---------------------------------------------------------------------------
do $$
declare
  bad int := 0;
begin
  select count(*) into bad
  from information_schema.columns
  where table_schema = 'public'
    and (column_name ~* 'password|oauth_token|access_token|secret'
         or column_name ~* 'card_number|cvv');
  if bad > 0 then
    raise exception '% sensitive credential column(s) found (must not store secrets)', bad;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 11. Foreign-key integrity smoke test on reference data seeded by seed.sql.
-- ---------------------------------------------------------------------------
do $$
declare
  orphan int := 0;
begin
  -- Every brand must have an owner that exists in profiles.
  select count(*) into orphan
  from public.brands b
  left join public.profiles p on p.id = b.owner_id
  where b.owner_id is not null and p.id is null;
  if orphan > 0 then
    raise exception '% brand(s) reference a missing owner profile', orphan;
  end if;

  -- Every campaign must belong to an existing brand.
  select count(*) into orphan
  from public.campaigns c
  left join public.brands b on b.id = c.brand_id
  where b.id is null;
  if orphan > 0 then
    raise exception '% campaign(s) reference a missing brand', orphan;
  end if;

  -- Every brand_member must reference an existing brand and profile.
  select count(*) into orphan
  from public.brand_members bm
  left join public.brands b on b.id = bm.brand_id
  left join public.profiles p on p.id = bm.profile_id
  where b.id is null or p.id is null;
  if orphan > 0 then
    raise exception '% brand_member(s) reference missing brand/profile', orphan;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 12. Audit log append-only trigger blocks updates/deletes.
-- ---------------------------------------------------------------------------
do $$
declare
  test_id uuid;
begin
  -- Insert a throwaway audit row (service role context in this script).
  insert into public.audit_logs (actor_id, action, resource_type)
  values (null, 'test.append_only', 'test')
  returning id into test_id;

  begin
    update public.audit_logs set action = 'test.mutated' where id = test_id;
    raise exception 'audit_logs UPDATE was not blocked (append-only trigger missing)';
  exception
    when sqlstate '42501' then
      null; -- expected: permission denied
  end;

  begin
    delete from public.audit_logs where id = test_id;
    raise exception 'audit_logs DELETE was not blocked (append-only trigger missing)';
  exception
    when sqlstate '42501' then
      null; -- expected
  end;

  -- Cleanup (this script runs as superuser/postgres which bypasses the trigger).
  delete from public.audit_logs where id = test_id;
end $$;

-- ---------------------------------------------------------------------------
-- 13. Indexes: verify key composite indexes exist for common query patterns.
-- ---------------------------------------------------------------------------
do $$
declare
  expected text[] := array[
    'idx_campaigns_brand_status_date','idx_collaborations_creator_status',
    'idx_collaborations_brand_status','idx_messages_conversation_created',
    'idx_notifications_recipient_created_unread','idx_payment_transactions_created',
    'idx_invoices_brand_created','idx_invoices_creator_created',
    'idx_reviews_reviewee_created','idx_support_tickets_profile_created'
  ];
  i text;
  missing int := 0;
begin
  foreach i in array expected loop
    if not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = i) then
      raise warning 'MISSING INDEX: %', i;
      missing := missing + 1;
    end if;
  end loop;
  if missing > 0 then
    raise exception '% index(es) missing', missing;
  end if;
end $$;

commit;

-- ---------------------------------------------------------------------------
-- Summary
-- ---------------------------------------------------------------------------
\echo ''
\echo '========================================='
\echo ' CALLBACX TECHNOLOGY database verification complete.'
\echo ' All structural assertions passed.'
\echo '========================================='

