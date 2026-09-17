-- Semilla Fase 1: botica única, sucursal Principal y métodos de pago Perú.
-- Si la organización ya existe (por el trigger de primer usuario), este seed es idempotente.

insert into public.organizations (id, name)
values ('00000000-0000-0000-0000-000000000001', 'RUNAY FARMA')
on conflict (id) do nothing;

insert into public.stores (id, organization_id, name)
values (
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000001',
  'Principal'
)
on conflict (id) do nothing;

insert into public.payment_methods (organization_id, code, name, sort_order)
values
  ('00000000-0000-0000-0000-000000000001', 'cash', 'Efectivo', 1),
  ('00000000-0000-0000-0000-000000000001', 'yape', 'Yape', 2),
  ('00000000-0000-0000-0000-000000000001', 'plin', 'Plin', 3),
  ('00000000-0000-0000-0000-000000000001', 'card', 'Tarjeta', 4),
  ('00000000-0000-0000-0000-000000000001', 'transfer', 'Transferencia', 5)
on conflict (organization_id, code) do nothing;
