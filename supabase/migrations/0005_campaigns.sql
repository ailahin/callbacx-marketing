-- Migration 0005: Campaign management
-- Brands create campaigns; lifecycle enforced by server-side transition rules.

------------------------------------------------------------
-- campaign_categories
------------------------------------------------------------

create table public.campaign_categories (
  id uuid not null default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint campaign_categories_pkey primary key (id),
  constraint campaign_categories_name_key unique (name),
  constraint campaign_categories_slug_key unique (slug)
);

create index idx_campaign_categories_slug on public.campaign_categories(slug);

------------------------------------------------------------
-- campaign_niches
------------------------------------------------------------

create table public.campaign_niches (
  id uuid not null default gen_random_uuid(),
  category_id uuid not null references public.campaign_categories(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint campaign_niches_pkey primary key (id),
  constraint campaign_niches_category_name_key unique (category_id, name),
  constraint campaign_niches_category_slug_key unique (category_id, slug)
);

create index idx_campaign_niches_category_id on public.campaign_niches(category_id);

------------------------------------------------------------
-- campaigns
------------------------------------------------------------

create table public.campaigns (
  id uuid not null default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete restrict,
  title text not null,
  description text,
  brief text,
  category_id uuid references public.campaign_categories(id) on delete set null,
  status public.campaign_status not null default 'draft',
  objective text,
  target_audience jsonb default '{}'::jsonb, -- {age_range, locations, interests, genders}
  budget_total numeric(14, 2) not null default 0,
  budget_currency text not null default 'USD',
  compensation_model public.compensation_model not null default 'negotiable',
  payment_terms text,
  start_date timestamptz,
  end_date timestamptz,
  application_deadline timestamptz,
  location_requirements jsonb default '{}'::jsonb,
  platform_requirements text[] not null default '{}'::text[],
  visibility public.campaign_visibility not null default 'public',
  approval_required boolean not null default true,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  deleted_at timestamptz,
  constraint campaigns_pkey primary key (id),
  constraint campaigns_budget_nonnegative check (budget_total >= 0),
  constraint campaigns_dates_check check (
    end_date is null or start_date is null or end_date >= start_date
  ),
  constraint campaigns_deadline_check check (
    application_deadline is null or start_date is null or application_deadline <= start_date
  )
);

create index idx_campaigns_brand_id on public.campaigns(brand_id) where deleted_at is null;
create index idx_campaigns_status on public.campaigns(status) where deleted_at is null;
create index idx_campaigns_category on public.campaigns(category_id) where deleted_at is null;
create index idx_campaigns_dates on public.campaigns(start_date, end_date) where deleted_at is null;
create index idx_campaigns_visibility on public.campaigns(visibility) where deleted_at is null and status = 'published';

------------------------------------------------------------
-- campaign_campaign_niches (campaign <-> niches, many-to-many)
------------------------------------------------------------

create table public.campaign_campaign_niches (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  campaign_niche_id uuid not null references public.campaign_niches(id) on delete cascade,
  constraint campaign_campaign_niches_pkey primary key (campaign_id, campaign_niche_id)
);

------------------------------------------------------------
-- campaign_requirements
------------------------------------------------------------

create table public.campaign_requirements (
  id uuid not null default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  requirement text not null,
  is_mandatory boolean not null default true,
  order_index integer not null default 0,
  constraint campaign_requirements_pkey primary key (id)
);

create index idx_campaign_requirements_campaign on public.campaign_requirements(campaign_id);

------------------------------------------------------------
-- campaign_deliverables
------------------------------------------------------------

create table public.campaign_deliverables (
  id uuid not null default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  title text not null,
  description text,
  deliverable_type text not null,            -- e.g. "post", "story", "reel", "video", "tweet"
  platform text not null,
  due_date timestamptz,
  requirements jsonb default '{}'::jsonb,
  is_required boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint campaign_deliverables_pkey primary key (id)
);

create index idx_campaign_deliverables_campaign on public.campaign_deliverables(campaign_id);

------------------------------------------------------------
-- campaign_media
------------------------------------------------------------

create table public.campaign_media (
  id uuid not null default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  storage_path text not null,                -- campaign-assets bucket path
  media_kind public.media_kind not null,
  title text,
  alt_text text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint campaign_media_pkey primary key (id)
);

create index idx_campaign_media_campaign on public.campaign_media(campaign_id);

------------------------------------------------------------
-- campaign_budget_allocations
------------------------------------------------------------

create table public.campaign_budget_allocations (
  id uuid not null default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  allocation_type text not null,             -- creator_fee | platform_fee | boost | tax | other
  amount numeric(12, 2) not null,
  currency text not null default 'USD',
  description text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint campaign_budget_allocations_pkey primary key (id),
  constraint campaign_budget_allocations_amount_check check (amount >= 0)
);

create index idx_campaign_budget_allocations_campaign on public.campaign_budget_allocations(campaign_id);

------------------------------------------------------------
-- Comments
------------------------------------------------------------

comment on table public.campaigns is 'Brand-owned campaigns. Status transitions enforced server-side (see migration 0013).';
comment on table public.campaign_budget_allocations is 'Planned budget split by allocation type. Amounts in numeric (never float).';
