-- Migration 0011: Administration and audit
-- Audit records are append-only: ordinary users cannot insert/update/delete them.

------------------------------------------------------------
-- admin_activity_logs
------------------------------------------------------------

create table public.admin_activity_logs (
  id uuid not null default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id),
  action text not null,                      -- e.g. "brand.verify", "campaign.moderate"
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint admin_activity_logs_pkey primary key (id)
);

create index idx_admin_activity_logs_admin on public.admin_activity_logs(admin_id, created_at desc);
create index idx_admin_activity_logs_target on public.admin_activity_logs(target_type, target_id);
create index idx_admin_activity_logs_created_at on public.admin_activity_logs(created_at desc);

------------------------------------------------------------
-- audit_logs (sensitive operations — append-only, admin read only)
------------------------------------------------------------

create table public.audit_logs (
  id uuid not null default gen_random_uuid(),
  actor_id uuid references public.profiles(id), -- null = system trigger
  action text not null,
  resource_type text not null,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint audit_logs_pkey primary key (id)
);

create index idx_audit_logs_actor on public.audit_logs(actor_id, created_at desc);
create index idx_audit_logs_resource on public.audit_logs(resource_type, resource_id);
create index idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- No updates or deletes permitted on audit_logs (enforced by trigger in migration 0013)

------------------------------------------------------------
-- platform_settings
------------------------------------------------------------

create table public.platform_settings (
  id uuid not null default gen_random_uuid(),
  setting_key text not null,
  setting_value jsonb not null default '{}'::jsonb,
  category text not null default 'general',
  is_public boolean not null default false,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint platform_settings_pkey primary key (id),
  constraint platform_settings_key_key unique (setting_key)
);

create index idx_platform_settings_key on public.platform_settings(setting_key);
create index idx_platform_settings_public on public.platform_settings(is_public) where is_public = true;

------------------------------------------------------------
-- system_notifications
------------------------------------------------------------

create table public.system_notifications (
  id uuid not null default gen_random_uuid(),
  title text not null,
  body text not null,
  target_role text not null default 'all',   -- all | brand | creator | admin
  created_at timestamptz not null default timezone('utc'::text, now()),
  expires_at timestamptz,
  constraint system_notifications_pkey primary key (id)
);

create index idx_system_notifications_target_role on public.system_notifications(target_role);

------------------------------------------------------------
-- feature_flags
------------------------------------------------------------

create table public.feature_flags (
  id uuid not null default gen_random_uuid(),
  flag_key text not null,
  enabled boolean not null default false,
  rollout_percentage numeric(5, 2) not null default 0,
  conditions jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint feature_flags_pkey primary key (id),
  constraint feature_flags_key_key unique (flag_key),
  constraint feature_flags_rollout_check check (rollout_percentage >= 0 and rollout_percentage <= 100)
);

create index idx_feature_flags_key on public.feature_flags(flag_key);

------------------------------------------------------------
-- Comments
------------------------------------------------------------

comment on table public.audit_logs is 'Append-only security audit log. Inserts via server-side function only; updates/deletes blocked by trigger.';
comment on table public.admin_activity_logs is 'Administrator activity trail (actor, action, resource, timestamp, metadata).';
comment on table public.platform_settings is 'Platform configuration. Public settings readable by all; others admin-only.';
