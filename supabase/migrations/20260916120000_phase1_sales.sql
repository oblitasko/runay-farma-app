create extension if not exists "pgcrypto";

create type public.user_role as enum ('owner', 'cashier');
create type public.cash_session_status as enum ('open', 'closed');
create type public.sale_status as enum ('completed', 'voided');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  store_id uuid references public.stores (id),
  role public.user_role not null,
  full_name text not null,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  sku text,
  barcode text,
  name text not null,
  sale_price numeric(12, 2) not null check (sale_price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  unique (organization_id, code)
);

create table public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  opened_by uuid not null references public.profiles (user_id),
  closed_by uuid references public.profiles (user_id),
  status public.cash_session_status not null default 'open',
  opening_amount numeric(12, 2) not null default 0 check (opening_amount >= 0),
  closing_amount numeric(12, 2) check (closing_amount >= 0),
  expected_cash numeric(12, 2),
  difference numeric(12, 2),
  notes text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create unique index cash_sessions_one_open_per_store
  on public.cash_sessions (store_id)
  where status = 'open';

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  cash_session_id uuid not null references public.cash_sessions (id),
  cashier_id uuid not null references public.profiles (user_id),
  status public.sale_status not null default 'completed',
  subtotal numeric(12, 2) not null,
  total numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  product_id uuid not null references public.products (id),
  product_name text not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  unit_price numeric(12, 2) not null,
  subtotal numeric(12, 2) not null
);

create table public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  payment_method_id uuid not null references public.payment_methods (id),
  amount numeric(12, 2) not null check (amount > 0)
);

create index products_org_name_idx on public.products (organization_id, name);
create index products_org_barcode_idx on public.products (organization_id, barcode);
create index sales_store_created_idx on public.sales (store_id, created_at desc);
create index sales_session_idx on public.sales (cash_session_id);
create index sale_items_sale_idx on public.sale_items (sale_id);
create index sale_payments_sale_idx on public.sale_payments (sale_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where user_id = auth.uid() limit 1;
$$;

create or replace function public.current_store_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select store_id from public.profiles where user_id = auth.uid() limit 1;
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_store_id uuid;
  v_role public.user_role;
  v_name text;
begin
  v_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

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
    v_role := 'owner';
  else
    select id into v_store_id from public.stores where organization_id = v_org_id order by created_at asc limit 1;
    if exists (select 1 from public.profiles where organization_id = v_org_id and role = 'owner') then
      v_role := 'cashier';
    else
      v_role := 'owner';
    end if;
  end if;

  insert into public.profiles (user_id, organization_id, store_id, role, full_name)
  values (new.id, v_org_id, v_store_id, v_role, v_name);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.create_sale(
  p_store_id uuid,
  p_cash_session_id uuid,
  p_items jsonb,
  p_payments jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_session public.cash_sessions%rowtype;
  v_sale_id uuid;
  v_subtotal numeric(12, 2) := 0;
  v_pay_total numeric(12, 2) := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty numeric(12, 3);
  v_line numeric(12, 2);
  v_payment jsonb;
begin
  select organization_id into v_org_id from public.profiles where user_id = auth.uid();
  if v_org_id is null then
    raise exception 'No hay perfil asociado al usuario';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta no tiene productos';
  end if;

  if p_payments is null or jsonb_array_length(p_payments) = 0 then
    raise exception 'La venta no tiene pagos';
  end if;

  select * into v_session
  from public.cash_sessions
  where id = p_cash_session_id
    and organization_id = v_org_id
    and store_id = p_store_id
    and status = 'open';

  if v_session.id is null then
    raise exception 'No hay caja abierta';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::numeric;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Cantidad inválida';
    end if;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
      and organization_id = v_org_id
      and is_active = true;

    if v_product.id is null then
      raise exception 'Producto inválido o inactivo';
    end if;

    v_line := round(v_product.sale_price * v_qty, 2);
    v_subtotal := v_subtotal + v_line;
  end loop;

  select coalesce(sum((p->>'amount')::numeric), 0) into v_pay_total
  from jsonb_array_elements(p_payments) as p;

  if round(v_pay_total, 2) <> round(v_subtotal, 2) then
    raise exception 'El pago no coincide con el total';
  end if;

  insert into public.sales (
    organization_id, store_id, cash_session_id, cashier_id, status, subtotal, total
  ) values (
    v_org_id, p_store_id, p_cash_session_id, auth.uid(), 'completed', v_subtotal, v_subtotal
  ) returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid;

    v_qty := (v_item->>'quantity')::numeric;
    v_line := round(v_product.sale_price * v_qty, 2);

    insert into public.sale_items (sale_id, product_id, product_name, quantity, unit_price, subtotal)
    values (v_sale_id, v_product.id, v_product.name, v_qty, v_product.sale_price, v_line);
  end loop;

  for v_payment in select * from jsonb_array_elements(p_payments)
  loop
    if not exists (
      select 1 from public.payment_methods
      where id = (v_payment->>'payment_method_id')::uuid
        and organization_id = v_org_id
        and is_active = true
    ) then
      raise exception 'Método de pago inválido';
    end if;

    insert into public.sale_payments (sale_id, payment_method_id, amount)
    values (
      v_sale_id,
      (v_payment->>'payment_method_id')::uuid,
      round((v_payment->>'amount')::numeric, 2)
    );
  end loop;

  return v_sale_id;
end;
$$;

create or replace function public.close_cash_session(
  p_session_id uuid,
  p_counted_amount numeric,
  p_notes text default null
)
returns public.cash_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_session public.cash_sessions%rowtype;
  v_cash_sales numeric(12, 2) := 0;
  v_expected numeric(12, 2);
begin
  select organization_id into v_org_id from public.profiles where user_id = auth.uid();
  if v_org_id is null then
    raise exception 'No hay perfil asociado al usuario';
  end if;

  if p_counted_amount is null or p_counted_amount < 0 then
    raise exception 'El conteo de caja es inválido';
  end if;

  select * into v_session
  from public.cash_sessions
  where id = p_session_id
    and organization_id = v_org_id
    and status = 'open'
  for update;

  if v_session.id is null then
    raise exception 'No hay caja abierta';
  end if;

  select coalesce(sum(sp.amount), 0) into v_cash_sales
  from public.sale_payments sp
  join public.sales s on s.id = sp.sale_id
  join public.payment_methods pm on pm.id = sp.payment_method_id
  where s.cash_session_id = v_session.id
    and s.status = 'completed'
    and pm.code = 'cash';

  v_expected := round(v_session.opening_amount + v_cash_sales, 2);

  update public.cash_sessions
  set
    status = 'closed',
    closed_by = auth.uid(),
    closed_at = now(),
    closing_amount = round(p_counted_amount, 2),
    expected_cash = v_expected,
    difference = round(p_counted_amount - v_expected, 2),
    notes = p_notes
  where id = v_session.id
  returning * into v_session;

  return v_session;
end;
$$;

alter table public.organizations enable row level security;
alter table public.stores enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.payment_methods enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.sale_payments enable row level security;

create policy organizations_select on public.organizations
  for select to authenticated
  using (id = public.current_org_id());

create policy stores_select on public.stores
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy profiles_select on public.profiles
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy products_select on public.products
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy products_insert_owner on public.products
  for insert to authenticated
  with check (organization_id = public.current_org_id() and public.is_owner());

create policy products_update_owner on public.products
  for update to authenticated
  using (organization_id = public.current_org_id() and public.is_owner())
  with check (organization_id = public.current_org_id() and public.is_owner());

create policy payment_methods_select on public.payment_methods
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy cash_sessions_select on public.cash_sessions
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy cash_sessions_insert on public.cash_sessions
  for insert to authenticated
  with check (
    organization_id = public.current_org_id()
    and opened_by = auth.uid()
  );

create policy sales_select on public.sales
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy sale_items_select on public.sale_items
  for select to authenticated
  using (
    exists (
      select 1 from public.sales s
      where s.id = sale_id and s.organization_id = public.current_org_id()
    )
  );

create policy sale_payments_select on public.sale_payments
  for select to authenticated
  using (
    exists (
      select 1 from public.sales s
      where s.id = sale_id and s.organization_id = public.current_org_id()
    )
  );

grant execute on function public.create_sale(uuid, uuid, jsonb, jsonb) to authenticated;
grant execute on function public.close_cash_session(uuid, numeric, text) to authenticated;
grant execute on function public.current_org_id() to authenticated;
grant execute on function public.current_store_id() to authenticated;
grant execute on function public.is_owner() to authenticated;
