-- Migration 0017: Financial extensions for payment & financial management
--
-- Adds:
--   * campaign budget spend tracking (budget_spent) with automated updates
--   * platform commission settings table
--   * creator payouts processed_by column
--   * platform_fees uniqueness per transaction
--   * Atomic payment recording RPC (single DB transaction; financial side-effects
--     (platform commission + campaign budget) are applied by a trigger in the same tx)
--   * Financial state trigger (fee computation + campaign budget tracking)

------------------------------------------------------------
-- 1. Campaign budget spend tracking
------------------------------------------------------------

alter table public.campaigns
  add column if not exists budget_spent numeric(14, 2) not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'campaigns_budget_spent_check'
  ) then
    alter table public.campaigns
      add constraint campaigns_budget_spent_check check (budget_spent >= 0);
  end if;
end $$;

comment on column public.campaigns.budget_spent is 'Actual spend to date, maintained server-side from successful payment transactions.';

------------------------------------------------------------
-- 2. Platform commission settings (single source of truth for the fee rate)
------------------------------------------------------------

create table if not exists public.platform_fee_settings (
  id uuid not null default gen_random_uuid(),
  rate numeric(5, 4) not null default 0.1000,     -- 0.1000 = 10% commission
  currency text not null default 'USD',
  effective_from timestamptz not null default timezone('utc'::text, now()),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint platform_fee_settings_pkey primary key (id),
  constraint platform_fees_rate_check check (rate >= 0 and rate <= 1)
);

insert into public.platform_fee_settings (rate, currency)
select 0.10, 'USD'
where not exists (select 1 from public.platform_fee_settings);

comment on table public.platform_fee_settings is 'Platform commission configuration. The most recent effective_from row wins. rate is the commission fraction (0 to 1).';

------------------------------------------------------------
-- 3. Platform fees: one row per payment transaction
------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'platform_fees_transaction_key'
  ) then
    alter table public.platform_fees
      add constraint platform_fees_transaction_key unique (payment_transaction_id);
  end if;
end $$;

------------------------------------------------------------
-- 4. Creator payouts: track who processed the payout
------------------------------------------------------------

alter table public.creator_payouts
  add column if not exists processed_by uuid references public.profiles(id) on delete set null;

comment on column public.creator_payouts.processed_by is 'Staff member who marked the payout as paid.';

------------------------------------------------------------
-- 5. Atomic payment recording RPC
--    Records a payment transaction in its own database transaction. The
--    trg_payment_financial_state trigger applies the platform commission
--    (platform_fees) and campaign budget spend (campaigns.budget_spent) as
--    part of the same database transaction.
--    Idempotency is enforced by the unique constraint on payment_transactions.idempotency_key.
------------------------------------------------------------

create or replace function public.fn_record_payment_transaction(
  p_collaboration_id uuid,
  p_invoice_id uuid,
  p_provider text,
  p_provider_payment_id text,
  p_idempotency_key text,
  p_amount numeric,
  p_currency text,
  p_status public.payment_status,
  p_metadata jsonb
)
returns public.payment_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_txn public.payment_transactions%row;
begin
  insert into public.payment_transactions (
    collaboration_id,
    invoice_id,
    provider,
    provider_payment_id,
    idempotency_key,
    amount,
    currency,
    status,
    metadata
  ) values (
    p_collaboration_id,
    p_invoice_id,
    p_provider,
    p_provider_payment_id,
    p_idempotency_key,
    p_amount,
    p_currency,
    p_status,
    coalesce(p_metadata, '{}'::jsonb)
  ) returning * into v_txn;

  return v_txn;
end;
$$;

comment on function public.fn_record_payment_transaction() is 'Atomically records a payment transaction; financial side-effects run in the same database transaction via the financial state trigger.';

grant execute on function public.fn_record_payment_transaction(uuid, uuid, text, text, text, numeric, text, public.payment_status, jsonb) to service_role;

------------------------------------------------------------
-- 6. Financial state trigger on payment_transactions
--    * On INSERT / status change to 'succeeded': computes platform commission
--      into platform_fees and adds the amount to the campaign budget spend.
--    * On status change to 'refunded': reverses the campaign budget spend.
------------------------------------------------------------
create or replace function public.trg_payment_financial_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rate numeric(5, 4);
  v_fee numeric(12, 2);
begin
  select rate into v_rate
    from public.platform_fee_settings
   order by effective_from desc
   limit 1;

  if TG_OP = 'INSERT' then
    if new.status = 'succeeded' then
      v_fee := round(new.amount * coalesce(v_rate, 0.10), 2);
      update public.payment_transactions
         set fee_amount = v_fee,
             creator_amount = round(new.amount - v_fee, 2)
       where id = new.id;
      insert into public.platform_fees (payment_transaction_id, amount, currency, rate)
      values (new.id, v_fee, new.currency, coalesce(v_rate, 0.10));
      if new.collaboration_id is not null then
        update public.campaigns c
           set budget_spent = c.budget_spent + new.amount
         where c.id = (select col.campaign_id from public.collaborations col where col.id = new.collaboration_id);
      end if;
    end if;
    return new;
  end if;

  if TG_OP = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'succeeded' then
      v_fee := round(new.amount * coalesce(v_rate, 0.10), 2);
      update public.payment_transactions
         set fee_amount = v_fee,
             creator_amount = round(new.amount - v_fee, 2)
       where id = new.id;
      insert into public.platform_fees (payment_transaction_id, amount, currency, rate)
      values (new.id, v_fee, new.currency, coalesce(v_rate, 0.10))
      on conflict (payment_transaction_id) do update
        set amount = excluded.amount,
            rate = excluded.rate;
      if new.collaboration_id is not null then
        update public.campaigns c
           set budget_spent = c.budget_spent + new.amount
         where c.id = (select col.campaign_id from public.collaborations col where col.id = new.collaboration_id);
      end if;
    end if;

    if new.status = 'refunded' and old.status <> 'refunded' then
      if new.collaboration_id is not null then
        update public.campaigns c
           set budget_spent = greatest(c.budget_spent - new.amount, 0)
         where c.id = (select col.campaign_id from public.collaborations col where col.id = new.collaboration_id);
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_payment_financial_state
after insert or update on public.payment_transactions
for each row
execute function public.trg_payment_financial_state();

comment on trigger public.trg_payment_financial_state() ON public.payment_transactions IS 'Maintains platform commission (platform_fees) and campaign budget spend (campaigns.budget_spent) from payment_transactions status transitions.';
