-- Fase 2: proveedores, compras, lotes, movimientos y FEFO en create_sale.

alter table public.products
  add column if not exists min_stock numeric(12, 3) not null default 0 check (min_stock >= 0);

create type public.purchase_status as enum ('received');
create type public.stock_movement_type as enum ('purchase', 'sale');

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  ruc text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  supplier_id uuid not null references public.suppliers (id),
  status public.purchase_status not null default 'received',
  notes text,
  received_by uuid not null references public.profiles (user_id),
  received_at timestamptz not null default now()
);

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  product_id uuid not null references public.products (id),
  lot_code text not null,
  expires_on date not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  unit_cost numeric(12, 2) not null default 0 check (unit_cost >= 0)
);

create table public.lots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  product_id uuid not null references public.products (id),
  lot_code text not null,
  expires_on date not null,
  quantity_on_hand numeric(12, 3) not null default 0 check (quantity_on_hand >= 0),
  unit_cost numeric(12, 2) not null default 0 check (unit_cost >= 0),
  purchase_item_id uuid references public.purchase_items (id),
  created_at timestamptz not null default now(),
  unique (store_id, product_id, lot_code, expires_on)
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lot_id uuid not null references public.lots (id),
  type public.stock_movement_type not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  sale_item_id uuid references public.sale_items (id) on delete set null,
  purchase_item_id uuid references public.purchase_items (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.sale_item_lots (
  id uuid primary key default gen_random_uuid(),
  sale_item_id uuid not null references public.sale_items (id) on delete cascade,
  lot_id uuid not null references public.lots (id),
  quantity numeric(12, 3) not null check (quantity > 0)
);

create index suppliers_org_name_idx on public.suppliers (organization_id, name);
create index purchases_store_received_idx on public.purchases (store_id, received_at desc);
create index purchase_items_purchase_idx on public.purchase_items (purchase_id);
create index lots_store_product_expiry_idx on public.lots (store_id, product_id, expires_on);
create index lots_store_qty_idx on public.lots (store_id, product_id) where quantity_on_hand > 0;
create index stock_movements_lot_idx on public.stock_movements (lot_id, created_at desc);
create index sale_item_lots_item_idx on public.sale_item_lots (sale_item_id);

create or replace function public.lima_today()
returns date
language sql
stable
as $$
  select (timezone('America/Lima', now()))::date;
$$;

create or replace function public.receive_purchase(
  p_store_id uuid,
  p_supplier_id uuid,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_purchase_id uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty numeric(12, 3);
  v_cost numeric(12, 2);
  v_lot_code text;
  v_expires date;
  v_purchase_item_id uuid;
  v_lot_id uuid;
begin
  select organization_id into v_org_id from public.profiles where user_id = auth.uid();
  if v_org_id is null then
    raise exception 'No hay perfil asociado al usuario';
  end if;

  if not exists (
    select 1 from public.stores where id = p_store_id and organization_id = v_org_id
  ) then
    raise exception 'Sucursal inválida';
  end if;

  if not exists (
    select 1 from public.suppliers
    where id = p_supplier_id and organization_id = v_org_id and is_active = true
  ) then
    raise exception 'Proveedor inválido o inactivo';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'La compra no tiene productos';
  end if;

  insert into public.purchases (
    organization_id, store_id, supplier_id, status, notes, received_by
  ) values (
    v_org_id, p_store_id, p_supplier_id, 'received', nullif(trim(coalesce(p_notes, '')), ''), auth.uid()
  ) returning id into v_purchase_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::numeric;
    v_cost := coalesce((v_item->>'unit_cost')::numeric, 0);
    v_lot_code := trim(coalesce(v_item->>'lot_code', ''));
    v_expires := (v_item->>'expires_on')::date;

    if v_qty is null or v_qty <= 0 then
      raise exception 'Cantidad inválida';
    end if;
    if v_lot_code = '' then
      raise exception 'El lote es obligatorio';
    end if;
    if v_expires is null then
      raise exception 'La fecha de vencimiento es obligatoria';
    end if;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
      and organization_id = v_org_id;

    if v_product.id is null then
      raise exception 'Producto inválido';
    end if;

    insert into public.purchase_items (
      purchase_id, product_id, lot_code, expires_on, quantity, unit_cost
    ) values (
      v_purchase_id, v_product.id, v_lot_code, v_expires, v_qty, round(v_cost, 2)
    ) returning id into v_purchase_item_id;

    insert into public.lots (
      organization_id, store_id, product_id, lot_code, expires_on,
      quantity_on_hand, unit_cost, purchase_item_id
    ) values (
      v_org_id, p_store_id, v_product.id, v_lot_code, v_expires,
      v_qty, round(v_cost, 2), v_purchase_item_id
    )
    on conflict (store_id, product_id, lot_code, expires_on)
    do update set
      quantity_on_hand = public.lots.quantity_on_hand + excluded.quantity_on_hand,
      unit_cost = excluded.unit_cost
    returning id into v_lot_id;

    insert into public.stock_movements (
      organization_id, lot_id, type, quantity, purchase_item_id
    ) values (
      v_org_id, v_lot_id, 'purchase', v_qty, v_purchase_item_id
    );
  end loop;

  return v_purchase_id;
end;
$$;

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
  v_sale_item_id uuid;
  v_subtotal numeric(12, 2) := 0;
  v_pay_total numeric(12, 2) := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty numeric(12, 3);
  v_remaining numeric(12, 3);
  v_take numeric(12, 3);
  v_line numeric(12, 2);
  v_payment jsonb;
  v_lot public.lots%rowtype;
  v_today date := public.lima_today();
  v_available numeric(12, 3);
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

    select coalesce(sum(quantity_on_hand), 0) into v_available
    from public.lots
    where store_id = p_store_id
      and product_id = v_product.id
      and quantity_on_hand > 0
      and expires_on >= v_today;

    if v_available < v_qty then
      raise exception 'Stock insuficiente para %', v_product.name;
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
    values (v_sale_id, v_product.id, v_product.name, v_qty, v_product.sale_price, v_line)
    returning id into v_sale_item_id;

    v_remaining := v_qty;

    for v_lot in
      select *
      from public.lots
      where store_id = p_store_id
        and product_id = v_product.id
        and quantity_on_hand > 0
        and expires_on >= v_today
      order by expires_on asc, created_at asc
      for update
    loop
      exit when v_remaining <= 0;
      v_take := least(v_remaining, v_lot.quantity_on_hand);

      update public.lots
      set quantity_on_hand = quantity_on_hand - v_take
      where id = v_lot.id;

      insert into public.sale_item_lots (sale_item_id, lot_id, quantity)
      values (v_sale_item_id, v_lot.id, v_take);

      insert into public.stock_movements (
        organization_id, lot_id, type, quantity, sale_item_id
      ) values (
        v_org_id, v_lot.id, 'sale', v_take, v_sale_item_id
      );

      v_remaining := v_remaining - v_take;
    end loop;

    if v_remaining > 0 then
      raise exception 'Stock insuficiente para %', v_product.name;
    end if;
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

alter table public.suppliers enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.lots enable row level security;
alter table public.stock_movements enable row level security;
alter table public.sale_item_lots enable row level security;

create policy suppliers_select on public.suppliers
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy suppliers_insert_owner on public.suppliers
  for insert to authenticated
  with check (organization_id = public.current_org_id() and public.is_owner());

create policy suppliers_update_owner on public.suppliers
  for update to authenticated
  using (organization_id = public.current_org_id() and public.is_owner())
  with check (organization_id = public.current_org_id() and public.is_owner());

create policy purchases_select on public.purchases
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy purchase_items_select on public.purchase_items
  for select to authenticated
  using (
    exists (
      select 1 from public.purchases p
      where p.id = purchase_id and p.organization_id = public.current_org_id()
    )
  );

create policy lots_select on public.lots
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy stock_movements_select on public.stock_movements
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy sale_item_lots_select on public.sale_item_lots
  for select to authenticated
  using (
    exists (
      select 1 from public.sale_items si
      join public.sales s on s.id = si.sale_id
      where si.id = sale_item_id and s.organization_id = public.current_org_id()
    )
  );

grant select, insert, update on table public.suppliers to authenticated;
grant select on table public.purchases to authenticated;
grant select on table public.purchase_items to authenticated;
grant select on table public.lots to authenticated;
grant select on table public.stock_movements to authenticated;
grant select on table public.sale_item_lots to authenticated;

revoke all on function public.receive_purchase(uuid, uuid, text, jsonb) from public;
grant execute on function public.receive_purchase(uuid, uuid, text, jsonb) to authenticated;
grant execute on function public.lima_today() to authenticated;
grant execute on function public.create_sale(uuid, uuid, jsonb, jsonb) to authenticated;
