-- CALLBACX TECHNOLOGY â€” Row Level Security test harness
--
-- This script seeds a throwaway set of users/brands/campaigns (using fixed
-- uuids so it is idempotent), then impersonates each role via
-- `set local role authenticated` + `set request.jwt.claims` to assert that
-- RLS returns the expected rows and blocks unauthorised access.
--
-- Run against a LOCAL Supabase instance:
--   psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f supabase/tests/rls.sql
--
-- It requires auth.users rows for the test ids. If they do not exist, the
-- script creates them with a crypted password (local dev only) so the profile
-- FKs resolve. This never runs against production.
--
-- Every assertion uses a DO block that RAISES on failure, so a non-zero exit
-- status means a broken RLS policy.

\set ON_ERROR_STOP on

begin;

-- ---------------------------------------------------------------------------
-- 0. Create local test auth users if missing (dev only).
--    auth.users has many NOT NULL columns; we insert the minimum viable set.
-- ---------------------------------------------------------------------------
do $$
declare
  uid uuid;
  test_uuids uuid[] := array[
    'a0000000-0000-0000-0000-000000000001', -- admin
    'a0000000-0000-0000-0000-000000000002', -- brand owner A
    'a0000000-0000-0000-0000-000000000003', -- brand member A
    'a0000000-0000-0000-0000-000000000004', -- brand owner B (other tenant)
    'a0000000-0000-0000-0000-000000000005', -- creator 1
    'a0000000-0000-0000-0000-000000000006'  -- creator 2
  ];
begin
  foreach uid in array test_uuids loop
    if not exists (select 1 from auth.users where id = uid) then
      insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
      values (
        uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        uid || '@test.local',
        crypt('password', gen_salt('bf')),
        now(),
        now(),
        now()
      );
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Profiles + roles for the test users (mirror the seed structure).
-- ---------------------------------------------------------------------------
do $$
declare
  admin uuid := 'a0000000-0000-0000-0000-000000000001';
  owner_a uuid := 'a0000000-0000-0000-0000-000000000002';
  member_a uuid := 'a0000000-0000-0000-0000-000000000003';
  owner_b uuid := 'a0000000-0000-0000-0000-000000000004';
  creator1 uuid := 'a0000000-0000-0000-0000-000000000005';
  creator2 uuid := 'a0000000-0000-0000-0000-000000000006';
begin
  insert into public.profiles (id, auth_user_id, full_name, is_public)
  values
    (admin, admin, 'RLS Admin', true),
    (owner_a, owner_a, 'RLS Owner A', true),
    (member_a, member_a, 'RLS Member A', true),
    (owner_b, owner_b, 'RLS Owner B', true),
    (creator1, creator1, 'RLS Creator 1', true),
    (creator2, creator2, 'RLS Creator 2', true)
  on conflict (id) do nothing;

  insert into public.user_preferences (profile_id)
  select id from public.profiles
  where id in (admin, owner_a, member_a, owner_b, creator1, creator2)
  on conflict (profile_id) do nothing;

  -- Admin role
  insert into public.profile_user_roles (profile_id, role_id, assigned_by)
  select admin, '00000000-0000-0000-0000-000000000001', admin
  where not exists (select 1 from public.profile_user_roles where profile_id = admin);

  -- Creator role for creators
  insert into public.profile_user_roles (profile_id, role_id, assigned_by)
  select creator1, '00000000-0000-0000-0000-000000000006', admin
  where not exists (select 1 from public.profile_user_roles where profile_id = creator1);
  insert into public.profile_user_roles (profile_id, role_id, assigned_by)
  select creator2, '00000000-0000-0000-0000-000000000006', admin
  where not exists (select 1 from public.profile_user_roles where profile_id = creator2);
end $$;

-- ---------------------------------------------------------------------------
-- 2. Two brands (tenant A and tenant B), a member, creators, a campaign,
--    and an application so RLS can be exercised.
-- ---------------------------------------------------------------------------
do $$
declare
  owner_a uuid := 'a0000000-0000-0000-0000-000000000002';
  member_a uuid := 'a0000000-0000-0000-0000-000000000003';
  owner_b uuid := 'a0000000-0000-0000-0000-000000000004';
  creator1 uuid := 'a0000000-0000-0000-0000-000000000005';
  brand_a uuid := 'b000000a-0000-0000-0000-000000000001';
  brand_b uuid := 'b000000b-0000-0000-0000-000000000002';
  campaign_a uuid := 'c000000a-0000-0000-0000-000000000001';
begin
  insert into public.brands (id, owner_id, name, verification_status, is_active)
  values
    (brand_a, owner_a, 'RLS Brand A', 'verified', true),
    (brand_b, owner_b, 'RLS Brand B', 'verified', true)
  on conflict (id) do nothing;

  -- Brand A team: owner is implied by owner_id; add a member.
  insert into public.brand_members (brand_id, profile_id, role, invited_by)
  values (brand_a, member_a, 'member', owner_a)
  on conflict (brand_id, profile_id) do nothing;

  -- Creator profiles
  insert into public.creator_profiles (id, profile_id, display_name, availability_status, verification_status)
  values
    (creator1, creator1, 'RLS Creator One', 'open', 'verified'),
    ('a0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006', 'RLS Creator Two', 'open', 'pending')
  on conflict (id) do nothing;

  -- Brand A campaign (published, public)
  insert into public.campaigns (id, brand_id, title, status, visibility, budget_total, is_active)
  values (campaign_a, brand_a, 'RLS Campaign A', 'published', 'public', 1000.00, true)
  on conflict (id) do nothing;

  -- Creator 1 applies to brand A campaign
  insert into public.campaign_applications (campaign_id, creator_profile_id, status)
  values (campaign_a, creator1, 'pending')
  on conflict (campaign_id, creator_profile_id) do nothing;
end $$;

-- ===========================================================================
-- RLS TESTS
-- Each test impersonates a user and asserts expected visibility.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Test 1: Anonymous (no auth) can read published public campaigns.
-- ---------------------------------------------------------------------------
do $$
declare
  cnt int;
begin
  perform set_config('request.jwt.claims', '{}', true);
  set local role anon;
  select count(*) into cnt from public.campaigns
  where id = 'c000000a-0000-0000-0000-000000000001';
  reset role;
  if cnt <> 1 then
    raise exception 'RLS FAIL: anon cannot read published public campaign (got %)', cnt;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Test 2: Anonymous cannot see brand A's draft campaign.
-- ---------------------------------------------------------------------------
do $$
declare
  cnt int;
  draft uuid := 'c000000a-0000-0000-0000-000000000002';
begin
  -- Create a draft as postgres first.
  insert into public.campaigns (id, brand_id, title, status, visibility, is_active)
  values (draft, 'b000000a-0000-0000-0000-000000000001', 'RLS Draft A', 'draft', 'public', true)
  on conflict (id) do nothing;

  perform set_config('request.jwt.claims', '{}', true);
  set local role anon;
  select count(*) into cnt from public.campaigns where id = draft;
  reset role;
  if cnt <> 0 then
    raise exception 'RLS FAIL: anon can see a draft campaign (got %)', cnt;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Test 3: Brand B owner cannot see Brand A's campaigns.
-- ---------------------------------------------------------------------------
do $$
declare
  cnt int;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into cnt from public.campaigns
  where id = 'c000000a-0000-0000-0000-000000000001';
  reset role;
  if cnt <> 0 then
    raise exception 'RLS FAIL: Brand B owner can see Brand A draft/private campaign (got %)', cnt;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Test 4: Brand A member CAN see Brand A's draft campaign.
-- ---------------------------------------------------------------------------
do $$
declare
  cnt int;
  draft uuid := 'c000000a-0000-0000-0000-000000000002';
begin
  perform set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into cnt from public.campaigns where id = draft;
  reset role;
  if cnt <> 1 then
    raise exception 'RLS FAIL: Brand A member cannot see own brand draft (got %)', cnt;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Test 5: Creator 1 can read their own application; Creator 2 cannot.
-- ---------------------------------------------------------------------------
do $$
declare
  cnt int;
begin
  -- Creator 1 (applicant) sees own application.
  perform set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into cnt from public.campaign_applications
  where campaign_id = 'c000000a-0000-0000-0000-000000000001'
    and creator_profile_id = 'a0000000-0000-0000-0000-000000000005';
  reset role;
  if cnt <> 1 then
    raise exception 'RLS FAIL: creator 1 cannot read own application (got %)', cnt;
  end if;

  -- Creator 2 cannot see creator 1's application.
  perform set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into cnt from public.campaign_applications
  where creator_profile_id = 'a0000000-0000-0000-0000-000000000005';
  reset role;
  if cnt <> 0 then
    raise exception 'RLS FAIL: creator 2 can see creator 1 application (got %)', cnt;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Test 6: Brand A member can read applications to brand A's campaign.
-- ---------------------------------------------------------------------------
do $$
declare
  cnt int;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into cnt from public.campaign_applications
  where campaign_id = 'c000000a-0000-0000-0000-000000000001';
  reset role;
  if cnt < 1 then
    raise exception 'RLS FAIL: brand A member cannot read applications to own campaign (got %)', cnt;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Test 7: A creator cannot insert a campaign (RLS blocks brand-scoped write).
-- ---------------------------------------------------------------------------
do $$
declare
  inserted int;
  new_id uuid := 'c000000a-0000-0000-0000-000000000099';
begin
  perform set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
  set local role authenticated;
  insert into public.campaigns (id, brand_id, title, status, visibility)
  values (new_id, 'b000000a-0000-0000-0000-000000000001', 'Illegal', 'draft', 'public')
  on conflict (id) do nothing;
  select count(*) into inserted from public.campaigns where id = new_id;
  reset role;
  if inserted <> 0 then
    delete from public.campaigns where id = new_id;
    raise exception 'RLS FAIL: creator was able to insert a campaign';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Test 8: Duplicate application is blocked (unique constraint + RLS).
-- ---------------------------------------------------------------------------
do $$
declare
  dup int;
begin
  -- Attempt as creator 1 again; the unique constraint must reject it.
  perform set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
  set local role authenticated;
  begin
    insert into public.campaign_applications (campaign_id, creator_profile_id, status)
    values ('c000000a-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'pending');
    reset role;
    raise exception 'RLS FAIL: duplicate application was allowed';
  exception
    when unique_violation then
      reset role;
      null; -- expected
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Test 9: Privileged role self-assignment is blocked for non-staff.
-- ---------------------------------------------------------------------------
do $$
declare
  assigned int;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
  set local role authenticated;
  begin
    insert into public.profile_user_roles (profile_id, role_id, assigned_by)
    values ('a0000000-0000-0000-0000-000000000005',
            '00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005');
    reset role;
    raise exception 'RLS FAIL: creator self-assigned platform_admin';
  exception
    when insufficient_privilege or check_violation or foreign_key_violation then
      reset role;
      null; -- expected (42501 or similar)
  end;
  -- Verify it did not get assigned.
  select count(*) into assigned from public.profile_user_roles
  where profile_id = 'a0000000-0000-0000-0000-000000000005'
    and role_id = '00000000-0000-0000-0000-000000000001';
  if assigned <> 0 then
    delete from public.profile_user_roles
    where profile_id = 'a0000000-0000-0000-0000-000000000005'
      and role_id = '00000000-0000-0000-0000-000000000001';
    raise exception 'RLS FAIL: privileged role was actually assigned';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Test 10: Profile private data is owner-only.
-- ---------------------------------------------------------------------------
do $$
declare
  cnt int;
begin
  -- Seed a private row for creator 1.
  insert into public.profile_private (profile_id, phone)
  values ('a0000000-0000-0000-0000-000000000005', '555-0100')
  on conflict (profile_id) do nothing;

  -- Creator 1 reads own private data.
  perform set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into cnt from public.profile_private
  where profile_id = 'a0000000-0000-0000-0000-000000000005';
  reset role;
  if cnt <> 1 then
    raise exception 'RLS FAIL: creator cannot read own private profile (got %)', cnt;
  end if;

  -- Creator 2 cannot read creator 1's private data.
  perform set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into cnt from public.profile_private
  where profile_id = 'a0000000-0000-0000-0000-000000000005';
  reset role;
  if cnt <> 0 then
    raise exception 'RLS FAIL: creator 2 can read creator 1 private data (got %)', cnt;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Test 11: Payment transactions are not readable by an unrelated creator.
-- ---------------------------------------------------------------------------
do $$
declare
  cnt int;
  collab uuid := 'd000000a-0000-0000-0000-000000000001';
  txn uuid := 'e000000a-0000-0000-0000-000000000001';
begin
  -- Create collaboration + payment as postgres.
  insert into public.collaborations (id, campaign_id, brand_id, creator_profile_id, status, agreed_fee)
  values (collab, 'c000000a-0000-0000-0000-000000000001',
          'b000000a-0000-0000-0000-000000000001',
          'a0000000-0000-0000-0000-000000000005', 'active', 500.00)
  on conflict (id) do nothing;

  insert into public.payment_transactions (id, collaboration_id, provider, idempotency_key, amount, status)
  values (txn, collab, 'manual', 'test-idem-1', 500.00, 'pending')
  on conflict (id) do nothing;

  -- Creator 2 (not a participant) must not see it.
  perform set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into cnt from public.payment_transactions where id = txn;
  reset role;
  if cnt <> 0 then
    raise exception 'RLS FAIL: unrelated creator can see payment transaction (got %)', cnt;
  end if;

  -- The brand owner (A) should see it (participant).
  perform set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into cnt from public.payment_transactions where id = txn;
  reset role;
  if cnt <> 1 then
    raise exception 'RLS FAIL: brand A owner cannot see own collaboration payment (got %)', cnt;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Test 12: Admin can read audit_logs; a regular user cannot.
-- ---------------------------------------------------------------------------
do $$
declare
  cnt int;
begin
  insert into public.audit_logs (actor_id, action, resource_type)
  values (null, 'test.rls_read', 'test');

  perform set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into cnt from public.audit_logs;
  reset role;
  if cnt <> 0 then
    raise exception 'RLS FAIL: regular user can read audit_logs (got %)', cnt;
  end if;

  perform set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into cnt from public.audit_logs;
  reset role;
  if cnt < 1 then
    raise exception 'RLS FAIL: admin cannot read audit_logs (got %)', cnt;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Test 13: Conversations are participant-only.
-- ---------------------------------------------------------------------------
do $$
declare
  cnt int;
  conv uuid := 'f000000a-0000-0000-0000-000000000001';
begin
  insert into public.conversations (id, type, created_by)
  values (conv, 'direct', 'a0000000-0000-0000-0000-000000000005')
  on conflict (id) do nothing;
  insert into public.conversation_participants (conversation_id, profile_id)
  values (conv, 'a0000000-0000-0000-0000-000000000005')
  on conflict (conversation_id, profile_id) do nothing;

  -- Creator 1 (participant) sees it.
  perform set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into cnt from public.conversations where id = conv;
  reset role;
  if cnt <> 1 then
    raise exception 'RLS FAIL: participant cannot read conversation (got %)', cnt;
  end if;

  -- Creator 2 (non-participant) cannot.
  perform set_config('request.jwt.claims',
    '{"sub":"a0000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into cnt from public.conversations where id = conv;
  reset role;
  if cnt <> 0 then
    raise exception 'RLS FAIL: non-participant can read conversation (got %)', cnt;
  end if;
end $$;

commit;

\echo ''
\echo '========================================='
\echo ' CALLBACX TECHNOLOGY RLS verification complete.'
\echo ' All isolation assertions passed.'
\echo '========================================='

