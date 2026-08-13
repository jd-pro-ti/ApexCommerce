-- PayPal Sandbox / marketplace checkout migration.
-- Run this script in Supabase SQL Editor after schema.sql.

alter table public.products
  add column if not exists reserved_stock integer not null default 0
    check (reserved_stock >= 0);

alter table public.orders
  add column if not exists paypal_order_id text,
  add column if not exists paypal_capture_id text,
  add column if not exists payment_created_at timestamptz,
  add column if not exists reservation_expires_at timestamptz,
  add column if not exists platform_fee_total numeric(12,2) not null default 0,
  add column if not exists seller_payout_total numeric(12,2) not null default 0,
  add column if not exists paypal_seller_breakdown jsonb not null default '[]'::jsonb,
  add column if not exists payout_status text not null default 'pending',
  add column if not exists payouts_released_at timestamptz;

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status in ('pending', 'paid', 'failed', 'refunded'));

alter table public.orders drop constraint if exists orders_payout_status_check;
alter table public.orders add constraint orders_payout_status_check
  check (payout_status in ('pending', 'held', 'released', 'failed', 'refunded'));

create table if not exists public.simulated_refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  amount numeric(12,2) not null check (amount >= 0),
  platform_fee_amount numeric(12,2) not null default 0 check (platform_fee_amount >= 0),
  seller_amount numeric(12,2) not null default 0 check (seller_amount >= 0),
  currency_code text not null default 'MXN',
  status text not null default 'requested'
    check (status in ('requested', 'processing', 'completed', 'cancelled')),
  reason text not null default 'Cancelación solicitada por el cliente',
  estimated_from date not null default current_date + 5,
  estimated_until date not null default current_date + 10,
  paypal_refund_ids jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists simulated_refunds_user_idx on public.simulated_refunds(user_id, created_at desc);
drop trigger if exists simulated_refunds_updated_at on public.simulated_refunds;
create trigger simulated_refunds_updated_at before update on public.simulated_refunds
  for each row execute function public.set_updated_at();
alter table public.simulated_refunds enable row level security;
drop policy if exists simulated_refunds_read_own on public.simulated_refunds;
create policy simulated_refunds_read_own on public.simulated_refunds
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists simulated_refunds_admin on public.simulated_refunds;
create policy simulated_refunds_admin on public.simulated_refunds
  for all using (public.is_admin()) with check (public.is_admin());

create unique index if not exists orders_paypal_order_id_idx
  on public.orders(paypal_order_id)
  where paypal_order_id is not null;

create table if not exists public.seller_paypal_payouts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete restrict,
  paypal_order_id text not null,
  paypal_capture_id text,
  gross_amount numeric(12,2) not null check (gross_amount >= 0),
  platform_fee_amount numeric(12,2) not null check (platform_fee_amount >= 0),
  seller_amount numeric(12,2) not null check (seller_amount >= 0),
  currency_code text not null default 'MXN',
  status text not null default 'pending'
    check (status in ('pending', 'held', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, seller_id)
);

alter table public.seller_paypal_payouts
  drop constraint if exists seller_paypal_payouts_status_check;
alter table public.seller_paypal_payouts
  add constraint seller_paypal_payouts_status_check
  check (status in ('pending', 'held', 'paid', 'failed', 'refunded'));

create index if not exists seller_paypal_payouts_seller_idx
  on public.seller_paypal_payouts(seller_id, created_at desc);

create index if not exists seller_paypal_payouts_paypal_order_idx
  on public.seller_paypal_payouts(paypal_order_id);

drop trigger if exists seller_paypal_payouts_updated_at on public.seller_paypal_payouts;
create trigger seller_paypal_payouts_updated_at
  before update on public.seller_paypal_payouts
  for each row execute function public.set_updated_at();

alter table public.seller_paypal_payouts enable row level security;

drop policy if exists seller_paypal_payouts_own on public.seller_paypal_payouts;
create policy seller_paypal_payouts_own on public.seller_paypal_payouts
  for select using (seller_id = auth.uid() or public.is_admin());

drop policy if exists seller_paypal_payouts_admin on public.seller_paypal_payouts;
create policy seller_paypal_payouts_admin on public.seller_paypal_payouts
  for all using (public.is_admin()) with check (public.is_admin());

-- Creates the local order and reserves stock, but does not charge the buyer.
create or replace function public.create_pending_order(
  p_user_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address text,
  p_shipping_address_line2 text,
  p_shipping_city text,
  p_shipping_state text,
  p_shipping_postal_code text,
  p_shipping_country text,
  p_shipping_reference text,
  p_cart_items jsonb,
  p_notes text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_product public.products%rowtype;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2);
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'No autorizado';
  end if;
  if jsonb_typeof(p_cart_items) <> 'array' or jsonb_array_length(p_cart_items) = 0 then
    raise exception 'El carrito está vacío';
  end if;

  insert into public.orders(
    order_number, user_id, customer_name, customer_email, customer_phone,
    shipping_address, shipping_address_line2, shipping_city, shipping_state,
    shipping_postal_code, shipping_country, shipping_reference, notes,
    status, payment_status, payment_method, payment_created_at,
    reservation_expires_at
  ) values (
    'ORD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
    p_user_id, p_customer_name, p_customer_email, p_customer_phone,
    p_shipping_address, nullif(p_shipping_address_line2, ''), p_shipping_city,
    p_shipping_state, p_shipping_postal_code,
    coalesce(nullif(p_shipping_country, ''), 'México'),
    nullif(p_shipping_reference, ''), nullif(p_notes, ''),
    'pending', 'pending', 'paypal', now(), now() + interval '30 minutes'
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_cart_items) loop
    v_product_id := (v_item->>'id')::uuid;
    v_quantity := greatest(1, coalesce((v_item->>'quantity')::integer, 1));

    select * into v_product
      from public.products
      where id = v_product_id and status = 'active'
      for update;

    if not found then
      raise exception 'Producto no disponible: %', v_product_id;
    end if;
    if v_product.stock - v_product.reserved_stock < v_quantity then
      raise exception 'Stock insuficiente para: %', v_product.name;
    end if;

    insert into public.order_items(
      order_id, product_id, seller_id, product_name, product_price, quantity, subtotal
    ) values (
      v_order_id, v_product.id, v_product.seller_id, v_product.name,
      v_product.price, v_quantity, round(v_product.price * v_quantity, 2)
    );

    update public.products
      set reserved_stock = reserved_stock + v_quantity
      where id = v_product.id;
    v_subtotal := v_subtotal + round(v_product.price * v_quantity, 2);
  end loop;

  v_shipping := case when v_subtotal > 150 then 0 else 19.99 end;
  update public.orders
    set subtotal = v_subtotal,
        shipping_cost = v_shipping,
        tax = 0,
        total = v_subtotal + v_shipping,
        status = 'pending'
    where id = v_order_id;
  return v_order_id;
exception when others then
  if v_order_id is not null then
    delete from public.orders where id = v_order_id;
  end if;
  raise;
end;
$$;

-- Finalizes a paid order exactly once and converts the reservation into a sale.
create or replace function public.complete_paid_order(
  p_user_id uuid,
  p_order_id uuid,
  p_paypal_order_id text,
  p_paypal_capture_id text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_product public.products%rowtype;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'No autorizado';
  end if;

  select * into v_order from public.orders
    where id = p_order_id and user_id = p_user_id for update;
  if not found then raise exception 'Pedido no encontrado'; end if;
  if v_order.payment_status = 'paid' then return v_order.id; end if;
  if v_order.payment_status <> 'pending' then
    raise exception 'El pedido no está pendiente de pago';
  end if;

  for v_item in select * from public.order_items where order_id = v_order.id order by product_id loop
    select * into v_product from public.products where id = v_item.product_id for update;
    if not found or v_product.reserved_stock < v_item.quantity or v_product.stock < v_item.quantity then
      raise exception 'El stock cambió para: %', v_item.product_name;
    end if;
    update public.products
      set stock = stock - v_item.quantity,
          reserved_stock = reserved_stock - v_item.quantity
      where id = v_item.product_id;
  end loop;

  update public.orders set
    status = 'processing',
    payment_status = 'paid',
    payment_method = 'paypal_sandbox',
    paypal_order_id = p_paypal_order_id,
    paypal_capture_id = p_paypal_capture_id,
    reservation_expires_at = null
    where id = v_order.id;
  delete from public.cart_items where user_id = p_user_id;
  return v_order.id;
end;
$$;

create or replace function public.release_order_reservation(
  p_user_id uuid,
  p_order_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_order public.orders%rowtype; v_item record;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'No autorizado'; end if;
  select * into v_order from public.orders where id = p_order_id and user_id = p_user_id for update;
  if not found then raise exception 'Pedido no encontrado'; end if;
  if v_order.payment_status = 'pending' then
    for v_item in select * from public.order_items where order_id = v_order.id loop
      update public.products set reserved_stock = greatest(0, reserved_stock - v_item.quantity)
        where id = v_item.product_id;
    end loop;
    update public.orders set reservation_expires_at = null, status = 'cancelled' where id = v_order.id;
  end if;
  return v_order.id;
end;
$$;

grant execute on function public.create_pending_order(uuid,text,text,text,text,text,text,text,text,text,text,jsonb,text) to authenticated;
grant execute on function public.complete_paid_order(uuid,uuid,text,text) to authenticated;
grant execute on function public.release_order_reservation(uuid,uuid) to authenticated;

-- Permite que el vendedor marque una partida como entregada.
-- Se incluye aquí porque esta migración también se usa sobre bases ya existentes.
create or replace function public.update_order_item_status(p_item_id uuid, p_status text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  if p_status not in ('processing', 'shipped', 'delivered', 'cancelled') then
    raise exception 'Estado no permitido';
  end if;

  update public.order_items
    set status = p_status
    where id = p_item_id
      and (seller_id = auth.uid() or public.is_admin())
    returning order_id into v_order_id;

  if v_order_id is null then
    raise exception 'No autorizado o artículo inexistente';
  end if;
  return v_order_id;
end;
$$;

grant execute on function public.update_order_item_status(uuid,text) to authenticated;

-- Checkout temporal: reserva stock sin crear todavía un pedido visible.
create table if not exists public.paypal_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  cart_items jsonb not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address text not null,
  shipping_address_line2 text,
  shipping_city text not null,
  shipping_state text not null,
  shipping_postal_code text not null,
  shipping_country text not null default 'México',
  shipping_reference text,
  notes text,
  subtotal numeric(12,2) not null default 0,
  shipping_cost numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  paypal_order_id text unique,
  paypal_seller_breakdown jsonb not null default '[]'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'cancelled', 'expired')),
  completed_order_id uuid references public.orders(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists paypal_checkout_sessions_user_idx
  on public.paypal_checkout_sessions(user_id, created_at desc);
alter table public.paypal_checkout_sessions enable row level security;
drop policy if exists paypal_checkout_sessions_own on public.paypal_checkout_sessions;
create policy paypal_checkout_sessions_own on public.paypal_checkout_sessions
  for select using (user_id = auth.uid() or public.is_admin());
drop trigger if exists paypal_checkout_sessions_updated_at on public.paypal_checkout_sessions;
create trigger paypal_checkout_sessions_updated_at
  before update on public.paypal_checkout_sessions
  for each row execute function public.set_updated_at();

create or replace function public.cleanup_expired_paypal_reservations()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_session record;
  v_order record;
  v_item record;
begin
  for v_session in select * from public.paypal_checkout_sessions
    where status = 'pending' and expires_at <= now() for update loop
    for v_item in select value from jsonb_array_elements(v_session.cart_items) loop
      update public.products set reserved_stock = greatest(0, coalesce(reserved_stock, 0) - greatest(1, coalesce((v_item.value->>'quantity')::integer, 1)))
        where id = (v_item.value->>'id')::uuid;
    end loop;
    update public.paypal_checkout_sessions set status = 'expired' where id = v_session.id;
  end loop;

  for v_order in select id from public.orders
    where payment_status = 'pending' and reservation_expires_at is not null and reservation_expires_at <= now() for update loop
    for v_item in select product_id, quantity from public.order_items where order_id = v_order.id loop
      update public.products set reserved_stock = greatest(0, coalesce(reserved_stock, 0) - v_item.quantity)
        where id = v_item.product_id;
    end loop;
    update public.orders set status = 'cancelled', reservation_expires_at = null where id = v_order.id;
  end loop;
end;
$$;

create or replace function public.create_paypal_checkout_session(
  p_user_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address text,
  p_shipping_address_line2 text,
  p_shipping_city text,
  p_shipping_state text,
  p_shipping_postal_code text,
  p_shipping_country text,
  p_shipping_reference text,
  p_cart_items jsonb,
  p_notes text default ''
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_session_id uuid;
  v_product public.products%rowtype;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2);
begin
  if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'No autorizado'; end if;
  if jsonb_typeof(p_cart_items) <> 'array' or jsonb_array_length(p_cart_items) = 0 then raise exception 'El carrito está vacío'; end if;
  perform public.cleanup_expired_paypal_reservations();

  select id into v_session_id
    from public.paypal_checkout_sessions
    where user_id = p_user_id and status = 'pending' and expires_at > now()
      and cart_items = p_cart_items
    order by created_at desc limit 1;
  if v_session_id is not null then
    update public.paypal_checkout_sessions
      set shipping_cost = 0, total = subtotal, expires_at = now() + interval '30 minutes'
      where id = v_session_id;
    return v_session_id;
  end if;

  insert into public.paypal_checkout_sessions(
    user_id, cart_items, customer_name, customer_email, customer_phone,
    shipping_address, shipping_address_line2, shipping_city, shipping_state,
    shipping_postal_code, shipping_country, shipping_reference, notes
  ) values (
    p_user_id, p_cart_items, p_customer_name, p_customer_email, p_customer_phone,
    p_shipping_address, nullif(p_shipping_address_line2, ''), p_shipping_city,
    p_shipping_state, p_shipping_postal_code, coalesce(nullif(p_shipping_country, ''), 'México'),
    nullif(p_shipping_reference, ''), nullif(p_notes, '')
  ) returning id into v_session_id;

  for v_item in select value from jsonb_array_elements(p_cart_items) loop
    v_product_id := (v_item->>'id')::uuid;
    v_quantity := greatest(1, coalesce((v_item->>'quantity')::integer, 1));
    select * into v_product from public.products
      where id = v_product_id and status = 'active' for update;
    if not found then raise exception 'Producto no disponible: %', v_product_id; end if;
    if v_product.stock - coalesce(v_product.reserved_stock, 0) < v_quantity then
      raise exception 'Stock insuficiente para: %', v_product.name;
    end if;
    update public.products set reserved_stock = coalesce(reserved_stock, 0) + v_quantity where id = v_product.id;
    v_subtotal := v_subtotal + round(v_product.price * v_quantity, 2);
  end loop;

  -- El envío queda temporalmente en cero para las pruebas de comisión.
  v_shipping := 0;
  update public.paypal_checkout_sessions set
    subtotal = v_subtotal, shipping_cost = v_shipping, total = v_subtotal + v_shipping,
    expires_at = now() + interval '30 minutes'
    where id = v_session_id;
  return v_session_id;
exception when others then
  if v_session_id is not null then delete from public.paypal_checkout_sessions where id = v_session_id; end if;
  raise;
end;
$$;

create or replace function public.complete_paypal_checkout(
  p_user_id uuid,
  p_session_id uuid,
  p_paypal_order_id text,
  p_paypal_capture_id text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_session public.paypal_checkout_sessions%rowtype;
  v_order_id uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_product_id uuid;
  v_quantity integer;
  v_breakdown jsonb;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'No autorizado'; end if;
  select * into v_session from public.paypal_checkout_sessions
    where id = p_session_id and user_id = p_user_id for update;
  if not found then raise exception 'Sesión de checkout no encontrada'; end if;
  if v_session.completed_order_id is not null then return v_session.completed_order_id; end if;
  if v_session.status <> 'pending' then raise exception 'La sesión de checkout ya no está pendiente'; end if;

  insert into public.orders(
    order_number, user_id, customer_name, customer_email, customer_phone,
    shipping_address, shipping_address_line2, shipping_city, shipping_state,
    shipping_postal_code, shipping_country, shipping_reference, notes,
    status, payment_status, payment_method, subtotal, shipping_cost, tax, total,
    paypal_order_id, paypal_capture_id, payment_created_at, reservation_expires_at,
    platform_fee_total, seller_payout_total, paypal_seller_breakdown, payout_status
  ) values (
    'ORD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
    p_user_id, v_session.customer_name, v_session.customer_email, v_session.customer_phone,
    v_session.shipping_address, v_session.shipping_address_line2, v_session.shipping_city,
    v_session.shipping_state, v_session.shipping_postal_code, v_session.shipping_country,
    v_session.shipping_reference, v_session.notes, 'processing', 'paid', 'paypal_sandbox',
    v_session.subtotal, v_session.shipping_cost, 0, v_session.total,
    p_paypal_order_id, p_paypal_capture_id, now(), null,
    coalesce((select sum((value->>'platform_fee_amount')::numeric) from jsonb_array_elements(v_session.paypal_seller_breakdown)), 0),
    coalesce((select sum((value->>'seller_amount')::numeric) from jsonb_array_elements(v_session.paypal_seller_breakdown)), 0),
    v_session.paypal_seller_breakdown, 'held'
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(v_session.cart_items) loop
    v_product_id := (v_item->>'id')::uuid;
    v_quantity := greatest(1, coalesce((v_item->>'quantity')::integer, 1));
    select * into v_product from public.products where id = v_product_id for update;
    if not found or coalesce(v_product.reserved_stock, 0) < v_quantity or v_product.stock < v_quantity then
      raise exception 'El stock cambió para: %', v_product_id;
    end if;
    insert into public.order_items(order_id, product_id, seller_id, product_name, product_price, quantity, subtotal)
      values (v_order_id, v_product.id, v_product.seller_id, v_product.name, v_product.price, v_quantity, round(v_product.price * v_quantity, 2));
    update public.products set stock = stock - v_quantity, reserved_stock = reserved_stock - v_quantity where id = v_product.id;
  end loop;

  for v_breakdown in select value from jsonb_array_elements(v_session.paypal_seller_breakdown) loop
    insert into public.seller_paypal_payouts(
      order_id, seller_id, paypal_order_id, gross_amount, platform_fee_amount, seller_amount, currency_code, status
    ) values (
      v_order_id, (v_breakdown->>'seller_id')::uuid, p_paypal_order_id,
      (v_breakdown->>'gross_amount')::numeric, (v_breakdown->>'platform_fee_amount')::numeric,
      (v_breakdown->>'seller_amount')::numeric, 'MXN', 'held'
    );
  end loop;

  update public.paypal_checkout_sessions set status = 'completed', completed_order_id = v_order_id,
    paypal_order_id = p_paypal_order_id where id = p_session_id;
  delete from public.cart_items where user_id = p_user_id;
  return v_order_id;
end;
$$;

grant execute on function public.create_paypal_checkout_session(uuid,text,text,text,text,text,text,text,text,text,text,jsonb,text) to authenticated;
grant execute on function public.complete_paypal_checkout(uuid,uuid,text,text) to authenticated;

create or replace function public.cancel_paypal_checkout_session(p_user_id uuid, p_session_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_session public.paypal_checkout_sessions%rowtype;
  v_item jsonb;
  v_quantity integer;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'No autorizado'; end if;
  select * into v_session from public.paypal_checkout_sessions
    where id = p_session_id and user_id = p_user_id for update;
  if not found then return p_session_id; end if;
  if v_session.status = 'pending' then
    for v_item in select value from jsonb_array_elements(v_session.cart_items) loop
      v_quantity := greatest(1, coalesce((v_item->>'quantity')::integer, 1));
      update public.products set reserved_stock = greatest(0, coalesce(reserved_stock, 0) - v_quantity)
        where id = (v_item->>'id')::uuid;
    end loop;
    update public.paypal_checkout_sessions set status = 'cancelled' where id = p_session_id;
  end if;
  return p_session_id;
end;
$$;

grant execute on function public.cancel_paypal_checkout_session(uuid,uuid) to authenticated;

create or replace function public.confirm_order_delivery(p_user_id uuid, p_order_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders%rowtype;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'No autorizado'; end if;
  select * into v_order from public.orders where id = p_order_id and user_id = p_user_id for update;
  if not found then raise exception 'Pedido no encontrado'; end if;
  if v_order.payment_status <> 'paid' then raise exception 'El pedido todavía no está pagado'; end if;

  update public.order_items set status = 'delivered'
    where order_id = p_order_id and status <> 'cancelled';
  update public.orders set status = 'delivered' where id = p_order_id;
  return p_order_id;
end;
$$;

grant execute on function public.confirm_order_delivery(uuid,uuid) to authenticated;

-- Cancela un pedido y registra un reembolso simulado. No llama a PayPal:
-- el dinero de prueba no se devuelve realmente al comprador.
create or replace function public.cancel_paid_order_simulated_refund(p_user_id uuid, p_order_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_refund_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'No autorizado'; end if;
  select * into v_order from public.orders where id = p_order_id and user_id = p_user_id for update;
  if not found then raise exception 'Pedido no encontrado'; end if;
  if v_order.status = 'cancelled' then
    select id into v_refund_id from public.simulated_refunds where order_id = p_order_id;
    return v_refund_id;
  end if;
  if exists (select 1 from public.order_items where order_id = p_order_id and status in ('shipped', 'delivered', 'cancelled')) then
    raise exception 'Este pedido ya no se puede cancelar';
  end if;

  for v_item in select product_id, quantity from public.order_items where order_id = p_order_id loop
    if v_order.payment_status = 'paid' then
      update public.products set stock = stock + v_item.quantity where id = v_item.product_id;
    else
      update public.products set reserved_stock = greatest(0, reserved_stock - v_item.quantity) where id = v_item.product_id;
    end if;
  end loop;
  update public.order_items set status = 'cancelled' where order_id = p_order_id;

  if v_order.payment_status = 'paid' then
    insert into public.simulated_refunds(order_id, user_id, amount, platform_fee_amount, seller_amount)
      values (v_order.id, v_order.user_id, v_order.total, v_order.platform_fee_total, v_order.seller_payout_total)
      on conflict (order_id) do update set updated_at = now()
      returning id into v_refund_id;
    update public.orders set status = 'cancelled', payment_status = 'refunded', payout_status = 'refunded'
      where id = p_order_id;
    update public.seller_paypal_payouts set status = 'refunded' where order_id = p_order_id and status <> 'refunded';
  else
    update public.orders set status = 'cancelled' where id = p_order_id;
  end if;
  return v_refund_id;
end;
$$;

grant execute on function public.cancel_paid_order_simulated_refund(uuid,uuid) to authenticated;

create or replace function public.finalize_paid_order_real_refund(p_user_id uuid, p_order_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_refund_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'No autorizado'; end if;
  select * into v_order from public.orders where id = p_order_id and user_id = p_user_id for update;
  if not found then raise exception 'Pedido no encontrado'; end if;
  select id into v_refund_id from public.simulated_refunds where order_id = p_order_id for update;
  if v_refund_id is null then raise exception 'Solicitud de reembolso no encontrada'; end if;
  if v_order.payment_status = 'refunded' then return v_refund_id; end if;
  if v_order.payment_status <> 'paid' then raise exception 'El pedido no tiene un pago reembolsable'; end if;
  if exists (select 1 from public.order_items where order_id = p_order_id and status in ('shipped', 'delivered', 'cancelled')) then
    raise exception 'Este pedido ya no se puede cancelar';
  end if;

  for v_item in select product_id, quantity from public.order_items where order_id = p_order_id loop
    update public.products set stock = stock + v_item.quantity where id = v_item.product_id;
  end loop;
  update public.order_items set status = 'cancelled' where order_id = p_order_id;
  update public.orders set status = 'cancelled', payment_status = 'refunded', payout_status = 'refunded' where id = p_order_id;
  update public.seller_paypal_payouts set status = 'refunded' where order_id = p_order_id and status <> 'refunded';
  update public.simulated_refunds set status = 'completed' where id = v_refund_id;
  return v_refund_id;
end;
$$;

grant execute on function public.finalize_paid_order_real_refund(uuid,uuid) to authenticated;
