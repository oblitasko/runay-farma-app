import { SuppliersApiAdapter } from '../adapters';
import type { Supplier, SupplierInput } from '../domain/entities';

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

const columns = 'id, organization_id, name, ruc, phone, is_active';

export const SuppliersPort = {
  async list(organizationId: string, search = ''): Promise<Supplier[]> {
    let query = SuppliersApiAdapter.from('suppliers')
      .select(columns)
      .eq('organization_id', organizationId)
      .order('name');

    const term = search.trim().replace(/[%_,()]/g, '');
    if (term) {
      query = query.or(`name.ilike.%${term}%,ruc.ilike.%${term}%`);
    }

    const { data, error } = await query;
    throwIfError(error);
    return (data ?? []) as Supplier[];
  },

  async create(input: SupplierInput): Promise<Supplier> {
    const { data, error } = await SuppliersApiAdapter.from('suppliers')
      .insert({
        organization_id: input.organization_id,
        name: input.name.trim(),
        ruc: input.ruc?.trim() || null,
        phone: input.phone?.trim() || null,
        is_active: input.is_active ?? true,
      })
      .select(columns)
      .single();
    throwIfError(error);
    return data as Supplier;
  },

  async update(id: string, input: Partial<SupplierInput>): Promise<Supplier> {
    const { data, error } = await SuppliersApiAdapter.from('suppliers')
      .update({
        name: input.name?.trim(),
        ruc: input.ruc === undefined ? undefined : input.ruc?.trim() || null,
        phone: input.phone === undefined ? undefined : input.phone?.trim() || null,
        is_active: input.is_active,
      })
      .eq('id', id)
      .select(columns)
      .single();
    throwIfError(error);
    return data as Supplier;
  },
};
