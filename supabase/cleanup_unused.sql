-- APEX COMMERCE - limpieza conservadora
--
-- Ejecutar primero en una base de pruebas y después en producción con un
-- respaldo reciente. Este script elimina únicamente datos efímeros o
-- duplicados y funciones RPC que ya no usa el código actual.
-- No elimina pedidos, partidas, pagos, reembolsos, reseñas, calificaciones,
-- reportes, solicitudes de vendedor ni logs administrativos.

begin;

-- 1) Libera reservas de checkout vencidas, si la migración de PayPal existe.
do $$
begin
  if to_regprocedure('public.cleanup_expired_paypal_reservations()') is not null then
    perform public.cleanup_expired_paypal_reservations();
  end if;
end;
$$;

-- 2) Diagnóstico previo: estos conteos deben revisarse antes de confirmar.
select 'checkout_sessions_terminales_antiguas' as item, count(*) as total
from public.paypal_checkout_sessions
where status in ('expired', 'cancelled')
  and updated_at < now() - interval '30 days'
union all
select 'carritos_antiguos', count(*)
from public.cart_items
where updated_at < now() - interval '180 days'
union all
select 'notificaciones_leidas_antiguas', count(*)
from public.notifications
where read_at is not null
  and created_at < now() - interval '180 days'
union all
select 'duplicados_carrito', count(*)
from (
  select row_number() over (
    partition by user_id, product_id order by updated_at desc, created_at desc, id desc
  ) as rn
  from public.cart_items
) duplicates
where rn > 1
union all
select 'duplicados_wishlist', count(*)
from (
  select row_number() over (
    partition by user_id, product_id order by created_at desc, id desc
  ) as rn
  from public.wishlist
) duplicates
where rn > 1;

-- 3) Elimina duplicados, conservando el registro más reciente.
delete from public.cart_items c
using (
  select id
  from (
    select id, row_number() over (
      partition by user_id, product_id order by updated_at desc, created_at desc, id desc
    ) as rn
    from public.cart_items
  ) ranked
  where rn > 1
) duplicates
where c.id = duplicates.id;

delete from public.wishlist w
using (
  select id
  from (
    select id, row_number() over (
      partition by user_id, product_id order by created_at desc, id desc
    ) as rn
    from public.wishlist
  ) ranked
  where rn > 1
) duplicates
where w.id = duplicates.id;

-- 4) Elimina sesiones de checkout ya terminadas y suficientemente antiguas.
-- Las sesiones completadas se conservan 30 días para conciliación; las
-- pendientes vencidas ya fueron marcadas como expired en el paso 1.
delete from public.paypal_checkout_sessions
where status in ('expired', 'cancelled')
  and updated_at < now() - interval '30 days';

-- 5) El carrito es temporal: no tiene valor histórico después de 180 días.
delete from public.cart_items
where updated_at < now() - interval '180 days';

-- 6) Las notificaciones leídas son efímeras. Las no leídas se conservan.
delete from public.notifications
where read_at is not null
  and created_at < now() - interval '180 days';

-- 7) Evita que vuelvan a aparecer duplicados.
create unique index if not exists cart_items_user_product_uidx
  on public.cart_items(user_id, product_id);

create unique index if not exists wishlist_user_product_uidx
  on public.wishlist(user_id, product_id);

-- 8) El flujo actual usa create_order y create_paypal_checkout_session.
-- Estas tres funciones pertenecen al flujo PayPal anterior y no tienen
-- referencias en src/. Se eliminan sin CASCADE para no borrar dependencias.
drop function if exists public.create_pending_order(
  uuid, text, text, text, text, text, text, text, text, text, text, jsonb, text
);
drop function if exists public.complete_paid_order(uuid, uuid, text, text);
drop function if exists public.release_order_reservation(uuid, uuid);

commit;

-- NO borrar automáticamente:
--   orders.delivered_at
--   seller_reports.resolution_notes
--   seller_ratings.communication_rating/shipping_rating/product_quality_rating
-- Primero hay que confirmar si contienen datos históricos que deban conservarse.
