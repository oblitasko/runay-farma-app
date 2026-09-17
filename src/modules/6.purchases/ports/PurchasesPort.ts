import { PurchasesApiAdapter } from '../adapters';
import type { Purchase, PurchaseItemInput } from '../domain/entities';

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

type PurchaseRow = {
  id: string;
  supplier_id: string;
  notes: string | null;
  received_at: string;
  suppliers: { name: string } | { name: string }[] | null;
  purchase_items: { id: string }[] | null;
};

function supplierName(row: PurchaseRow) {
  const nested = row.suppliers;
  if (Array.isArray(nested)) return nested[0]?.name ?? 'Proveedor';
  return nested?.name ?? 'Proveedor';
}

export const PurchasesPort = {
  async list(storeId: string): Promise<Purchase[]> {
    const { data, error } = await PurchasesApiAdapter.from('purchases')
      .select('id, supplier_id, notes, received_at, suppliers(name), purchase_items(id)')
      .eq('store_id', storeId)
      .order('received_at', { ascending: false });
    throwIfError(error);
    return ((data ?? []) as unknown as PurchaseRow[]).map((row) => ({
      id: row.id,
      supplier_id: row.supplier_id,
      supplier_name: supplierName(row),
      notes: row.notes,
      received_at: row.received_at,
      item_count: row.purchase_items?.length ?? 0,
    }));
  },

  async receive(storeId: string, supplierId: string, notes: string, items: PurchaseItemInput[]): Promise<string> {
    const { data, error } = await PurchasesApiAdapter.rpc('receive_purchase', {
      p_store_id: storeId,
      p_supplier_id: supplierId,
      p_notes: notes || null,
      p_items: items,
    });
    throwIfError(error);
    return data as string;
  },
};
