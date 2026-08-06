-- PayPal marketplace seller onboarding.
-- Run after paypal_sandbox.sql.

create table if not exists public.seller_paypal_accounts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null unique references public.profiles(id) on delete cascade,
  paypal_merchant_id text unique,
  tracking_id text unique,
  partner_referral_id text,
  onboarding_status text not null default 'not_started'
    check (onboarding_status in ('not_started', 'pending', 'connected', 'revoked', 'error')),
  payments_receivable boolean not null default false,
  permissions_granted boolean not null default false,
  consent_status boolean not null default false,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seller_paypal_accounts_merchant_idx
  on public.seller_paypal_accounts(paypal_merchant_id);

drop trigger if exists seller_paypal_accounts_updated_at on public.seller_paypal_accounts;
create trigger seller_paypal_accounts_updated_at
  before update on public.seller_paypal_accounts
  for each row execute function public.set_updated_at();

alter table public.seller_paypal_accounts enable row level security;

drop policy if exists seller_paypal_accounts_own on public.seller_paypal_accounts;
create policy seller_paypal_accounts_own on public.seller_paypal_accounts
  for select using (seller_id = auth.uid() or public.is_admin());

drop policy if exists seller_paypal_accounts_admin on public.seller_paypal_accounts;
create policy seller_paypal_accounts_admin on public.seller_paypal_accounts
  for all using (public.is_admin()) with check (public.is_admin());
