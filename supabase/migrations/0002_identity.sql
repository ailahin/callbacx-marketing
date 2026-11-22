-- Migration 0002: Identity and user management
-- References Supabase auth.users (auth schema) — no duplicate authentication system.
-- Profiles link 1:1 to auth.users.id. Public data in profiles; private data in profile_private.

------------------------------------------------------------
-- profiles (public profile information)
------------------------------------------------------------

create table public.profiles (
  id uuid not null default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,                           -- public storage URL (brand-logos / creator-avatars buckets)
  headline text,                             -- short public tagline
  bio text,
  location text,                             -- free-text city/country for public display
  website_url text,
  is_public boolean not null default true,
  status public.account_status not null default 'active',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  deleted_at timestamptz,                    -- soft delete; null = active
  constraint profiles_pkey primary key (id),
  constraint profiles_auth_user_id_key unique (auth_user_id),
  constraint profiles_website_url_format check (
    website_url is null or website_url ~* '^https?://'
  )
);

create index idx_profiles_auth_user_id on public.profiles(auth_user_id);
create index idx_profiles_status on public.profiles(status) where deleted_at is null;
create index idx_profiles_is_public on public.profiles(is_public) where deleted_at is null and is_public = true;

------------------------------------------------------------
-- profile_private (private account information — owner only)
------------------------------------------------------------

create table public.profile_private (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  phone text,
  date_of_birth date,
  address jsonb default '{}'::jsonb,         -- {street, city, region, postal_code, country}
  id_document_url text,                      -- private storage path (verified identities)
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint profile_private_pkey primary key (id),
  constraint profile_private_profile_id_key unique (profile_id)
);

create index idx_profile_private_profile_id on public.profile_private(profile_id);

------------------------------------------------------------
-- user_roles (role definitions)
------------------------------------------------------------

create table public.user_roles (
  id uuid not null default gen_random_uuid(),
  name text not null,                        -- human readable, e.g. "Platform Administrator"
  slug text not null,                        -- stable code reference, e.g. "platform_admin"
  description text,
  is_privileged boolean not null default false, -- cannot be self-assigned by a user
  is_system boolean not null default false,   -- system roles cannot be deleted
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint user_roles_pkey primary key (id),
  constraint user_roles_slug_key unique (slug),
  constraint user_roles_name_key unique (name)
);

create index idx_user_roles_slug on public.user_roles(slug);
create index idx_user_roles_privileged on public.user_roles(is_privileged);

------------------------------------------------------------
-- permissions
------------------------------------------------------------

create table public.permissions (
  id uuid not null default gen_random_uuid(),
  name text not null,
  slug text not null,                        -- e.g. "campaigns.create", "brands.manage"
  resource text not null,                    -- e.g. "campaigns", "brands", "users"
  action text not null,                      -- e.g. "create", "read", "update", "delete", "manage"
  description text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint permissions_pkey primary key (id),
  constraint permissions_slug_key unique (slug)
);

create index idx_permissions_slug on public.permissions(slug);
create index idx_permissions_resource_action on public.permissions(resource, action);

------------------------------------------------------------
-- role_permissions
------------------------------------------------------------

create table public.role_permissions (
  role_id uuid not null references public.user_roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  granted_at timestamptz not null default timezone('utc'::text, now()),
  constraint role_permissions_pkey primary key (role_id, permission_id)
);

------------------------------------------------------------
-- profile_user_roles (many-to-many: profiles <-> roles)
------------------------------------------------------------

create table public.profile_user_roles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.user_roles(id) on delete cascade,
  assigned_by uuid references auth.users(id), -- who granted the role (audit)
  assigned_at timestamptz not null default timezone('utc'::text, now()),
  constraint profile_user_roles_pkey primary key (profile_id, role_id)
);

create index idx_profile_user_roles_profile_id on public.profile_user_roles(profile_id);
create index idx_profile_user_roles_role_id on public.profile_user_roles(role_id);

------------------------------------------------------------
-- user_preferences
------------------------------------------------------------

create table public.user_preferences (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  email_notifications boolean not null default true,
  push_notifications boolean not null default true,
  newsletter boolean not null default false,
  theme text not null default 'system',
  language text not null default 'en',
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint user_preferences_pkey primary key (profile_id)
);

------------------------------------------------------------
-- user_sessions (session metadata — no tokens stored)
------------------------------------------------------------

create table public.user_sessions (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  user_agent text,
  ip_address inet,
  last_active_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint user_sessions_pkey primary key (id)
);

create index idx_user_sessions_profile_id on public.user_sessions(profile_id);
create index idx_user_sessions_last_active on public.user_sessions(last_active_at);

------------------------------------------------------------
-- Comments
------------------------------------------------------------

comment on table public.profiles is 'Public profile linked 1:1 to auth.users. Public fields only.';
comment on table public.profile_private is 'Private account information. Accessible only by the profile owner.';
comment on table public.user_roles is 'Role definitions. Privileged roles cannot be self-assigned.';
comment on table public.profile_user_roles is 'Assigns roles to profiles. Privileged role assignment restricted by trigger.';
comment on table public.user_sessions is 'Session metadata only. No access/refresh tokens are ever stored here.';
