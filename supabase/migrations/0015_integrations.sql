-- Migration 0015: External integrations architecture
--
-- CALLBACX MARKETING — external service integrations (email, social OAuth,
-- payments, storage, webhooks).
--
-- Security model:
-- * No plaintext OAuth tokens, API keys or secrets are ever stored.
-- * Server-side credentials are encrypted with AES-256-GCM using the
--   INTEGRATION_VAULT_KEY environment variable (see src/lib/integrations/vault.ts).
-- * RLS restricts rows to the owning profile / staff; the service-role key
--   (webhooks, sync jobs) bypasses RLS and is never exposed to the browser.
-- * External API data is never fabricated: metrics are only written when an
--   authorised provider API returns them; missing credentials produce a clear
--   "not configured" error rather than synthetic data.

----------------------------------------------------------
-- Enum types
----------------------------------------------------------

create type public.integration_provider as enum (
  'resend',
  'stripe',
  'instagram',
  'tiktok',
  'youtube',
  'supabase_storage',
  'webhook'
);

create type public.integration_connection_status as enum (
  'pending',    -- OAuth flow started, not yet completed
  'connected',  -- valid access token stored
  'expired',    -- token expired and refresh failed / not attempted
  'revoked',    -- disconnected by user or provider
  'error',      -- last sync/auth attempt failed
  'disconnected' -- explicitly disconnected
);

----------------------------------------------------------
-- integration_settings
-- Platform-wide provider configuration (admin only).
-- `config` holds non-secret values (from email, webhook URL patterns, ...).
-- Secrets live in integration_credentials.
----------------------------------------------------------

create table public.integration_settings (
  id uuid not null default gen_random_uuid(),
  provider public.integration_provider not null,
  label text not null,
  description text,
  config jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default false,
  requires_approval boolean not null default false,
  approval_status text not null default 'pending', -- pending | approved | rejected
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint integration_settings_pkey primary key (id),
  constraint integration_settings_provider_key unique (provider),
  constraint integration_settings_approval_status_check check (
    approval_status in ('pending', 'approved', 'rejected')
  )
);

create index idx_integration_settings_provider on public.integration_settings(provider);
create index idx_integration_settings_approval on public.integration_settings(approval_status);

----------------------------------------------------------
-- integration_credentials
-- Encrypted server-side credential vault.
-- encrypted_value / iv / tag are base64-encoded AES-256-GCM outputs.
----------------------------------------------------------

create table public.integration_credentials (
  id uuid not null default gen_random_uuid(),
  provider public.integration_provider not null,
  credential_key text not null, -- e.g. 'api_key', 'client_secret', 'webhook_signing_secret'
  encrypted_value text not null,
  iv text not null,
  tag text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint integration_credentials_pkey primary key (id),
  constraint integration_credentials_provider_key_key unique (provider, credential_key)
);

create index idx_integration_credentials_provider on public.integration_credentials(provider);

----------------------------------------------------------
-- integration_oauth_states
-- Short-lived OAuth state + PKCE code verifier storage.
-- States expire after 10 minutes and are consumed exactly once.
----------------------------------------------------------

create table public.integration_oauth_states (
  id uuid not null default gen_random_uuid(),
  provider public.integration_provider not null,
  state text not null,
  code_verifier text,
  profile_id uuid references public.profiles(id) on delete cascade,
  redirect_to text,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint integration_oauth_states_pkey primary key (id),
  constraint integration_oauth_states_state_key unique (state)
);

create index idx_integration_oauth_states_state on public.integration_oauth_states(state);
create index idx_integration_oauth_states_expires on public.integration_oauth_states(expires_at);

----------------------------------------------------------
-- integration_connections
-- User-level provider connections (OAuth tokens, API keys).
-- Tokens are encrypted server-side before insert.
----------------------------------------------------------

create table public.integration_connections (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  provider public.integration_provider not null,
  platform text,                       -- instagram, tiktok, youtube (social providers)
  platform_account_id text,            -- platform-native account id
  platform_username text,
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  token_iv text not null,
  token_tag text not null,
  scope text,
  expires_at timestamptz,              -- access token expiry (when known)
  status public.integration_connection_status not null default 'pending',
  last_synced_at timestamptz,
  sync_error text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint integration_connections_pkey primary key (id),
  constraint integration_connections_unique unique (profile_id, provider, platform_account_id)
);

create index idx_integration_connections_profile on public.integration_connections(profile_id);
create index idx_integration_connections_provider on public.integration_connections(provider);
create index idx_integration_connections_status on public.integration_connections(status);

----------------------------------------------------------
-- integration_sync_logs
-- Append-only audit of sync / auth attempts (rate limits, failures, retries).
----------------------------------------------------------

create table public.integration_sync_logs (
  id uuid not null default gen_random_uuid(),
  connection_id uuid references public.integration_connections(id) on delete cascade,
  provider public.integration_provider not null,
  action text not null, -- connect | refresh | sync_analytics | send_email | webhook | ...
  status text not null, -- ok | rate_limited | failed | retrying
  records_synced integer,
  error_code text,
  error_message text,
  retry_after_seconds integer,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint integration_sync_logs_pkey primary key (id)
);

create index idx_integration_sync_logs_connection on public.integration_sync_logs(connection_id);
create index idx_integration_sync_logs_provider on public.integration_sync_logs(provider);
create index idx_integration_sync_logs_created_at on public.integration_sync_logs(created_at desc);

----------------------------------------------------------
-- integration_webhook_events
-- Idempotent ingestion of provider webhooks (Stripe, Resend, social, ...).
-- (provider, event_id) is unique so a webhook is processed exactly once.
----------------------------------------------------------

create table public.integration_webhook_events (
  id uuid not null default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint integration_webhook_events_pkey primary key (id),
  constraint integration_webhook_events_provider_event_key unique (provider, event_id)
);

create index idx_integration_webhook_events_provider on public.integration_webhook_events(provider);
create index idx_integration_webhook_events_processed on public.integration_webhook_events(processed) where processed = false;
create index idx_integration_webhook_events_provider_event on public.integration_webhook_events(provider, event_id);

----------------------------------------------------------
-- email_notifications
-- Audit log of transactional email notifications sent via Resend (or equivalent).
----------------------------------------------------------

create table public.email_notifications (
  id uuid not null default gen_random_uuid(),
  recipient_email text not null,
  recipient_profile_id uuid references public.profiles(id) on delete set null,
  template_id text,
  subject text,
  status text not null default 'pending', -- pending | sent | failed | bounced
  provider_message_id text,
  error_code text,
  error_message text,
  sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint email_notifications_pkey primary key (id)
);

create index idx_email_notifications_recipient on public.email_notifications(recipient_email);
create index idx_email_notifications_status on public.email_notifications(status);
create index idx_email_notifications_created_at on public.email_notifications(created_at desc);

----------------------------------------------------------
-- Link creator social accounts to integration connections
-- (manual accounts keep working; OAuth-connected accounts gain a link).
----------------------------------------------------------

alter table public.creator_social_accounts
  add column if not exists integration_connection_id uuid references public.integration_connections(id) on delete set null;

create index if not exists idx_creator_social_accounts_integration_connection
  on public.creator_social_accounts(integration_connection_id);

----------------------------------------------------------
-- Comments
----------------------------------------------------------

comment on type public.integration_provider is 'Supported external integration providers.';
comment on type public.integration_connection_status is 'Lifecycle state of a user-level provider connection.';
comment on table public.integration_settings is 'Platform-wide integration configuration (admin). Secrets are never stored here.';
comment on table public.integration_credentials is 'Encrypted credential vault (AES-256-GCM, server-side key).';
comment on table public.integration_connections is 'User-level OAuth / API connections. Tokens encrypted at rest.';
comment on table public.integration_sync_logs is 'Append-only audit of integration sync/auth attempts.';
comment on table public.integration_webhook_events is 'Idempotent webhook ingestion (dedupe by provider + event id).';
comment on table public.email_notifications is 'Transactional email send audit (Resend or equivalent).';

----------------------------------------------------------
-- Row Level Security
----------------------------------------------------------

alter table public.integration_settings enable row level security;
alter table public.integration_credentials enable row level security;
alter table public.integration_oauth_states enable row level security;
alter table public.integration_connections enable row level security;
alter table public.integration_sync_logs enable row level security;
alter table public.integration_webhook_events enable row level security;
alter table public.email_notifications enable row level security;

-- Settings: staff read/write only.
create policy integration_settings_staff_all on public.integration_settings
  for all to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- Credentials: staff read; service-role writes (bypass RLS). No public access.
create policy integration_credentials_staff_read on public.integration_credentials
  for select to authenticated
  using (public.is_staff(auth.uid()));

-- OAuth states: authenticated can insert; staff can read all; owner can delete own.
create policy integration_oauth_states_insert_own on public.integration_oauth_states
  for insert to authenticated
  with check (true);

create policy integration_oauth_states_select_staff on public.integration_oauth_states
  for select to authenticated
  using (public.is_staff(auth.uid()));

create policy integration_oauth_states_delete_own on public.integration_oauth_states
  for delete to authenticated
  using (auth.uid() = profile_id or profile_id is null);

-- Connections: owners manage their own; staff read all.
create policy integration_connections_own on public.integration_connections
  for all to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy integration_connections_staff_read on public.integration_connections
  for select to authenticated
  using (public.is_staff(auth.uid()));

-- Sync logs: owners read logs for their own connections; staff read all; insert service-role only.
create policy integration_sync_logs_own on public.integration_sync_logs
  for select to authenticated
  using (
    exists (
      select 1 from public.integration_connections c
      where c.id = integration_sync_logs.connection_id and c.profile_id = auth.uid()
    )
  );

create policy integration_sync_logs_staff_read on public.integration_sync_logs
  for select to authenticated
  using (public.is_staff(auth.uid()));

-- Webhook events: service-role only (no authenticated policy => no public access).
create policy integration_webhook_events_staff_read on public.integration_webhook_events
  for select to authenticated
  using (public.is_staff(auth.uid()));

-- Email notifications: recipients read their own; staff read all; insert service-role only.
create policy email_notifications_own on public.email_notifications
  for select to authenticated
  using (auth.uid() = recipient_profile_id);

create policy email_notifications_staff_read on public.email_notifications
  for select to authenticated
  using (public.is_staff(auth.uid()));

----------------------------------------------------------
-- Default admin settings rows (disabled until credentials configured)
----------------------------------------------------------

insert into public.integration_settings (provider, label, description, config, is_enabled, requires_approval, approval_status) values
  ('resend', 'Resend Email Delivery', 'Transactional and marketing email delivery via Resend.', '{"from_email": null}', false, false, 'pending')
  on conflict (provider) do nothing;

insert into public.integration_settings (provider, label, description, config, is_enabled, requires_approval, approval_status) values
  ('stripe', 'Stripe Payments', 'Stripe payment processing and payouts.', '{"platform_fee_percent": 0.10}', false, true, 'pending')
  on conflict (provider) do nothing;

insert into public.integration_settings (provider, label, description, config, is_enabled, requires_approval, approval_status) values
  ('instagram', 'Instagram (Meta) OAuth', 'Instagram Basic Display / Graph API account connections.', '{}', false, true, 'pending')
  on conflict (provider) do nothing;

insert into public.integration_settings (provider, label, description, config, is_enabled, requires_approval, approval_status) values
  ('tiktok', 'TikTok OAuth', 'TikTok Login Kit / Business API connections.', '{}', false, true, 'pending')
  on conflict (provider) do nothing;

insert into public.integration_settings (provider, label, description, config, is_enabled, requires_approval, approval_status) values
  ('youtube', 'YouTube (Google) OAuth', 'YouTube Data API v3 account connections.', '{}', false, true, 'pending')
  on conflict (provider) do nothing;

insert into public.integration_settings (provider, label, description, config, is_enabled, requires_approval, approval_status) values
  ('supabase_storage', 'Supabase Storage', 'Cloud file storage buckets for portfolios, campaigns and deliverables.', '{"bucket": "creator-portfolios"}', true, false, 'approved')
  on conflict (provider) do nothing;

insert into public.integration_settings (provider, label, description, config, is_enabled, requires_approval, approval_status) values
  ('webhook', 'Webhook Endpoints', 'Incoming webhook ingestion (Stripe, Resend, social platforms).', '{}', true, false, 'approved')
  on conflict (provider) do nothing;
