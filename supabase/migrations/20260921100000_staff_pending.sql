-- Reserva de alta de cajero: Auth no entrega app_metadata en el INSERT de auth.users.

create table public.staff_pending (
  email text primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now(),
  constraint staff_pending_email_lower check (email = lower(email))
);

alter table public.staff_pending enable row level security;

revoke all on table public.staff_pending from public, anon, authenticated;
grant all on table public.staff_pending to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_store_id uuid;
  v_pending public.staff_pending%rowtype;
  v_name text;
begin
  v_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  select * into v_pending
  from public.staff_pending
  where email = lower(new.email);

  if found then
    if not exists (
      select 1 from public.stores
      where id = v_pending.store_id and organization_id = v_pending.organization_id
    ) then
      raise exception 'El local no pertenece a la organización';
    end if;

    insert into public.profiles (user_id, organization_id, store_id, role, full_name, email, is_active)
    values (
      new.id,
      v_pending.organization_id,
      v_pending.store_id,
      'cashier',
      coalesce(nullif(v_pending.full_name, ''), v_name),
      lower(new.email),
      true
    );

    delete from public.staff_pending where email = v_pending.email;
    return new;
  end if;

  select id into v_org_id from public.organizations order by created_at asc limit 1;

  if v_org_id is null then
    insert into public.organizations (name) values ('RUNAY FARMA') returning id into v_org_id;
    insert into public.stores (organization_id, name) values (v_org_id, 'Principal') returning id into v_store_id;
    insert into public.payment_methods (organization_id, code, name, sort_order) values
      (v_org_id, 'cash', 'Efectivo', 1),
      (v_org_id, 'yape', 'Yape', 2),
      (v_org_id, 'plin', 'Plin', 3),
      (v_org_id, 'card', 'Tarjeta', 4),
      (v_org_id, 'transfer', 'Transferencia', 5);
    insert into public.profiles (user_id, organization_id, store_id, role, full_name, email, is_active)
    values (new.id, v_org_id, v_store_id, 'owner', v_name, lower(new.email), true);
    return new;
  end if;

  raise exception 'Registro cerrado. El dueño debe crear tu cuenta.';
end;
$$;
