-- Migration 0003: Brand management
-- Multiple employees under one brand; brand owner + team member permissions;
-- verification status; billing profiles; multiple brands per authorised user.

------------------------------------------------------------
-- brand_categories
------------------------------------------------------------

create table public.brand_categories (
  id uuid not null default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint brand_categories_pkey primary key (id),
  constraint brand_categories_name_key unique (name),
  constraint brand_categories_slug_key unique (slug)
);

create index idx_brand_categories_slug on public.brand_categories(slug);

------------------------------------------------------------
-- brands
------------------------------------------------------------

create table public.brands (
  id uuid not null default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  legal_name text,
  trade_name text,
  description text,
  website_url text,
  contact_email text,
  contact_phone text,
  address jsonb default '{}'::jsonb,         -- {street, city, region, postal_code, country}
  brand_category_id uuid references public.brand_categories(id) on delete set null,
  logo_url text,                             -- public storage URL (brand-logos bucket)
  brand_kit jsonb default '{}'::jsonb,       -- {primary_color, secondary_color, font, logo_dark}
  verification_status public.verification_status not null default 'pending',
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  is_active boolean not null default true,
  status public.account_status not null default 'active',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  deleted_at timestamptz,                    -- soft delete
  constraint brands_pkey primary key (id),
  constraint brands_website_url_format check (
    website_url is null or website_url ~* '^https?://'
  ),
  constraint brands_contact_email_format check (
    contact_email is null or contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

create index idx_brands_owner_id on public.brands(owner_id) where deleted_at is null;
create index idx_brands_category on public.brands(brand_category_id) where deleted_at is null;
create index idx_brands_verification on public.brands(verification_status) where deleted_at is null;
create index idx_brands_status on public.brands(status) where deleted_at is null;

------------------------------------------------------------
-- brand_members (team members under a brand)
------------------------------------------------------------

create table public.brand_members (
  id uuid not null default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.membership_role not null default 'member',
  is_active boolean not null default true,
  invited_by uuid references public.profiles(id),
  joined_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint brand_members_pkey primary key (id),
  constraint brand_members_brand_profile_key unique (brand_id, profile_id),
  constraint brand_members_role_not_owner check (
    role <> 'owner'                               -- 'owner' is implied by brands.owner_id
  )
);

create index idx_brand_members_brand_id on public.brand_members(brand_id) where is_active = true;
create index idx_brand_members_profile_id on public.brand_members(profile_id) where is_active = true;

------------------------------------------------------------
-- brand_invitations
------------------------------------------------------------

create table public.brand_invitations (
  id uuid not null default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  email text not null,
  role public.membership_role not null default 'member',
  token text not null,                        -- single-use invitation token (hashed server-side)
  token_hash text not null,                   -- bcrypt/argon2 hash of token
  invited_by uuid not null references public.profiles(id),
  accepted_by uuid references public.profiles(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  status public.invitation_status not null default 'pending',
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint brand_invitations_pkey primary key (id),
  constraint brand_invitations_token_key unique (token),
  constraint brand_invitations_email_format check (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  constraint brand_invitations_expires_future check (expires_at > created_at)
);

create index idx_brand_invitations_brand_id on public.brand_invitations(brand_id);
create index idx_brand_invitations_token_hash on public.brand_invitations(token_hash);
create index idx_brand_invitations_email_status on public.brand_invitations(email, status) where status = 'pending';

------------------------------------------------------------
-- brand_verifications
------------------------------------------------------------

create table public.brand_verifications (
  id uuid not null default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  document_type text not null,                -- e.g. "business_registration", "tax_certificate"
  document_url text not null,                 -- private storage path
  status public.verification_status not null default 'pending',
  submitted_at timestamptz not null default timezone('utc'::text, now()),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint brand_verifications_pkey primary key (id)
);

create index idx_brand_verifications_brand_id on public.brand_verifications(brand_id);
create index idx_brand_verifications_status on public.brand_verifications(status);

------------------------------------------------------------
-- brand_billing_profiles
------------------------------------------------------------

create table public.brand_billing_profiles (
  id uuid not null default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  company_name text not null,
  tax_id text not null,                       -- access restricted (PII/financial)
  billing_email text not null,
  address jsonb default '{}'::jsonb,          -- billing address
  payment_provider text not null default 'stripe', -- abstract provider reference
  provider_customer_id text,                  -- Stripe customer id etc. (no card data)
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint brand_billing_profiles_pkey primary key (id),
  constraint brand_billing_profiles_brand_id_key unique (brand_id),
  constraint brand_billing_profiles_email_format check (
    billing_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

create index idx_brand_billing_profiles_brand_id on public.brand_billing_profiles(brand_id);
create index idx_brand_billing_profiles_provider_customer on public.brand_billing_profiles(provider_customer_id) where provider_customer_id is not null;

------------------------------------------------------------
-- Comments
------------------------------------------------------------

comment on table public.brands is 'Brand organisation. One owner (profiles), many members.';
comment on table public.brand_members is 'Team membership. role=owner is reserved to brands.owner_id.';
comment on table public.brand_invitations is 'Single-use brand invitations. Token stored hashed only.';
comment on table public.brand_billing_profiles is 'Billing profile. tax_id/provider_customer_id are restricted to authorised brand members.';
