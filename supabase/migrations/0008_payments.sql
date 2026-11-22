-- Migration 0008: Payments and financial management
-- Abstract payment provider references (Stripe-ready). No card numbers, CVVs,
// or sensitive credentials stored. Idempotency keys on transactions and
-- provider event ids on webhook events prevent double processing.

------------------------------------------------------------
-- payment_transactions
------------------------------------------------------------

create table public.payment_transactions (
  id uuid not null default gen_random_uuid(),
  collaboration_id uuid references public.collaborations(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  provider text not null default 'manual',   -- abstract: stripe | manual | ...
  provider_payment_id text,                  -- provider's transaction reference
  idempotency_key text not null,             -- client-generated idempotency key
  amount numeric(12, 2) not null,
  currency text not null default 'USD',
  status public.payment_status not null default 'pending',
  fee_amount numeric(12, 2) not null default 0,     -- platform fee share
  creator_amount numeric(12, 2) not null default 0, -- net to creator
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint payment_transactions_pkey primary key (id),
  constraint payment_transactions_idempotency_key_key unique (idempotency_key),
  constraint payment_transactions_amount_check check (amount >= 0),
  constraint payment_transactions_fee_check check (fee_amount >= 0),
  constraint payment_transactions_creator_amount_check check (creator_amount >= 0),
  constraint payment_transactions_status_provider_ref check (
    status <> 'succeeded' or provider_payment_id is not null
  )
);

create index idx_payment_transactions_idempotency on public.payment_transactions(idempotency_key);
create index idx_payment_transactions_collaboration on public.payment_transactions(collaboration_id);
create index idx_payment_transactions_invoice on public.payment_transactions(invoice_id);
create index idx_payment_transactions_status on public.payment_transactions(status);
create index idx_payment_transactions_provider_payment on public.payment_transactions(provider, provider_payment_id) where provider_payment_id is not null;

------------------------------------------------------------
-- invoices
------------------------------------------------------------

create table public.invoices (
  id uuid not null default gen_random_uuid(),
  invoice_number text not null,
  collaboration_id uuid not null references public.collaborations(id) on delete restrict,
  brand_id uuid not null references public.brands(id) on delete restrict,
  creator_profile_id uuid not null references public.creator_profiles(id) on delete restrict,
  amount numeric(12, 2) not null,
  currency text not null default 'USD',
  status public.invoice_status not null default 'draft',
  due_date timestamptz,
  paid_at timestamptz,
  pdf_storage_path text,                     -- contracts bucket path (private)
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint invoices_pkey primary key (id),
  constraint invoices_invoice_number_key unique (invoice_number),
  constraint invoices_amount_check check (amount >= 0),
  constraint invoices_paid_status_check check (
    status <> 'paid' or paid_at is not null
  )
);

create index idx_invoices_invoice_number on public.invoices(invoice_number);
create index idx_invoices_brand on public.invoices(brand_id);
create index idx_invoices_creator on public.invoices(creator_profile_id);
create index idx_invoices_status on public.invoices(status);

------------------------------------------------------------
-- creator_payouts
------------------------------------------------------------

create table public.creator_payouts (
  id uuid not null default gen_random_uuid(),
  creator_profile_id uuid not null references public.creator_profiles(id) on delete restrict,
  payment_transaction_id uuid references public.payment_transactions(id) on delete set null,
  amount numeric(12, 2) not null,
  currency text not null default 'USD',
  status public.payout_status not null default 'pending',
  provider_payout_id text,                   -- abstract provider payout reference
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint creator_payouts_pkey primary key (id),
  constraint creator_payouts_amount_check check (amount >= 0)
);

create index idx_creator_payouts_creator on public.creator_payouts(creator_profile_id);
create index idx_creator_payouts_transaction on public.creator_payouts(payment_transaction_id);
create index idx_creator_payouts_status on public.creator_payouts(status);

------------------------------------------------------------
-- platform_fees
------------------------------------------------------------

create table public.platform_fees (
  id uuid not null default gen_random_uuid(),
  payment_transaction_id uuid not null references public.payment_transactions(id) on delete cascade,
  amount numeric(12, 2) not null,
  currency text not null default 'USD',
  rate numeric(5, 4) not null default 0,     -- commission rate applied (e.g. 0.1500 = 15%)
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint platform_fees_pkey primary key (id),
  constraint platform_fees_amount_check check (amount >= 0),
  constraint platform_fees_rate_check check (rate >= 0 and rate <= 1)
);

create index idx_platform_fees_transaction on public.platform_fees(payment_transaction_id);

------------------------------------------------------------
-- refunds
------------------------------------------------------------

create table public.refunds (
  id uuid not null default gen_random_uuid(),
  payment_transaction_id uuid not null references public.payment_transactions(id) on delete restrict,
  amount numeric(12, 2) not null,
  currency text not null default 'USD',
  reason text,
  status public.refund_status not null default 'pending',
  provider_refund_id text,                   -- abstract provider refund reference
  created_at timestamptz not null default timezone('utc'::text, now()),
  processed_at timestamptz,
  processed_by uuid references public.profiles(id),
  constraint refunds_pkey primary key (id),
  constraint refunds_amount_check check (amount > 0),
  constraint refunds_processed_status_check check (
    status <> 'processed' or processed_at is not null
  )
);

create index idx_refunds_transaction on public.refunds(payment_transaction_id);
create index idx_refunds_status on public.refunds(status);

------------------------------------------------------------
-- payment_webhook_events
------------------------------------------------------------

create table public.payment_webhook_events (
  id uuid not null default gen_random_uuid(),
  provider text not null,
  event_id text not null,                    -- provider's event id
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint payment_webhook_events_pkey primary key (id),
  constraint payment_webhook_events_provider_event_key unique (provider, event_id)
);

create index idx_payment_webhook_events_processed on public.payment_webhook_events(processed) where processed = false;
create index idx_payment_webhook_events_provider_event on public.payment_webhook_events(provider, event_id);

------------------------------------------------------------
-- Comments
------------------------------------------------------------

comment on table public.payment_transactions is 'Financial transactions. idempotency_key protects against double processing. succeeded status is only set server-side after provider confirmation.';
comment on table public.payment_webhook_events is 'Idempotent webhook ingestion. (provider, event_id) is unique so the same webhook is processed once.';
comment on table public.platform_fees is 'Platform commission per transaction. rate is the commission fraction (0 to 1).';
