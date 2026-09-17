-- Identidad del negocio (RUC) y del local (DIGEMID / punto de emisión).
-- El dueño puede editar org, métodos de pago y series; el efectivo no se desactiva.

alter table public.organizations
  add column if not exists ruc text,
  add column if not exists tax_address text,
  add column if not exists phone text,
  add column if not exists email text;

alter table public.organizations drop constraint if exists organizations_ruc_check;
alter table public.organizations
  add constraint organizations_ruc_check
  check (ruc is null or ruc ~ '^[0-9]{11}$');

alter table public.stores
  add column if not exists address text,
  add column if not exists district text,
  add column if not exists phone text,
  add column if not exists hours text,
  add column if not exists sanitary_auth text,
  add column if not exists director_name text,
  add column if not exists director_license text;

alter table public.document_series drop constraint if exists document_series_format_check;
alter table public.document_series
  add constraint document_series_format_check
  check (series ~ '^[BF][0-9]{3}$');

create or replace function public.protect_cash_method()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and old.code = 'cash' then
    if new.code is distinct from old.code then
      raise exception 'No se puede cambiar el código de efectivo';
    end if;
    if new.is_active = false then
      raise exception 'El efectivo no se puede desactivar';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists payment_methods_protect_cash on public.payment_methods;
create trigger payment_methods_protect_cash
  before update on public.payment_methods
  for each row execute function public.protect_cash_method();

create policy organizations_update_owner on public.organizations
  for update to authenticated
  using (id = public.current_org_id() and public.is_owner())
  with check (id = public.current_org_id() and public.is_owner());

create policy payment_methods_insert_owner on public.payment_methods
  for insert to authenticated
  with check (organization_id = public.current_org_id() and public.is_owner());

create policy payment_methods_update_owner on public.payment_methods
  for update to authenticated
  using (organization_id = public.current_org_id() and public.is_owner())
  with check (organization_id = public.current_org_id() and public.is_owner());

create policy document_series_update_owner on public.document_series
  for update to authenticated
  using (organization_id = public.current_org_id() and public.is_owner())
  with check (organization_id = public.current_org_id() and public.is_owner());

grant select, update on table public.organizations to authenticated;
grant select, insert, update on table public.payment_methods to authenticated;
grant select, update on table public.document_series to authenticated;
