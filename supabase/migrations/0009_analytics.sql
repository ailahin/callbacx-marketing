-- Migration 0009: Analytics and reporting
-- Historical snapshots are never overwritten: every row carries a source and
-- collection timestamp so statistics are traceable to their origin.

------------------------------------------------------------
-- campaign_analytics
------------------------------------------------------------

create table public.campaign_analytics (
  id uuid not null default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  metric_date date not null,                 -- UTC date the metrics describe
  impressions bigint not null default 0,
  reach bigint not null default 0,
  engagement bigint not null default 0,
  clicks bigint not null default 0,
  conversions bigint not null default 0,
  revenue numeric(12, 2) not null default 0,
  source text not null,                      -- platform_api | manual | estimated
  collected_at timestamptz not null default timezone('utc'::text, now()),
  constraint campaign_analytics_pkey primary key (id),
  constraint campaign_analytics_campaign_date_key unique (campaign_id, metric_date),
  constraint campaign_analytics_counts_nonnegative check (
    impressions >= 0 and reach >= 0 and engagement >= 0 and clicks >= 0 and conversions >= 0
  ),
  constraint campaign_analytics_revenue_nonnegative check (revenue >= 0)
);

create index idx_campaign_analytics_campaign_date on public.campaign_analytics(campaign_id, metric_date desc);
create index idx_campaign_analytics_collected_at on public.campaign_analytics(collected_at);

------------------------------------------------------------
-- creator_analytics
------------------------------------------------------------

create table public.creator_analytics (
  id uuid not null default gen_random_uuid(),
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  metric_date date not null,
  impressions bigint not null default 0,
  reach bigint not null default 0,
  engagement bigint not null default 0,
  clicks bigint not null default 0,
  conversions bigint not null default 0,
  revenue numeric(12, 2) not null default 0,
  source text not null,
  collected_at timestamptz not null default timezone('utc'::text, now()),
  constraint creator_analytics_pkey primary key (id),
  constraint creator_analytics_creator_date_key unique (creator_profile_id, metric_date),
  constraint creator_analytics_counts_nonnegative check (
    impressions >= 0 and reach >= 0 and engagement >= 0 and clicks >= 0 and conversions >= 0
  ),
  constraint creator_analytics_revenue_nonnegative check (revenue >= 0)
);

create index idx_creator_analytics_creator_date on public.creator_analytics(creator_profile_id, metric_date desc);

------------------------------------------------------------
-- social_metrics_snapshots
------------------------------------------------------------

create table public.social_metrics_snapshots (
  id uuid not null default gen_random_uuid(),
  creator_social_account_id uuid not null references public.creator_social_accounts(id) on delete cascade,
  followers_count bigint,
  engagement_rate numeric(5, 2),
  snapshotted_at timestamptz not null default timezone('utc'::text, now()),
  source text not null,                      -- platform_api | manual
  constraint social_metrics_snapshots_pkey primary key (id),
  constraint social_metrics_snapshots_followers_check check (followers_count is null or followers_count >= 0)
);

create index idx_social_metrics_snapshots_account on public.social_metrics_snapshots(creator_social_account_id, snapshotted_at desc);

------------------------------------------------------------
-- conversion_events
------------------------------------------------------------

create table public.conversion_events (
  id uuid not null default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  collaboration_id uuid references public.collaborations(id) on delete cascade,
  creator_profile_id uuid references public.creator_profiles(id) on delete cascade,
  event_type text not null,                  -- e.g. "click", "sign_up", "purchase", "install"
  value numeric(12, 2),
  currency text default 'USD',
  occurred_at timestamptz not null default timezone('utc'::text, now()),
  source text not null,                      -- where the event was observed
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint conversion_events_pkey primary key (id),
  constraint conversion_events_value_check check (value is null or value >= 0)
);

create index idx_conversion_events_campaign on public.conversion_events(campaign_id, occurred_at desc);
create index idx_conversion_events_collaboration on public.conversion_events(collaboration_id);
create index idx_conversion_events_type on public.conversion_events(event_type, occurred_at desc);

------------------------------------------------------------
-- platform_analytics
------------------------------------------------------------

create table public.platform_analytics (
  id uuid not null default gen_random_uuid(),
  metric_date date not null,
  metric_name text not null,
  metric_value numeric not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint platform_analytics_pkey primary key (id),
  constraint platform_analytics_date_name_key unique (metric_date, metric_name)
);

create index idx_platform_analytics_date on public.platform_analytics(metric_date desc);

------------------------------------------------------------
-- Comments
------------------------------------------------------------

comment on table public.campaign_analytics is 'Daily campaign metrics snapshots. One row per campaign per UTC date; historical rows are never overwritten.';
comment on table public.social_metrics_snapshots is 'Append-only snapshots of connected social account metrics (followers, engagement).';
comment on table public.platform_analytics is 'Roll-up platform-wide metrics (revenue, active campaigns, signups, ...).';
