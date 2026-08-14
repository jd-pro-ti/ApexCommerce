-- Preferencias de comunicación del cliente.
-- Ejecutar una vez en Supabase SQL Editor. Es idempotente.
alter table public.profile_details
  add column if not exists preferences jsonb not null default jsonb_build_object(
    'email_notifications', true,
    'sms_alerts', false,
    'order_updates', true,
    'promotions', false
  );

comment on column public.profile_details.preferences is
  'Preferencias de comunicación y notificaciones del propietario del perfil.';

-- Normaliza filas existentes que pudieran tener el valor nulo.
update public.profile_details
set preferences = jsonb_build_object(
  'email_notifications', coalesce((preferences->>'email_notifications')::boolean, true),
  'sms_alerts', coalesce((preferences->>'sms_alerts')::boolean, false),
  'order_updates', coalesce((preferences->>'order_updates')::boolean, true),
  'promotions', coalesce((preferences->>'promotions')::boolean, false)
)
where preferences is null;
