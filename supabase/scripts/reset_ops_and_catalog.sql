-- Limpia datos operativos, carga catálogo y una compra inicial con lotes (FEFO).
-- No toca organizations, stores, profiles ni payment_methods.
-- Crea "Distribuidora demo" solo si la org no tiene proveedor activo.

truncate table
  public.invoices,
  public.sale_item_lots,
  public.stock_movements,
  public.sale_payments,
  public.sale_items,
  public.sales,
  public.lots,
  public.purchase_items,
  public.purchases,
  public.cash_sessions,
  public.products
cascade;

update public.document_series set next_number = 1;

insert into public.products (
  organization_id, sku, barcode, name, sale_price, min_stock,
  sunat_unit_code, presentation, sort_order
)
select
  o.id,
  v.sku,
  v.barcode,
  v.name,
  v.sale_price,
  v.min_stock,
  v.sunat_unit_code,
  v.presentation,
  v.sort_order
from public.organizations o
cross join (
  values
    -- Analgésicos / AINE
    ('PARA500-U', '7750000000017', 'Paracetamol 500 mg — unidad', 0.20, 20, 'NIU', 'unidad', 10),
    ('PARA500-B10', '7750000000024', 'Paracetamol 500 mg — blister x10', 1.80, 8, 'PK', 'blister', 20),
    ('PARA500-C100', '7750000000031', 'Paracetamol 500 mg — caja x100', 15.00, 2, 'BX', 'caja', 30),
    ('IBU400-U', '7750000000048', 'Ibuprofeno 400 mg — unidad', 0.35, 20, 'NIU', 'unidad', 40),
    ('IBU400-B10', '7750000000055', 'Ibuprofeno 400 mg — blister x10', 3.20, 8, 'PK', 'blister', 50),
    ('IBU400-C100', '7750000000062', 'Ibuprofeno 400 mg — caja x100', 28.00, 2, 'BX', 'caja', 60),
    ('NAP550-B10', '7750000000079', 'Naproxeno 550 mg — blister x10', 8.50, 5, 'PK', 'blister', 70),
    ('DIC50-U', '7750000000086', 'Diclofenaco 50 mg — unidad', 0.25, 20, 'NIU', 'unidad', 80),
    ('DIC50-B10', '7750000000093', 'Diclofenaco 50 mg — blister x10', 2.20, 8, 'PK', 'blister', 90),
    -- Antigripales / antihistamínicos
    ('GRIPE-B10', '7750000000109', 'Paracetamol + clorfenamina + fenilefrina — blister x10', 4.50, 6, 'PK', 'blister', 100),
    ('LORA10-U', '7750000000116', 'Loratadina 10 mg — unidad', 0.40, 20, 'NIU', 'unidad', 110),
    ('LORA10-B10', '7750000000123', 'Loratadina 10 mg — blister x10', 3.50, 8, 'PK', 'blister', 120),
    ('CETI10-B10', '7750000000130', 'Cetirizina 10 mg — blister x10', 4.00, 8, 'PK', 'blister', 130),
    ('PSEU-B10', '7750000000147', 'Pseudoefedrina + paracetamol — blister x10', 5.50, 6, 'PK', 'blister', 140),
    -- Antibióticos
    ('AMOX500-U', '7750000000154', 'Amoxicilina 500 mg — unidad', 0.80, 20, 'NIU', 'unidad', 200),
    ('AMOX500-B10', '7750000000161', 'Amoxicilina 500 mg — blister x10', 7.00, 8, 'PK', 'blister', 210),
    ('AMOX500-C50', '7750000000178', 'Amoxicilina 500 mg — caja x50', 32.00, 2, 'BX', 'caja', 220),
    ('AZI500-U', '7750000000185', 'Azitromicina 500 mg — unidad', 2.50, 10, 'NIU', 'unidad', 230),
    ('AZI500-B3', '7750000000192', 'Azitromicina 500 mg — blister x3', 6.80, 6, 'PK', 'blister', 240),
    ('AZI500-C3', '7750000000208', 'Azitromicina 500 mg — caja x3', 18.00, 2, 'BX', 'caja', 250),
    ('TMPSMX-B10', '7750000000215', 'Trimetoprim / sulfametoxazol 800/160 mg — blister x10', 5.50, 6, 'PK', 'blister', 260),
    -- Digestivos / SRO
    ('OME20-U', '7750000000222', 'Omeprazol 20 mg — unidad', 0.30, 20, 'NIU', 'unidad', 300),
    ('OME20-B14', '7750000000239', 'Omeprazol 20 mg — blister x14', 3.80, 6, 'PK', 'blister', 310),
    ('LOPE2-B10', '7750000000246', 'Loperamida 2 mg — blister x10', 3.20, 6, 'PK', 'blister', 320),
    ('SRO-PK', '7750000000253', 'Sales de rehidratación oral — sobre', 1.50, 12, 'PK', 'blister', 330),
    ('ALUM-BO', '7750000000260', 'Hidróxido de aluminio — frasco 150 ml', 8.50, 4, 'BO', 'frasco', 340),
    -- Respiratorio / jarabes
    ('SALB-BO100', '7750000000277', 'Salbutamol jarabe 2 mg/5 ml — frasco 100 ml', 12.00, 4, 'BO', 'frasco', 400),
    ('AMBR-BO120', '7750000000284', 'Ambroxol jarabe 15 mg/5 ml — frasco 120 ml', 11.50, 4, 'BO', 'frasco', 410),
    ('DEXT-BO120', '7750000000291', 'Dextrometorfano jarabe — frasco 120 ml', 10.00, 4, 'BO', 'frasco', 420),
    ('PRED-BO60', '7750000000307', 'Prednisolona jarabe — frasco 60 ml', 18.00, 3, 'BO', 'frasco', 430),
    ('PARA-PED-BO', '7750000000314', 'Paracetamol jarabe pediátrico 120 mg/5 ml — frasco 60 ml', 8.90, 4, 'BO', 'frasco', 440),
    -- Vitaminas
    ('FOL05-B20', '7750000000321', 'Ácido fólico 0.5 mg — blister x20', 3.00, 6, 'PK', 'blister', 500),
    ('FE200-B10', '7750000000338', 'Hierro fumarato 200 mg — blister x10', 4.50, 6, 'PK', 'blister', 510),
    ('BCOMP-B10', '7750000000345', 'Complejo B — blister x10', 5.00, 6, 'PK', 'blister', 520),
    ('VITC500-B10', '7750000000352', 'Ácido ascórbico 500 mg — blister x10', 4.20, 6, 'PK', 'blister', 530),
    -- Dermatológico
    ('CLOT-TU20', '7750000000369', 'Clotrimazol crema 1% — tubo 20 g', 8.50, 4, 'NIU', 'tubo', 600),
    ('HIDR-TU15', '7750000000376', 'Hidrocortisona crema 1% — tubo 15 g', 9.00, 4, 'NIU', 'tubo', 610),
    ('SULFA-TU50', '7750000000383', 'Sulfadiazina de plata crema — tubo 50 g', 16.00, 3, 'NIU', 'tubo', 620),
    -- Cuidado / curación
    ('ALC70-BO250', '7750000000390', 'Alcohol 70° — frasco 250 ml', 4.50, 6, 'BO', 'frasco', 700),
    ('ALC70-BO1L', '7750000000406', 'Alcohol 70° — frasco 1 L', 9.50, 4, 'BO', 'frasco', 710),
    ('H2O2-BO100', '7750000000413', 'Agua oxigenada 10 vol — frasco 100 ml', 3.80, 6, 'BO', 'frasco', 720),
    ('GASA-PK10', '7750000000420', 'Gasa estéril 10x10 cm — paquete x10', 4.00, 8, 'PK', 'blister', 730),
    ('ESPA-U', '7750000000437', 'Esparadrapo 2.5 cm x 5 m — unidad', 3.50, 6, 'NIU', 'unidad', 740),
    ('SF09-BO250', '7750000000444', 'Suero fisiológico 0.9% — frasco 250 ml', 5.50, 6, 'BO', 'frasco', 750)
) as v(
  sku, barcode, name, sale_price, min_stock, sunat_unit_code, presentation, sort_order
);

insert into public.suppliers (organization_id, name, is_active)
select o.id, 'Distribuidora demo', true
from public.organizations o
where not exists (
  select 1
  from public.suppliers s
  where s.organization_id = o.id and s.is_active = true
);

insert into public.purchases (organization_id, store_id, supplier_id, status, notes, received_by)
select
  s.organization_id,
  s.id,
  (
    select su.id
    from public.suppliers su
    where su.organization_id = s.organization_id and su.is_active = true
    order by su.created_at
    limit 1
  ),
  'received',
  'Carga inicial',
  (
    select p.user_id
    from public.profiles p
    where p.organization_id = s.organization_id
    order by case when p.role = 'owner' then 0 else 1 end, p.created_at
    limit 1
  )
from public.stores s;

with lines as (
  select
    pu.id as purchase_id,
    pr.id as product_id,
    'L-A'::text as lot_code,
    (current_date + interval '18 months')::date as expires_on,
    case pr.presentation
      when 'unidad' then 80
      when 'blister' then 24
      when 'caja' then 6
      when 'frasco' then 12
      when 'tubo' then 10
      else 10
    end::numeric(12, 3) as quantity,
    round(pr.sale_price * 0.6, 2) as unit_cost
  from public.purchases pu
  join public.products pr on pr.organization_id = pu.organization_id
  where pu.notes = 'Carga inicial'
  union all
  select
    pu.id,
    pr.id,
    'L-B',
    (current_date + 20)::date,
    case pr.presentation
      when 'unidad' then 10
      when 'blister' then 4
      when 'caja' then 1
      when 'frasco' then 2
      else 2
    end::numeric(12, 3),
    round(pr.sale_price * 0.6, 2)
  from public.purchases pu
  join public.products pr on pr.organization_id = pu.organization_id
  where pu.notes = 'Carga inicial'
    and (pr.sort_order < 100 or (pr.sort_order >= 400 and pr.sort_order < 500))
),
ins_items as (
  insert into public.purchase_items (purchase_id, product_id, lot_code, expires_on, quantity, unit_cost)
  select purchase_id, product_id, lot_code, expires_on, quantity, unit_cost
  from lines
  returning id, purchase_id, product_id, lot_code, expires_on, quantity, unit_cost
),
ins_lots as (
  insert into public.lots (
    organization_id, store_id, product_id, lot_code, expires_on,
    quantity_on_hand, unit_cost, purchase_item_id
  )
  select
    pu.organization_id,
    pu.store_id,
    i.product_id,
    i.lot_code,
    i.expires_on,
    i.quantity,
    i.unit_cost,
    i.id
  from ins_items i
  join public.purchases pu on pu.id = i.purchase_id
  returning id, organization_id, quantity_on_hand, purchase_item_id
)
insert into public.stock_movements (organization_id, lot_id, type, quantity, purchase_item_id)
select organization_id, id, 'purchase', quantity_on_hand, purchase_item_id
from ins_lots;
