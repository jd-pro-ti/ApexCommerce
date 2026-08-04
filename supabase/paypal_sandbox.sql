-- PayPal Sandbox / marketplace checkout migration.
-- Run this script in Supabase SQL Editor after schema.sql.

alter table public.products
  add column if not exists reserved_stock integer not null default 0
    check (reserved_stock >= 0);

alter table public.orders
  add column if not exists paypal_order_id text,
  add column if not exists paypal_capture_id text,
  add column if not exists payment_created_at timestamptz,
  add column if not exists reservation_expires_at timestamptz;

create unique index if not exists orders_paypal_order_id_idx
  on public.orders(paypal_order_id)
  where paypal_order_id is not null;

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
