import { addLimaDays, limaDateISO, limaDayRange } from '@/src/modules/_shared/utils';
import { ProductsPort } from '@/src/modules/1.products/ports';
import { SalesPort } from '@/src/modules/2.sales/ports';
import { InventoryApiAdapter } from '../adapters';
import type { KardexLine, KardexPeriod, KardexView, Lot, RestockSuggestion, StockRow } from '../domain/entities';

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function addDays(iso: string, days: number) {
  return addLimaDays(iso, days);
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
        presentation: product.presentation,
        sunatUnitCode: product.sunat_unit_code,
        onHand,
        sellable,
        nearestExpiry,
        isBelowMin: minStock > 0 && sellable < minStock,
        hasExpiring30: sellableLots.some((lot) => lot.expires_on <= in30),
        hasExpired: productLots.some((lot) => lot.expires_on < today && lot.quantity_on_hand > 0),
      };
    });
  },

  alertCount(stock: StockRow[]) {
    return stock.filter((row) => row.isBelowMin || row.hasExpiring30 || row.hasExpired).length;
  },

  async suggestRestock(organizationId: string, storeId: string, coverDays = 7): Promise<RestockSuggestion[]> {
    const lookback = 30;
    const toISO = limaDateISO();
    const fromISO = addLimaDays(toISO, -(lookback - 1));
    const [stock, sales] = await Promise.all([
      InventoryPort.listStock(organizationId, storeId),
      SalesPort.listSalesRange(storeId, fromISO, toISO),
    ]);
    const sold = new Map<string, { name: string; quantity: number }>();
    for (const sale of sales.filter((item) => item.status === 'completed')) {
      for (const item of sale.sale_items ?? []) {
        const current = sold.get(item.product_id) ?? { name: item.product_name, quantity: 0 };
        current.quantity += Number(item.quantity);
        sold.set(item.product_id, current);
      }
    }

    return stock
      .filter((row) => row.isActive)
      .map((row) => {
        const qty = sold.get(row.productId)?.quantity ?? 0;
        const avgDaily = qty / lookback;
        const suggested = Math.max(0, Math.ceil(avgDaily * coverDays - row.sellable));
        return {
          productId: row.productId,
          name: row.name,
          sellable: row.sellable,
          avgDaily: Math.round(avgDaily * 100) / 100,
          suggested,
        };
      })
      .filter((row) => row.suggested > 0)
      .sort((a, b) => b.suggested - a.suggested);
  },

  async listKardex(storeId: string, productId: string): Promise<KardexLine[]> {
    const { data, error } = await InventoryApiAdapter.from('kardex_lines')
      .select(
        'id, store_id, product_id, product_name, presentation, type, qty_in, qty_out, product_balance, lot_balance, lot_code, expires_on, supplier_name, sale_id, purchase_id, purchase_notes, created_at',
      )
      .eq('store_id', storeId)
      .eq('product_id', productId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });
    throwIfError(error);
    return ((data ?? []) as KardexLine[]).map((row) => ({
      ...row,
      qty_in: Number(row.qty_in),
      qty_out: Number(row.qty_out),
      product_balance: Number(row.product_balance),
      lot_balance: Number(row.lot_balance),
    }));
  },

  sliceKardex(lines: KardexLine[], period: KardexPeriod, lotCode?: string | null): KardexView {
    const lotCodes = [...new Set(lines.map((line) => line.lot_code))];
    const scoped = lotCode ? lines.filter((line) => line.lot_code === lotCode) : lines;
    if (period === 'all') {
      return { opening: null, lines: scoped, lotCodes };
    }
    const fromISO = addLimaDays(limaDateISO(), -(period - 1));
    const fromMs = new Date(limaDayRange(fromISO).from).getTime();
    const before = scoped.filter((line) => new Date(line.created_at).getTime() < fromMs);
    const inRange = scoped.filter((line) => new Date(line.created_at).getTime() >= fromMs);
    const last = before.at(-1);
    return {
      opening: {
        productBalance: last?.product_balance ?? 0,
        lotBalance: lotCode ? (last?.lot_balance ?? 0) : null,
      },
      lines: inRange,
      lotCodes,
    };
  },
};
