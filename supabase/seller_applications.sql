-- Ejecutar despues de schema.sql para habilitar el flujo de conversion a vendedor.
create table if not exists public.seller_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  curp text not null,
  rfc text,
  phone text not null,
  birth_date date,
  id_type text not null default 'INE',
  id_number text,
  address text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'México',
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists seller_applications_pending_user_idx
  on public.seller_applications(user_id) where status = 'pending';
create index if not exists seller_applications_status_idx on public.seller_applications(status);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists account_deletion_requests_pending_user_idx
  on public.account_deletion_requests(user_id) where status = 'pending';
create index if not exists account_deletion_requests_status_idx on public.account_deletion_requests(status);

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'info',
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.seller_applications enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.admin_logs enable row level security;
alter table public.notifications enable row level security;

drop policy if exists seller_applications_own_read on public.seller_applications;
create policy seller_applications_own_read on public.seller_applications for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists seller_applications_own_insert on public.seller_applications;
create policy seller_applications_own_insert on public.seller_applications for insert with check (user_id = auth.uid());
drop policy if exists seller_applications_admin_update on public.seller_applications;
create policy seller_applications_admin_update on public.seller_applications for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists account_deletion_requests_own_read on public.account_deletion_requests;
create policy account_deletion_requests_own_read on public.account_deletion_requests for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists account_deletion_requests_own_insert on public.account_deletion_requests;
create policy account_deletion_requests_own_insert on public.account_deletion_requests for insert with check (user_id = auth.uid());
drop policy if exists account_deletion_requests_admin_update on public.account_deletion_requests;
create policy account_deletion_requests_admin_update on public.account_deletion_requests for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_logs_admin_read on public.admin_logs;
create policy admin_logs_admin_read on public.admin_logs for select using (public.is_admin());
drop policy if exists notifications_own_all on public.notifications;
create policy notifications_own_all on public.notifications for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
