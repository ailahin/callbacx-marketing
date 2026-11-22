-- Migration 0006: Applications and collaborations
-- Creator applications, brand invitations, negotiations, deliverables,
-- submissions, reviews, contracts, status history.

------------------------------------------------------------
-- campaign_applications
------------------------------------------------------------

create table public.campaign_applications (
  id uuid not null default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  cover_letter text,
  proposed_rate numeric(12, 2),
  currency text not null default 'USD',
  status public.application_status not null default 'pending',
  applied_at timestamptz not null default timezone('utc'::text, now()),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  rejection_reason text,
  constraint campaign_applications_pkey primary key (id),
  constraint campaign_applications_campaign_creator_key unique (campaign_id, creator_profile_id),
  constraint campaign_applications_proposed_rate_check check (proposed_rate is null or proposed_rate >= 0)
);

create index idx_campaign_applications_campaign on public.campaign_applications(campaign_id);
create index idx_campaign_applications_creator on public.campaign_applications(creator_profile_id);
create index idx_campaign_applications_status on public.campaign_applications(status);

------------------------------------------------------------
-- collaboration_invitations
------------------------------------------------------------

create table public.collaboration_invitations (
  id uuid not null default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  invited_by uuid not null references public.profiles(id),
  proposed_fee numeric(12, 2),
  currency text not null default 'USD',
  message text,
  token text not null,                       -- single-use invitation token
  token_hash text not null,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  responded_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint collaboration_invitations_pkey primary key (id),
  constraint collaboration_invitations_token_key unique (token),
  constraint collaboration_invitations_token_hash_key unique (token_hash),
  constraint collaboration_invitations_expires_future check (expires_at > created_at),
  constraint collaboration_invitations_fee_check check (proposed_fee is null or proposed_fee >= 0)
);

create index idx_collaboration_invitations_campaign on public.collaboration_invitations(campaign_id);
create index idx_collaboration_invitations_creator on public.collaboration_invitations(creator_profile_id);
create index idx_collaboration_invitations_token_hash on public.collaboration_invitations(token_hash);

------------------------------------------------------------
-- collaborations
------------------------------------------------------------

create table public.collaborations (
  id uuid not null default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete restrict,
  brand_id uuid not null references public.brands(id) on delete restrict,
  creator_profile_id uuid not null references public.creator_profiles(id) on delete restrict,
  status public.collaboration_status not null default 'negotiating',
  agreed_fee numeric(12, 2),
  currency text not null default 'USD',
  contract_id uuid,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  deleted_at timestamptz,
  constraint collaborations_pkey primary key (id),
  constraint collaborations_fee_check check (agreed_fee is null or agreed_fee >= 0),
  constraint collaborations_dates_check check (
    completed_at is null or started_at is null or completed_at >= started_at
  )
);

create index idx_collaborations_campaign on public.collaborations(campaign_id) where deleted_at is null;
create index idx_collaborations_brand on public.collaborations(brand_id) where deleted_at is null;
create index idx_collaborations_creator on public.collaborations(creator_profile_id) where deleted_at is null;
create index idx_collaborations_status on public.collaborations(status) where deleted_at is null;
create unique index uq_collaborations_contract on public.collaborations(contract_id) where contract_id is not null;

------------------------------------------------------------
-- collaboration_deliverables
------------------------------------------------------------

create table public.collaboration_deliverables (
  id uuid not null default gen_random_uuid(),
  collaboration_id uuid not null references public.collaborations(id) on delete cascade,
  campaign_deliverable_id uuid references public.campaign_deliverables(id) on delete set null,
  title text not null,
  description text,
  due_date timestamptz,
  status public.deliverable_status not null default 'pending',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint collaboration_deliverables_pkey primary key (id)
);

create index idx_collaboration_deliverables_collaboration on public.collaboration_deliverables(collaboration_id);
create index idx_collaboration_deliverables_status on public.collaboration_deliverables(status);

------------------------------------------------------------
-- deliverable_submissions
------------------------------------------------------------

create table public.deliverable_submissions (
  id uuid not null default gen_random_uuid(),
  collaboration_deliverable_id uuid not null references public.collaboration_deliverables(id) on delete cascade,
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  submission_url text,                       -- external link (e.g. published post)
  storage_path text,                         -- deliverable-submissions bucket path (private)
  media_kind public.media_kind,
  notes text,
  submitted_at timestamptz not null default timezone('utc'::text, now()),
  constraint deliverable_submissions_pkey primary key (id)
);

create index idx_deliverable_submissions_deliverable on public.deliverable_submissions(collaboration_deliverable_id);
create index idx_deliverable_submissions_creator on public.deliverable_submissions(creator_profile_id);

------------------------------------------------------------
-- deliverable_reviews
------------------------------------------------------------

create table public.deliverable_reviews (
  id uuid not null default gen_random_uuid(),
  deliverable_submission_id uuid not null references public.deliverable_submissions(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id), -- brand side reviewer
  rating integer,                            -- 1-5
  feedback text,
  status public.deliverable_status not null default 'pending',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint deliverable_reviews_pkey primary key (id),
  constraint deliverable_reviews_rating_check check (rating is null or (rating >= 1 and rating <= 5)),
  constraint deliverable_reviews_one_per_submission unique (deliverable_submission_id, reviewer_id)
);

create index idx_deliverable_reviews_submission on public.deliverable_reviews(deliverable_submission_id);

------------------------------------------------------------
-- collaboration_contracts
------------------------------------------------------------

create table public.collaboration_contracts (
  id uuid not null default gen_random_uuid(),
  collaboration_id uuid not null references public.collaborations(id) on delete cascade,
  storage_path text not null,                -- contracts bucket path (private)
  contract_type text not null default 'partnership',
  signed_at timestamptz,
  signed_by_brand boolean not null default false,
  signed_by_creator boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint collaboration_contracts_pkey primary key (id),
  constraint collaboration_contracts_collaboration_key unique (collaboration_id)
);

alter table public.collaborations
  add constraint collaborations_contract_fkey
  foreign key (contract_id) references public.collaboration_contracts(id) on delete set null;

------------------------------------------------------------
-- collaboration_status_history
------------------------------------------------------------

create table public.collaboration_status_history (
  id uuid not null default gen_random_uuid(),
  collaboration_id uuid not null references public.collaborations(id) on delete cascade,
  from_status public.collaboration_status,
  to_status public.collaboration_status not null,
  changed_by uuid not null references public.profiles(id),
  reason text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint collaboration_status_history_pkey primary key (id)
);

create index idx_collaboration_status_history_collaboration on public.collaboration_status_history(collaboration_id);

------------------------------------------------------------
-- Comments
------------------------------------------------------------

comment on table public.campaign_applications is 'One application per creator per campaign (unique constraint prevents duplicates).';
comment on table public.deliverable_reviews is 'Brand review of a creator submission. One review per submission per reviewer.';
comment on table public.collaboration_contracts is 'Private contract documents. One contract per collaboration.';
