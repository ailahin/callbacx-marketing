-- Migration 0004: Creator and influencer management
-- Platform-agnostic social accounts; metrics are never fabricated — they are
-- either manually claimed (unverified) or synced from official provider APIs.

------------------------------------------------------------
-- creator_categories
------------------------------------------------------------

create table public.creator_categories (
  id uuid not null default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint creator_categories_pkey primary key (id),
  constraint creator_categories_name_key unique (name),
  constraint creator_categories_slug_key unique (slug)
);

create index idx_creator_categories_slug on public.creator_categories(slug);

------------------------------------------------------------
-- creator_niches
------------------------------------------------------------

create table public.creator_niches (
  id uuid not null default gen_random_uuid(),
  category_id uuid not null references public.creator_categories(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint creator_niches_pkey primary key (id),
  constraint creator_niches_category_name_key unique (category_id, name),
  constraint creator_niches_category_slug_key unique (category_id, slug)
);

create index idx_creator_niches_category_id on public.creator_niches(category_id);
create index idx_creator_niches_slug on public.creator_niches(slug);

------------------------------------------------------------
-- creator_profiles
------------------------------------------------------------

create table public.creator_profiles (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null,
  bio text,
  location jsonb default '{}'::jsonb,        -- {city, region, country, latitude, longitude}
  languages text[] not null default '{}'::text[],
  avatar_url text,                           -- public storage URL
  cover_url text,                            -- public storage URL
  contact_email text,
  website_url text,
  availability_status text not null default 'open', -- open | busy | unavailable
  collaboration_preferences jsonb default '{}'::jsonb,
  verification_status public.verification_status not null default 'pending',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  deleted_at timestamptz,
  constraint creator_profiles_pkey primary key (id),
  constraint creator_profiles_profile_id_key unique (profile_id),
  constraint creator_profiles_availability_check check (
    availability_status in ('open', 'busy', 'unavailable')
  ),
  constraint creator_profiles_contact_email_format check (
    contact_email is null or contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  constraint creator_profiles_website_url_format check (
    website_url is null or website_url ~* '^https?://'
  )
);

create index idx_creator_profiles_profile_id on public.creator_profiles(profile_id) where deleted_at is null;
create index idx_creator_profiles_availability on public.creator_profiles(availability_status) where is_active = true and deleted_at is null;
create index idx_creator_profiles_verification on public.creator_profiles(verification_status) where deleted_at is null;

------------------------------------------------------------
-- creator_profile_categories (creator <-> categories, many-to-many)
------------------------------------------------------------

create table public.creator_profile_categories (
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  creator_category_id uuid not null references public.creator_categories(id) on delete cascade,
  constraint creator_profile_categories_pkey primary key (creator_profile_id, creator_category_id)
);

------------------------------------------------------------
-- creator_profile_niches (creator <-> niches, many-to-many)
------------------------------------------------------------

create table public.creator_profile_niches (
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  creator_niche_id uuid not null references public.creator_niches(id) on delete cascade,
  constraint creator_profile_niches_pkey primary key (creator_profile_id, creator_niche_id)
);

------------------------------------------------------------
-- creator_social_accounts
-- No passwords or plaintext OAuth tokens ever stored here.
-- Official provider connections store platform account references only;
-- access tokens live in a server-side secrets vault (integration pending).
------------------------------------------------------------

create table public.creator_social_accounts (
  id uuid not null default gen_random_uuid(),
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  platform text not null,                    -- instagram, tiktok, youtube, ... (extensible)
  platform_user_id text,                     -- platform-native account id
  username text not null,
  profile_url text,
  is_verified boolean not null default false,-- platform-verified badge
  followers_count bigint,                    -- last synced or manually claimed value
  engagement_rate numeric(5, 2),             -- percentage, 2 decimals
  metrics_source text not null default 'manual', -- manual | platform_api
  last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint creator_social_accounts_pkey primary key (id),
  constraint creator_social_accounts_platform_username_key unique (creator_profile_id, platform, username),
  constraint creator_social_accounts_followers_check check (followers_count is null or followers_count >= 0),
  constraint creator_social_accounts_engagement_check check (
    engagement_rate is null or (engagement_rate >= 0 and engagement_rate <= 100)
  ),
  constraint creator_social_accounts_metrics_source_check check (
    metrics_source in ('manual', 'platform_api')
  )
);

create index idx_creator_social_accounts_creator on public.creator_social_accounts(creator_profile_id);
create index idx_creator_social_accounts_platform on public.creator_social_accounts(platform);
create index idx_creator_social_accounts_username on public.creator_social_accounts(platform, username);

------------------------------------------------------------
-- creator_portfolios
------------------------------------------------------------

create table public.creator_portfolios (
  id uuid not null default gen_random_uuid(),
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  title text not null,
  description text,
  is_public boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint creator_portfolios_pkey primary key (id)
);

create index idx_creator_portfolios_creator on public.creator_portfolios(creator_profile_id);

------------------------------------------------------------
-- creator_media
------------------------------------------------------------

create table public.creator_media (
  id uuid not null default gen_random_uuid(),
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  portfolio_id uuid references public.creator_portfolios(id) on delete set null,
  storage_path text not null,                -- creator-portfolios bucket path
  media_kind public.media_kind not null,
  title text,
  caption text,
  duration_seconds integer,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint creator_media_pkey primary key (id),
  constraint creator_media_duration_check check (duration_seconds is null or duration_seconds > 0)
);

create index idx_creator_media_creator on public.creator_media(creator_profile_id);
create index idx_creator_media_portfolio on public.creator_media(portfolio_id);

------------------------------------------------------------
-- creator_rates
------------------------------------------------------------

create table public.creator_rates (
  id uuid not null default gen_random_uuid(),
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  service_type text not null,                -- e.g. "sponsored_post", "story", "reel", "video", "appearance"
  min_rate numeric(12, 2) not null,
  max_rate numeric(12, 2) not null,
  currency text not null default 'USD',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint creator_rates_pkey primary key (id),
  constraint creator_rates_min_max_check check (min_rate <= max_rate),
  constraint creator_rates_rate_positive check (min_rate >= 0 and max_rate >= 0)
);

create index idx_creator_rates_creator on public.creator_rates(creator_profile_id);

------------------------------------------------------------
-- creator_availability
------------------------------------------------------------

create table public.creator_availability (
  id uuid not null default gen_random_uuid(),
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status text not null default 'available',  -- available | booked | hold
  note text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint creator_availability_pkey primary key (id),
  constraint creator_availability_dates_check check (end_date >= start_date)
);

create index idx_creator_availability_creator on public.creator_availability(creator_profile_id);
create index idx_creator_availability_dates on public.creator_availability(start_date, end_date);

------------------------------------------------------------
-- creator_verifications
------------------------------------------------------------

create table public.creator_verifications (
  id uuid not null default gen_random_uuid(),
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  document_type text not null,               -- e.g. "identity", "media_kit"
  document_url text not null,                -- private storage path
  status public.verification_status not null default 'pending',
  submitted_at timestamptz not null default timezone('utc'::text, now()),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint creator_verifications_pkey primary key (id)
);

create index idx_creator_verifications_creator_id on public.creator_verifications(creator_profile_id);
create index idx_creator_verifications_status on public.creator_verifications(status);

------------------------------------------------------------
-- Comments
------------------------------------------------------------

comment on table public.creator_profiles is 'Creator/influencer profile linked 1:1 to profiles.';
comment on table public.creator_social_accounts is 'Social platform accounts. Metrics sourced manually or from platform API; never fabricated.';
comment on table public.creator_media is 'Portfolio media stored in Supabase Storage (creator-portfolios bucket).';
