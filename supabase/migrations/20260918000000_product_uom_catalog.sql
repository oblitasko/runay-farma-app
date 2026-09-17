-- Unidad de medida SUNAT (catálogo 03) y presentación comercial por SKU.

alter table public.products
  add column if not exists sunat_unit_code text not null default 'NIU',
  add column if not exists presentation text not null default 'unidad',
  add column if not exists sort_order integer not null default 0;

alter table public.products drop constraint if exists products_sunat_unit_check;
alter table public.products
  add constraint products_sunat_unit_check
  check (sunat_unit_code in ('NIU', 'PK', 'BX', 'BO'));

alter table public.products drop constraint if exists products_presentation_check;
alter table public.products
  add constraint products_presentation_check
  check (presentation in ('unidad', 'blister', 'caja', 'frasco', 'tubo'));

create index if not exists products_org_sort_idx
  on public.products (organization_id, sort_order, name);
