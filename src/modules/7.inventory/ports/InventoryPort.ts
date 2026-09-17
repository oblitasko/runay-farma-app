import { limaDateISO } from '@/src/modules/_shared/utils';
import { ProductsPort } from '@/src/modules/1.products/ports';
import { InventoryApiAdapter } from '../adapters';
import type { Lot, StockRow } from '../domain/entities';

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00-05:00`);
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
}

type LotRow = {
  id: string;
  product_id: string;
  lot_code: string;
  expires_on: string;
  quantity_on_hand: number;
  unit_cost: number;
  products: { name: string } | { name: string }[] | null;
};

function productName(row: LotRow) {
  const nested = row.products;
  if (Array.isArray(nested)) return nested[0]?.name ?? 'Producto';
  return nested?.name ?? 'Producto';
}

export const InventoryPort = {
  async listLots(storeId: string, productId?: string): Promise<Lot[]> {
    let query = InventoryApiAdapter.from('lots')
      .select('id, product_id, lot_code, expires_on, quantity_on_hand, unit_cost, products(name)')
      .eq('store_id', storeId)
      .order('expires_on');

    if (productId) query = query.eq('product_id', productId);

    const { data, error } = await query;
    throwIfError(error);
    return ((data ?? []) as unknown as LotRow[]).map((row) => ({
      id: row.id,
      product_id: row.product_id,
      product_name: productName(row),
      lot_code: row.lot_code,
      expires_on: row.expires_on,
      quantity_on_hand: Number(row.quantity_on_hand),
      unit_cost: Number(row.unit_cost),
    }));
  },

  async listStock(organizationId: string, storeId: string): Promise<StockRow[]> {
    const [products, lots] = await Promise.all([ProductsPort.list(organizationId), InventoryPort.listLots(storeId)]);
    const today = limaDateISO();
    const in30 = addDays(today, 30);

    return products.map((product) => {
      const productLots = lots.filter((lot) => lot.product_id === product.id);
      const onHand = productLots.reduce((sum, lot) => sum + lot.quantity_on_hand, 0);
      const sellableLots = productLots.filter((lot) => lot.expires_on >= today && lot.quantity_on_hand > 0);
      const sellable = sellableLots.reduce((sum, lot) => sum + lot.quantity_on_hand, 0);
      const nearestExpiry = sellableLots[0]?.expires_on ?? null;
      const minStock = Number(product.min_stock ?? 0);
      return {
        productId: product.id,
        name: product.name,
        barcode: product.barcode,
        sku: product.sku,
        salePrice: Number(product.sale_price),
        minStock,
        isActive: product.is_active,
        onHand,
        sellable,
        nearestExpiry,
        isBelowMin: minStock > 0 && sellable < minStock,
        hasExpiring30: sellableLots.some((lot) => lot.expires_on <= in30),
        hasExpired: productLots.some((lot) => lot.expires_on < today && lot.quantity_on_hand > 0),
      };
    });
  },
};
