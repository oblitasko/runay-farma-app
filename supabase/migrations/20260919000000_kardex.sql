-- Kardex operativo: historial de entradas/salidas con saldo por producto y por lote.

create index if not exists stock_movements_org_created_idx
  on public.stock_movements (organization_id, created_at desc);

drop view if exists public.kardex_lines;

create view public.kardex_lines
with (security_invoker = true) as
select
  sm.id,
  sm.organization_id,
  l.store_id,
  l.product_id,
  pr.name as product_name,
  pr.presentation,
  sm.type,
  case when sm.type = 'purchase' then sm.quantity else 0 end::numeric(12, 3) as qty_in,
  case when sm.type = 'sale' then sm.quantity else 0 end::numeric(12, 3) as qty_out,
  sum(case when sm.type = 'purchase' then sm.quantity else -sm.quantity end)
    over (
      partition by l.store_id, l.product_id
      order by sm.created_at, sm.id
    )::numeric(12, 3) as product_balance,
  sum(case when sm.type = 'purchase' then sm.quantity else -sm.quantity end)
    over (
      partition by l.store_id, l.id
      order by sm.created_at, sm.id
    )::numeric(12, 3) as lot_balance,
  l.lot_code,
  l.expires_on,
  su.name as supplier_name,
  s.id as sale_id,
  pu.id as purchase_id,
  pu.notes as purchase_notes,
  sm.created_at
from public.stock_movements sm
join public.lots l on l.id = sm.lot_id
join public.products pr on pr.id = l.product_id
left join public.purchase_items pi on pi.id = sm.purchase_item_id
left join public.purchases pu on pu.id = pi.purchase_id
left join public.suppliers su on su.id = pu.supplier_id
left join public.sale_items si on si.id = sm.sale_item_id
left join public.sales s on s.id = si.sale_id;

revoke all on table public.kardex_lines from public, anon;
grant select on table public.kardex_lines to authenticated;
