import { ProductsApiAdapter } from '../adapters';
import type { Product, ProductInput } from '../domain/entities';

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export const ProductsPort = {
  async list(organizationId: string, search = ''): Promise<Product[]> {
    let query = ProductsApiAdapter.from('products')
      .select('id, organization_id, sku, barcode, name, sale_price, is_active')
      .eq('organization_id', organizationId)
      .order('name');

    const term = search.trim().replace(/[%_,()]/g, '');
    if (term) {
      query = query.or(`name.ilike.%${term}%,barcode.ilike.%${term}%,sku.ilike.%${term}%`);
    }

    const { data, error } = await query;
    throwIfError(error);
    return (data ?? []) as Product[];
  },

  async create(input: ProductInput): Promise<Product> {
    const { data, error } = await ProductsApiAdapter.from('products')
      .insert({
        organization_id: input.organization_id,
        name: input.name.trim(),
        sale_price: input.sale_price,
        sku: input.sku?.trim() || null,
        barcode: input.barcode?.trim() || null,
        is_active: input.is_active ?? true,
      })
      .select('id, organization_id, sku, barcode, name, sale_price, is_active')
      .single();
    throwIfError(error);
    return data as Product;
  },

  async update(id: string, input: Partial<ProductInput>): Promise<Product> {
    const { data, error } = await ProductsApiAdapter.from('products')
      .update({
        name: input.name?.trim(),
        sale_price: input.sale_price,
        sku: input.sku === undefined ? undefined : input.sku?.trim() || null,
        barcode: input.barcode === undefined ? undefined : input.barcode?.trim() || null,
        is_active: input.is_active,
      })
      .eq('id', id)
      .select('id, organization_id, sku, barcode, name, sale_price, is_active')
      .single();
    throwIfError(error);
    return data as Product;
  },
};
