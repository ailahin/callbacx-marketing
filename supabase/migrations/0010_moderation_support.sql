-- Migration 0010: Reputation, moderation and support

------------------------------------------------------------
-- reviews (brand <-> creator reviews after a collaboration)
------------------------------------------------------------

create table public.reviews (
  id uuid not null default gen_random_uuid(),
  collaboration_id uuid not null references public.collaborations(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  reviewee_id uuid not null references public.profiles(id),
  rating integer not null,
  title text,
  body text,
  is_public boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint reviews_pkey primary key (id),
  constraint reviews_rating_check check (rating >= 1 and rating <= 5),
  constraint reviews_one_per_collaboration_reviewer unique (collaboration_id, reviewer_id),
  constraint reviews_not_self check (reviewer_id <> reviewee_id)
);

create index idx_reviews_collaboration on public.reviews(collaboration_id);
create index idx_reviews_reviewee on public.reviews(reviewee_id) where is_public = true;
create index idx_reviews_rating on public.reviews(rating);

------------------------------------------------------------
-- review_responses
------------------------------------------------------------

create table public.review_responses (
  id uuid not null default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  responder_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint review_responses_pkey primary key (id),
  constraint review_responses_one_per_review unique (review_id, responder_id)
);

create index idx_review_responses_review on public.review_responses(review_id);

------------------------------------------------------------
-- disputes
------------------------------------------------------------

create table public.disputes (
  id uuid not null default gen_random_uuid(),
  collaboration_id uuid not null references public.collaborations(id) on delete cascade,
  opened_by uuid not null references public.profiles(id),
  status public.dispute_status not null default 'open',
  reason text not null,
  resolution text,
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint disputes_pkey primary key (id)
);

create unique index disputes_one_open_per_collaboration
  on public.disputes (collaboration_id)
  where status = 'open';

create index idx_disputes_collaboration on public.disputes(collaboration_id);
create index idx_disputes_status on public.disputes(status);

------------------------------------------------------------
-- support_tickets
------------------------------------------------------------

create table public.support_tickets (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  status public.ticket_status not null default 'open',
  priority public.ticket_priority not null default 'medium',
  assigned_to uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint support_tickets_pkey primary key (id)
);

create index idx_support_tickets_profile on public.support_tickets(profile_id);
create index idx_support_tickets_status on public.support_tickets(status);
create index idx_support_tickets_assigned on public.support_tickets(assigned_to) where assigned_to is not null;

------------------------------------------------------------
-- support_ticket_messages
------------------------------------------------------------

create table public.support_ticket_messages (
  id uuid not null default gen_random_uuid(),
  support_ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null,
  is_internal boolean not null default false,  -- staff-only note
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint support_ticket_messages_pkey primary key (id)
);

create index idx_support_ticket_messages_ticket on public.support_ticket_messages(support_ticket_id, created_at);

------------------------------------------------------------
-- moderation_reports (user-reported content/users)
------------------------------------------------------------

create table public.moderation_reports (
  id uuid not null default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  reported_profile_id uuid references public.profiles(id),
  reported_resource_type text,               -- campaign | collaboration | review | message | profile
  reported_resource_id uuid,
  reason text not null,
  status public.report_status not null default 'pending',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint moderation_reports_pkey primary key (id)
);

create index idx_moderation_reports_status on public.moderation_reports(status);
create index idx_moderation_reports_reported on public.moderation_reports(reported_profile_id);

------------------------------------------------------------
-- moderation_actions
------------------------------------------------------------

create table public.moderation_actions (
  id uuid not null default gen_random_uuid(),
  moderation_report_id uuid references public.moderation_reports(id) on delete set null,
  admin_id uuid not null references public.profiles(id),
  action_type text not null,                 -- warn | suspend | ban | content_remove | ...
  target_type text not null,
  target_id uuid not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint moderation_actions_pkey primary key (id)
);

create index idx_moderation_actions_admin on public.moderation_actions(admin_id);
create index idx_moderation_actions_target on public.moderation_actions(target_type, target_id);

------------------------------------------------------------
-- Comments
------------------------------------------------------------

comment on table public.reviews is 'Reviews are tied to a completed collaboration. One review per reviewer per collaboration; rating manipulation prevented by RLS + unique constraint.';
comment on table public.disputes is 'One open dispute per collaboration at a time (partial unique index).';
comment on table public.moderation_actions is 'Audit trail of moderator actions. Linked to reports where applicable.';
