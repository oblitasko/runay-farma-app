-- Fase 3: series de documentos, boletas internas y RLS multi-sucursal.

create type public.invoice_type as enum ('boleta', 'factura');
create type public.invoice_status as enum ('issued');
create type public.sunat_status as enum ('not_sent');

create table public.document_series (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  type public.invoice_type not null,
  series text not null,
  next_number integer not null default 1 check (next_number >= 1),
  unique (store_id, type)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  sale_id uuid not null unique references public.sales (id) on delete restrict,
  type public.invoice_type not null,
  series text not null,
  number integer not null check (number >= 1),
  customer_name text,
  customer_doc text,
  customer_phone text,
  total numeric(12, 2) not null check (total >= 0),
  status public.invoice_status not null default 'issued',
  sunat_status public.sunat_status not null default 'not_sent',
  issued_at timestamptz not null default now(),
  issued_by uuid not null references public.profiles (user_id),
  unique (store_id, type, series, number)
);

create index invoices_store_issued_idx on public.invoices (store_id, issued_at desc);
create index invoices_sale_idx on public.invoices (sale_id);

insert into public.document_series (organization_id, store_id, type, series, next_number)
select s.organization_id, s.id, 'boleta'::public.invoice_type, 'B001', 1
from public.stores s
on conflict (store_id, type) do nothing;

insert into public.document_series (organization_id, store_id, type, series, next_number)
select s.organization_id, s.id, 'factura'::public.invoice_type, 'F001', 1
from public.stores s
on conflict (store_id, type) do nothing;

create or replace function public.ensure_store_series()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.document_series (organization_id, store_id, type, series, next_number)
  values
    (new.organization_id, new.id, 'boleta', 'B001', 1),
    (new.organization_id, new.id, 'factura', 'F001', 1)
  on conflict (store_id, type) do nothing;
  return new;
end;
$$;

create trigger stores_ensure_series
  after insert on public.stores
  for each row execute function public.ensure_store_series();

create or replace function public.issue_invoice(
  p_sale_id uuid,
  p_type public.invoice_type,
  p_customer_name text default null,
  p_customer_doc text default null,
  p_customer_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_sale public.sales%rowtype;
  v_series public.document_series%rowtype;
  v_invoice_id uuid;
  v_number integer;
begin
  select organization_id into v_org_id from public.profiles where user_id = auth.uid();
  if v_org_id is null then
    raise exception 'No hay perfil asociado al usuario';
  end if;

  select * into v_sale from public.sales where id = p_sale_id and organization_id = v_org_id;
  if v_sale.id is null then
    raise exception 'Venta no encontrada';
  end if;
  if v_sale.status <> 'completed' then
    raise exception 'Solo se puede emitir sobre una venta completada';
  end if;

  if exists (select 1 from public.invoices where sale_id = p_sale_id) then
    select id into v_invoice_id from public.invoices where sale_id = p_sale_id;
    return v_invoice_id;
  end if;

  if p_type = 'factura' and length(trim(coalesce(p_customer_doc, ''))) < 8 then
    raise exception 'La factura requiere RUC o documento del cliente';
  end if;

  select * into v_series
  from public.document_series
  where store_id = v_sale.store_id and type = p_type
  for update;

  if v_series.id is null then
    raise exception 'No hay serie configurada para este local';
  end if;

  v_number := v_series.next_number;

  insert into public.invoices (
    organization_id, store_id, sale_id, type, series, number,
    customer_name, customer_doc, customer_phone, total, issued_by
  ) values (
    v_org_id, v_sale.store_id, p_sale_id, p_type, v_series.series, v_number,
    nullif(trim(coalesce(p_customer_name, '')), ''),
    nullif(trim(coalesce(p_customer_doc, '')), ''),
    nullif(trim(coalesce(p_customer_phone, '')), ''),
    v_sale.total,
    auth.uid()
  ) returning id into v_invoice_id;

  update public.document_series
  set next_number = next_number + 1
  where id = v_series.id;

  return v_invoice_id;
end;
$$;

alter table public.document_series enable row level security;
alter table public.invoices enable row level security;

create policy document_series_select on public.document_series
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy invoices_select on public.invoices
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy stores_insert_owner on public.stores
  for insert to authenticated
  with check (organization_id = public.current_org_id() and public.is_owner());

create policy stores_update_owner on public.stores
  for update to authenticated
  using (organization_id = public.current_org_id() and public.is_owner())
  with check (organization_id = public.current_org_id() and public.is_owner());

create policy profiles_update_owner_staff on public.profiles
  for update to authenticated
  using (organization_id = public.current_org_id() and public.is_owner())
  with check (organization_id = public.current_org_id() and public.is_owner());

grant select on table public.document_series to authenticated;
grant select on table public.invoices to authenticated;
grant insert, update on table public.stores to authenticated;
grant update on table public.profiles to authenticated;

revoke all on function public.issue_invoice(uuid, public.invoice_type, text, text, text) from public;
grant execute on function public.issue_invoice(uuid, public.invoice_type, text, text, text) to authenticated;
