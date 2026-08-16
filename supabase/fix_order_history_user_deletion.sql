-- Ejecutar una vez en el SQL Editor de Supabase para bases existentes.
-- Permite eliminar automáticamente los historiales asociados al perfil.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'order_status_history'
      and column_name = 'created_by'
  ) then
    alter table public.order_status_history
      drop constraint if exists order_status_history_created_by_fkey;

    alter table public.order_status_history
      add constraint order_status_history_created_by_fkey
      foreign key (created_by)
      references public.profiles(id)
      on delete cascade;
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'order_status_history'
      and column_name = 'changed_by'
  ) then
    alter table public.order_status_history
      drop constraint if exists order_status_history_changed_by_fkey;

    alter table public.order_status_history
      add constraint order_status_history_changed_by_fkey
      foreign key (changed_by)
      references public.profiles(id)
      on delete cascade;
  end if;
end $$;
