-- Migration 0012: Database helper functions and trigger functions
-- All functions are SECURITY DEFINER where they inspect ownership/roles, so
-- RLS-restricted lookups work for the caller. auth.uid() is session-local and
-- is never spoofable from the client.

------------------------------------------------------------
-- Session / identity helpers
------------------------------------------------------------

-- Returns the current profile id when auth.uid() maps to a profile, else null.
create or replace function public.current_profile_id() returns uuid
language sql
stable
as $$
  select auth.uid()
  where exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.deleted_at is null
  );
$$;

-- Slugs of all roles assigned to a profile.
create or replace function public.profile_role_slugs(p_profile uuid) returns text[]
language sql
stable
as $$
  select coalesce(array_agg(ur.slug) filter (where ur.slug is not null), '{}'::text[])
  from public.profile_user_roles pur
  join public.user_roles ur on ur.id = pur.role_id
  where pur.profile_id = p_profile;
$$;

create or replace function public.has_role(p_profile uuid, p_role text) returns boolean
language sql
stable
as $$
  select p_role = any(public.profile_role_slugs(p_profile));
$$;

create or replace function public.has_any_role(p_profile uuid, p_roles text[]) returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profile_user_roles pur
    join public.user_roles ur on ur.id = pur.role_id
    where pur.profile_id = p_profile and ur.slug = any(p_roles)
  );
$$;

------------------------------------------------------------
-- Brand access helpers
------------------------------------------------------------

create or replace function public.is_brand_owner(p_brand uuid, p_profile uuid) returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.brands b
    where b.id = p_brand and b.owner_id = p_profile and b.deleted_at is null
  );
$$;

create or replace function public.is_brand_member(p_brand uuid, p_profile uuid) returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.brand_members bm
    where bm.brand_id = p_brand
      and bm.profile_id = p_profile
      and bm.is_active = true
  );
$$;

-- Owner or active admin/member of the brand.
create or replace function public.can_manage_brand(p_brand uuid, p_profile uuid) returns boolean
language sql
stable
as $$
  select public.is_brand_owner(p_brand, p_profile)
     or exists (
       select 1 from public.brand_members bm
       where bm.brand_id = p_brand
         and bm.profile_id = p_profile
         and bm.is_active = true
         and bm.role in ('owner', 'admin')
     );
$$;

create or replace function public.is_campaign_brand(p_campaign uuid, p_profile uuid) returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.campaigns c
    join public.brands b on b.id = c.brand_id
    where c.id = p_campaign and c.deleted_at is null and b.owner_id = p_profile
  );
$$;

create or replace function public.is_campaign_brand_member(p_campaign uuid, p_profile uuid) returns boolean
language sql
stable
as $$
  select public.is_campaign_brand(p_campaign, p_profile)
     or exists (
       select 1 from public.campaigns c
       join public.brand_members bm on bm.brand_id = c.brand_id
       where c.id = p_campaign and c.deleted_at is null
         and bm.profile_id = p_profile and bm.is_active = true
     );
$$;

------------------------------------------------------------
-- Creator access helpers
------------------------------------------------------------

create or replace function public.creator_profile_for_profile(p_profile uuid) returns uuid
language sql
stable
as $$
  select id from public.creator_profiles
  where profile_id = p_profile and deleted_at is null
  limit 1;
$$;

create or replace function public.is_creator_profile_owner(p_creator_profile uuid, p_profile uuid) returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.creator_profiles cp
    where cp.id = p_creator_profile and cp.profile_id = p_profile and cp.deleted_at is null
  );
$$;

------------------------------------------------------------
-- Platform staff helpers
------------------------------------------------------------

create or replace function public.is_platform_admin(p_profile uuid) returns boolean
language sql
stable
as $$
  select public.has_role(p_profile, 'platform_admin');
$$;

create or replace function public.is_moderator(p_profile uuid) returns boolean
language sql
stable
as $$
  select public.has_role(p_profile, 'moderator');
$$;

create or replace function public.is_staff(p_profile uuid) returns boolean
language sql
stable
as $$
  select public.has_any_role(p_profile, array['platform_admin', 'moderator', 'support']);
$$;

------------------------------------------------------------
-- Privileged role assignment guard
-- Privileged roles (platform_admin, moderator) may only be granted by staff.
-- No role may be self-assigned to oneself for a privileged role.
------------------------------------------------------------

create or replace function public.trg_guard_privileged_role_assignment()
returns trigger
language plpgsql
security definer
as $$
declare
  privileged_roles text[] := array['platform_admin', 'moderator'];
  assigner uuid;
begin
  assigner := coalesce(new.assigned_by, auth.uid());

  -- Privileged roles require a staff assigner.
  if exists (
    select 1 from public.user_roles ur
    where ur.id = new.role_id and ur.is_privileged = true
  ) then
    if not public.is_staff(assigner) then
      raise exception 'Only platform staff can assign privileged roles (%, %)', new.profile_id, new.role_id
        using errcode = '42501';
    end if;
    if assigner = new.profile_id then
      raise exception 'Users cannot assign privileged roles to themselves';
    end if;
  end if;

  -- Non-staff users may only assign themselves the non-privileged 'creator' role.
  if not public.is_staff(assigner) then
    if assigner <> new.profile_id then
      raise exception 'Users can only assign roles to themselves';
    end if;
    if exists (
      select 1 from public.user_roles ur
      where ur.id = new.role_id and ur.slug <> 'creator'
    ) then
      raise exception 'Users can only self-assign the creator role';
    end if;
  end if;

  return new;
end;
$$;

------------------------------------------------------------
-- Audit log append-only guard
------------------------------------------------------------

create or replace function public.trg_audit_logs_append_only()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' or tg_op = 'DELETE' then
    raise exception 'audit_logs is append-only: updates and deletes are prohibited'
      using errcode = '42501';
  end if;
  if tg_op = 'INSERT' then
    -- Direct client inserts are blocked by RLS; server-side function inserts are allowed.
    return new;
  end if;
  return null;
end;
$$;

------------------------------------------------------------
-- Campaign status transition rules
--
-- draft        -> draft, pending_approval, archived, cancelled
-- pending_approval -> published, draft, archived, cancelled
-- published    -> paused, completed, archived, cancelled
-- paused       -> published, archived, cancelled
-- completed    -> archived
-- archived     -> (terminal)
-- cancelled    -> (terminal)
------------------------------------------------------------

create or replace function public.trg_campaign_status_transition()
returns trigger
language plpgsql
as $$
declare
  allowed text[];
begin
  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    allowed := case old.status
      when 'draft' then array['draft','pending_approval','archived','cancelled']
      when 'pending_approval' then array['published','draft','archived','cancelled']
      when 'published' then array['paused','completed','archived','cancelled']
      when 'paused' then array['published','archived','cancelled']
      when 'completed' then array['archived']
      else array[]::text[]
    end;

    if not (new.status = any(allowed)) then
      raise exception 'Invalid campaign status transition from % to %', old.status, new.status
        using errcode = '42501';
    end if;

    if new.status = 'published' then
      new.approved_at = timezone('utc'::text, now());
      new.approved_by = coalesce(new.approved_by, auth.uid());
    end if;
  end if;
  return new;
end;
$$;

------------------------------------------------------------
-- Collaboration status transition rules
--
-- negotiating -> active, cancelled, disputed
-- active      -> paused, completed, cancelled, disputed
-- paused      -> active, completed, cancelled, disputed
-- disputed    -> active, completed, cancelled
-- completed   -> (terminal)
-- cancelled   -> (terminal)
------------------------------------------------------------

create or replace function public.trg_collaboration_status_transition()
returns trigger
language plpgsql
as $$
declare
  allowed text[];
begin
  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    allowed := case old.status
      when 'negotiating' then array['active','cancelled','disputed']
      when 'active' then array['paused','completed','cancelled','disputed']
      when 'paused' then array['active','completed','cancelled','disputed']
      when 'disputed' then array['active','completed','cancelled']
      else array[]::text[]
    end;

    if not (new.status = any(allowed)) then
      raise exception 'Invalid collaboration status transition from % to %', old.status, new.status
        using errcode = '42501';
    end if;

    if new.status = 'completed' then
      new.completed_at = timezone('utc'::text, now());
    end if;
  end if;
  return new;
end;
$$;

------------------------------------------------------------
-- Deliverable status transition rules
--
-- pending           -> submitted
-- submitted         -> approved, revision_requested, rejected
-- revision_requested -> submitted, rejected
-- approved          -> (terminal)
-- rejected          -> submitted   (resubmission after fixes)
------------------------------------------------------------

create or replace function public.trg_deliverable_status_transition()
returns trigger
language plpgsql
as $$
declare
  allowed text[];
begin
  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    allowed := case old.status
      when 'pending' then array['submitted']
      when 'submitted' then array['approved','revision_requested','rejected']
      when 'revision_requested' then array['submitted','rejected']
      else array[]::text[]
    end;

    if not (new.status = any(allowed)) then
      raise exception 'Invalid deliverable status transition from % to %', old.status, new.status
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

------------------------------------------------------------
-- Application status transition rules
--
-- pending      -> under_review, withdrawn
-- under_review -> accepted, rejected
-- accepted     -> (terminal)
-- rejected     -> (terminal)
-- withdrawn    -> (terminal)
------------------------------------------------------------

create or replace function public.trg_application_status_transition()
returns trigger
language plpgsql
as $$
declare
  allowed text[];
begin
  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    allowed := case old.status
      when 'pending' then array['under_review','withdrawn']
      when 'under_review' then array['accepted','rejected']
      else array[]::text[]
    end;

    if not (new.status = any(allowed)) then
      raise exception 'Invalid application status transition from % to %', old.status, new.status
        using errcode = '42501';
    end if;

    if new.status in ('accepted','rejected','withdrawn') then
      new.reviewed_at = timezone('utc'::text, now());
    end if;
  end if;
  return new;
end;
$$;

------------------------------------------------------------
-- Comments
------------------------------------------------------------

comment on function public.current_profile_id() is 'Maps the authenticated auth.users id to a public profile id. Returns null when no profile exists.';
comment on function public.can_manage_brand(uuid, uuid) is 'True for brand owners and active brand admins/members.';
comment on function public.trg_audit_logs_append_only() is 'Blocks UPDATE and DELETE on audit_logs.';
