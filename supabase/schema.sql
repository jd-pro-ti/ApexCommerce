-- APEX COMMERCE - esquema completo para Supabase/PostgreSQL
-- Ejecutar en Supabase > SQL Editor sobre un proyecto nuevo.
-- Este script es idempotente en lo posible y no elimina datos existentes.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.is_seller()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'vendedor') and status = 'active'
  );
$$;

create or replace function public.can_read_order(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (select 1 from public.orders o where o.id = p_order_id and o.user_id = auth.uid())
    or exists (select 1 from public.order_items oi where oi.order_id = p_order_id and oi.seller_id = auth.uid());
$$;

create or replace function public.can_read_order_item(p_order_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (select 1 from public.order_items oi where oi.id = p_order_item_id and oi.seller_id = auth.uid())
    or exists (
      select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = p_order_item_id and o.user_id = auth.uid()
    );
$$;

-- ---------------------------------------------------------------------------
-- Usuarios y perfiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default 'Usuario',
  avatar_url text,
  role text not null default 'cliente' check (role in ('admin', 'vendedor', 'cliente')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  seller_rating_avg numeric(3,2) not null default 0 check (seller_rating_avg between 0 and 5),
  seller_rating_count integer not null default 0 check (seller_rating_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_details (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  phone text,
  address text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text default 'México',
  reference text,
  bio text,
  website text,
  social_media jsonb not null default '{}'::jsonb,
  preferences jsonb not null default jsonb_build_object(
    'email_notifications', true,
    'sms_alerts', false,
    'order_updates', true,
    'promotions', false
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  first_role text;
begin
  -- El primer usuario queda como administrador; los demás como cliente.
  perform pg_advisory_xact_lock(hashtextextended('apex-first-user', 0));
  if not exists (select 1 from public.profiles) then
    first_role := 'admin';
  else
    first_role := coalesce(new.raw_user_meta_data->>'role', 'cliente');
    if first_role not in ('admin', 'vendedor', 'cliente') then first_role := 'cliente'; end if;
    if first_role = 'admin' then first_role := 'cliente'; end if;
  end if;

  insert into public.profiles (id, email, name, avatar_url, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Usuario'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    first_role
  )
  on conflict (id) do update set email = excluded.email;

  insert into public.profile_details (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  images text[] not null default '{}',
  specifications jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'pending', 'rejected', 'inactive')),
  featured boolean not null default false,
  rating_avg numeric(3,2) not null default 0 check (rating_avg between 0 and 5),
  rating_count integer not null default 0 check (rating_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_seller_idx on public.products(seller_id);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_status_idx on public.products(status);

-- ---------------------------------------------------------------------------
-- Carrito y favoritos
-- ---------------------------------------------------------------------------

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ---------------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('ORD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  user_id uuid not null references public.profiles(id) on delete restrict,
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
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  payment_method text,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  shipping_cost numeric(12,2) not null default 0 check (shipping_cost >= 0),
  tax numeric(12,2) not null default 0 check (tax >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  seller_id uuid not null references public.profiles(id) on delete restrict,
  product_name text not null,
  product_price numeric(12,2) not null check (product_price >= 0),
  quantity integer not null check (quantity > 0),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  status text not null default 'pending' check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  notes text,
  changed_by uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders(user_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists order_items_seller_idx on public.order_items(seller_id);

-- ---------------------------------------------------------------------------
-- Reseñas, calificaciones y reportes
-- ---------------------------------------------------------------------------

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid not null unique references public.order_items(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text,
  comment text,
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_ratings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_id, user_id, order_id)
);

create table if not exists public.seller_reports (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  reason_details text,
  description text,
  evidence_images text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Triggers de mantenimiento y ratings
-- ---------------------------------------------------------------------------

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists profile_details_updated_at on public.profile_details;
create trigger profile_details_updated_at before update on public.profile_details for each row execute function public.set_updated_at();
drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists cart_items_updated_at on public.cart_items;
create trigger cart_items_updated_at before update on public.cart_items for each row execute function public.set_updated_at();
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
drop trigger if exists order_items_updated_at on public.order_items;
create trigger order_items_updated_at before update on public.order_items for each row execute function public.set_updated_at();
drop trigger if exists product_reviews_updated_at on public.product_reviews;
create trigger product_reviews_updated_at before update on public.product_reviews for each row execute function public.set_updated_at();
drop trigger if exists seller_ratings_updated_at on public.seller_ratings;
create trigger seller_ratings_updated_at before update on public.seller_ratings for each row execute function public.set_updated_at();
drop trigger if exists seller_reports_updated_at on public.seller_reports;
create trigger seller_reports_updated_at before update on public.seller_reports for each row execute function public.set_updated_at();

create or replace function public.refresh_product_rating()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.products p set
    rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.product_reviews where product_id = coalesce(new.product_id, old.product_id) and status = 'approved'), 0),
    rating_count = (select count(*) from public.product_reviews where product_id = coalesce(new.product_id, old.product_id) and status = 'approved')
  where p.id = coalesce(new.product_id, old.product_id);
  return coalesce(new, old);
end; $$;

drop trigger if exists product_rating_refresh on public.product_reviews;
create trigger product_rating_refresh after insert or update or delete on public.product_reviews for each row execute function public.refresh_product_rating();

create or replace function public.refresh_seller_rating()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles p set
    seller_rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.seller_ratings where seller_id = coalesce(new.seller_id, old.seller_id) and status = 'approved'), 0),
    seller_rating_count = (select count(*) from public.seller_ratings where seller_id = coalesce(new.seller_id, old.seller_id) and status = 'approved')
  where p.id = coalesce(new.seller_id, old.seller_id);
  return coalesce(new, old);
end; $$;

drop trigger if exists seller_rating_refresh on public.seller_ratings;
create trigger seller_rating_refresh after insert or update or delete on public.seller_ratings for each row execute function public.refresh_seller_rating();

create or replace function public.record_order_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_history(order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end; $$;

drop trigger if exists order_status_history_trigger on public.orders;
create trigger order_status_history_trigger after insert or update of status on public.orders for each row execute function public.record_order_status();

-- ---------------------------------------------------------------------------
-- RPC de pedidos usadas por la aplicación
-- ---------------------------------------------------------------------------

create or replace function public.create_order(
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
  v_tax numeric(12,2) := 0;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'No autorizado'; end if;
  if jsonb_typeof(p_cart_items) <> 'array' or jsonb_array_length(p_cart_items) = 0 then raise exception 'El carrito está vacío'; end if;

  insert into public.orders(user_id, customer_name, customer_email, customer_phone, shipping_address, shipping_address_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country, shipping_reference, notes)
  values (p_user_id, p_customer_name, p_customer_email, p_customer_phone, p_shipping_address, nullif(p_shipping_address_line2, ''), p_shipping_city, p_shipping_state, p_shipping_postal_code, coalesce(nullif(p_shipping_country, ''), 'México'), nullif(p_shipping_reference, ''), nullif(p_notes, ''))
  returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_cart_items) loop
    v_product_id := (v_item->>'id')::uuid;
    v_quantity := greatest(1, coalesce((v_item->>'quantity')::integer, 1));

    select * into v_product from public.products where id = v_product_id and status = 'active' for update;
    if not found then raise exception 'Producto no disponible: %', v_product_id; end if;
    if v_product.stock < v_quantity then raise exception 'Stock insuficiente para: %', v_product.name; end if;

    insert into public.order_items(order_id, product_id, seller_id, product_name, product_price, quantity, subtotal)
    values (v_order_id, v_product.id, v_product.seller_id, v_product.name, v_product.price, v_quantity, round(v_product.price * v_quantity, 2));
    update public.products set stock = stock - v_quantity where id = v_product.id;
    v_subtotal := v_subtotal + round(v_product.price * v_quantity, 2);
  end loop;

  v_shipping := case when v_subtotal > 150 then 0 else 19.99 end;
  update public.orders set subtotal = v_subtotal, shipping_cost = v_shipping, tax = v_tax, total = v_subtotal + v_shipping + v_tax, status = 'confirmed' where id = v_order_id;
  delete from public.cart_items where user_id = p_user_id;
  return v_order_id;
exception when others then
  if v_order_id is not null then delete from public.orders where id = v_order_id; end if;
  raise;
end;
$$;

create or replace function public.update_order_status(p_order_id uuid, p_status text, p_notes text default '')
returns uuid language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'No autorizado'; end if;
  if p_status not in ('pending','confirmed','processing','shipped','delivered','cancelled') then raise exception 'Estado inválido'; end if;
  update public.orders set status = p_status where id = p_order_id;
  if p_notes <> '' then insert into public.order_status_history(order_id, status, notes, changed_by) values (p_order_id, p_status, p_notes, auth.uid()); end if;
  return p_order_id;
end; $$;

create or replace function public.update_order_item_status(p_item_id uuid, p_status text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_order_id uuid;
begin
  if p_status not in ('processing','shipped','delivered','cancelled') then raise exception 'Estado inválido'; end if;
  update public.order_items set status = p_status where id = p_item_id and (seller_id = auth.uid() or public.is_admin()) returning order_id into v_order_id;
  if v_order_id is null then raise exception 'No autorizado o artículo inexistente'; end if;
  return v_order_id;
end; $$;

grant execute on function public.create_order(uuid,text,text,text,text,text,text,text,text,text,text,jsonb,text) to authenticated;
grant execute on function public.update_order_status(uuid,text,text) to authenticated;
grant execute on function public.update_order_item_status(uuid,text) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.profile_details enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlist enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.product_reviews enable row level security;
alter table public.seller_ratings enable row level security;
alter table public.seller_reports enable row level security;

-- Profiles: lectura pública solo para los campos que consume el catálogo; la
-- aplicación obtiene el perfil completo del propio usuario.
create policy profiles_select on public.profiles for select using (true);
create policy profiles_update_own on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy profiles_admin_delete on public.profiles for delete using (public.is_admin());

create policy profile_details_own on public.profile_details for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy categories_public_read on public.categories for select using (true);
create policy categories_admin_write on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy products_public_read on public.products for select using (status = 'active' or seller_id = auth.uid() or public.is_admin());
create policy products_seller_insert on public.products for insert with check (seller_id = auth.uid() and public.is_seller());
create policy products_seller_update on public.products for update using (seller_id = auth.uid() or public.is_admin()) with check (seller_id = auth.uid() or public.is_admin());
create policy products_seller_delete on public.products for delete using (seller_id = auth.uid() or public.is_admin());

create policy cart_own on public.cart_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy wishlist_own on public.wishlist for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy orders_read on public.orders for select using (public.can_read_order(id));
create policy order_items_read on public.order_items for select using (public.can_read_order_item(id));
create policy order_history_read on public.order_status_history for select using (public.can_read_order(order_id));

create policy product_reviews_read on public.product_reviews for select using (status = 'approved' or user_id = auth.uid() or public.is_admin());
create policy product_reviews_insert on public.product_reviews for insert with check (user_id = auth.uid());
create policy product_reviews_update on public.product_reviews for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy seller_ratings_read on public.seller_ratings for select using (status = 'approved' or user_id = auth.uid() or public.is_admin());
create policy seller_ratings_insert on public.seller_ratings for insert with check (user_id = auth.uid());
create policy seller_ratings_update on public.seller_ratings for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy seller_reports_own on public.seller_reports for insert with check (user_id = auth.uid());
create policy seller_reports_read on public.seller_reports for select using (user_id = auth.uid() or public.is_admin());
create policy seller_reports_admin_update on public.seller_reports for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: buckets usados por productService y profileService
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public) values ('products', 'products', true) on conflict (id) do update set public = true;
insert into storage.buckets (id, name, public) values ('profiles', 'profiles', true) on conflict (id) do update set public = true;

create policy product_images_public_read on storage.objects for select using (bucket_id = 'products');
create policy product_images_write on storage.objects for insert with check (bucket_id = 'products' and (public.is_seller() or public.is_admin()));
create policy product_images_update on storage.objects for update using (bucket_id = 'products' and (public.is_seller() or public.is_admin()));
create policy product_images_delete on storage.objects for delete using (bucket_id = 'products' and (public.is_seller() or public.is_admin()));
create policy profile_images_public_read on storage.objects for select using (bucket_id = 'profiles');
create policy profile_images_write on storage.objects for insert with check (bucket_id = 'profiles' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin()));
create policy profile_images_update on storage.objects for update using (bucket_id = 'profiles' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin()));
create policy profile_images_delete on storage.objects for delete using (bucket_id = 'profiles' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin()));

-- Categorías iniciales; se ignoran si ya existen.
insert into public.categories (name, description) values
  ('Electrónica', 'Tecnología, dispositivos y accesorios'),
  ('Hogar', 'Productos para casa y oficina'),
  ('Moda', 'Ropa, calzado y accesorios'),
  ('Deportes', 'Equipo y accesorios deportivos'),
  ('Belleza', 'Cuidado personal y belleza')
on conflict (name) do nothing;
