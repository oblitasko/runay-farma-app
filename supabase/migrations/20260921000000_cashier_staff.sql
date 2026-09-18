-- Cajeros por organización: el dueño crea cuentas; el registro público no entra a la org.

alter table public.profiles
  add column if not exists email text,
  add column if not exists is_active boolean not null default true;

create unique index if not exists profiles_org_email_idx
  on public.profiles (organization_id, lower(email))
  where email is not null;

create index if not exists profiles_org_role_idx
  on public.profiles (organization_id, role);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_store_id uuid;
  v_meta_org uuid;
  v_meta_store uuid;
  v_meta_role text;
  v_name text;
begin
  v_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_meta_org := nullif(new.raw_app_meta_data->>'organization_id', '')::uuid;
  v_meta_store := nullif(new.raw_app_meta_data->>'store_id', '')::uuid;
  v_meta_role := new.raw_app_meta_data->>'role';

  if v_meta_org is not null then
    if v_meta_role is distinct from 'cashier' then
      raise exception 'Alta inválida';
    end if;
    if not exists (select 1 from public.organizations where id = v_meta_org) then
      raise exception 'Organización no encontrada';
    end if;
    if v_meta_store is not null and not exists (
      select 1 from public.stores where id = v_meta_store and organization_id = v_meta_org
    ) then
      raise exception 'El local no pertenece a la organización';
    end if;

    insert into public.profiles (user_id, organization_id, store_id, role, full_name, email, is_active)
    values (new.id, v_meta_org, v_meta_store, 'cashier', v_name, new.email, true);
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
    values (new.id, v_org_id, v_store_id, 'owner', v_name, new.email, true);
    return new;
  end if;

  raise exception 'Registro cerrado. El dueño debe crear tu cuenta.';
end;
$$;

create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.organization_id is distinct from old.organization_id
     or new.role is distinct from old.role then
    raise exception 'No se puede cambiar el rol ni la organización';
  end if;

  if old.role = 'owner' and new.is_active is distinct from old.is_active then
    raise exception 'No se puede desactivar al dueño';
  end if;

  if (select auth.uid()) = old.user_id then
    if new.store_id is distinct from old.store_id
       or new.is_active is distinct from old.is_active
       or new.email is distinct from old.email then
      raise exception 'No puedes cambiar ese dato';
    end if;
    return new;
  end if;

  if not public.is_owner() then
    raise exception 'Solo el dueño administra cajeros';
  end if;

  if old.role is distinct from 'cashier' then
    raise exception 'Solo se administran cajeros';
  end if;

  if new.store_id is not null and not exists (
    select 1 from public.stores s
    where s.id = new.store_id and s.organization_id = old.organization_id
  ) then
    raise exception 'El local no pertenece a la organización';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_columns on public.profiles;
create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

drop policy if exists profiles_update_self on public.profiles;
drop policy if exists profiles_update_owner_staff on public.profiles;

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and organization_id = public.current_org_id()
  );

create policy profiles_update_owner_staff on public.profiles
  for update to authenticated
  using (organization_id = public.current_org_id() and public.is_owner())
  with check (organization_id = public.current_org_id() and public.is_owner());
