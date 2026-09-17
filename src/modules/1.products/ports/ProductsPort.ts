import { ProductsApiAdapter } from '../adapters';
import type { Product, ProductInput } from '../domain/entities';

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

const columns =
  'id, organization_id, sku, barcode, name, sale_price, min_stock, is_active, sunat_unit_code, presentation, sort_order';

export const ProductsPort = {
  async list(organizationId: string, search = ''): Promise<Product[]> {
    let query = ProductsApiAdapter.from('products')
      .select(columns)
      .eq('organization_id', organizationId)
      .order('sort_order')
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
        min_stock: input.min_stock ?? 0,
        sunat_unit_code: input.sunat_unit_code ?? 'NIU',
        presentation: input.presentation ?? 'unidad',
        sort_order: input.sort_order ?? 0,
        is_active: input.is_active ?? true,
      })
      .select(columns)
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
        min_stock: input.min_stock,
        sunat_unit_code: input.sunat_unit_code,
        presentation: input.presentation,
        sort_order: input.sort_order,
        is_active: input.is_active,
      })
      .eq('id', id)
      .select(columns)
      .single();
    throwIfError(error);
    return data as Product;
  },
};
