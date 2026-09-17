export type Lot = {
  id: string;
  product_id: string;
  product_name: string;
  lot_code: string;
  expires_on: string;
  quantity_on_hand: number;
  unit_cost: number;
};

export type StockRow = {
  productId: string;
  name: string;
  barcode: string | null;
  sku: string | null;
  salePrice: number;
  minStock: number;
  isActive: boolean;
  presentation: string;
  sunatUnitCode: string;
  onHand: number;
  sellable: number;
  nearestExpiry: string | null;
  isBelowMin: boolean;
  hasExpiring30: boolean;
  hasExpired: boolean;
};

export type RestockSuggestion = {
  productId: string;
  name: string;
  sellable: number;
  avgDaily: number;
  suggested: number;
};

export type KardexMovementType = 'purchase' | 'sale';
export type KardexPeriod = 7 | 30 | 365 | 'all';

export type KardexLine = {
  id: string;
  store_id: string;
  product_id: string;
  product_name: string;
  presentation: string;
  type: KardexMovementType;
  qty_in: number;
  qty_out: number;
  product_balance: number;
  lot_balance: number;
  lot_code: string;
  expires_on: string;
  supplier_name: string | null;
  sale_id: string | null;
  purchase_id: string | null;
  purchase_notes: string | null;
  created_at: string;
};

export type KardexOpening = {
  productBalance: number;
  lotBalance: number | null;
};

export type KardexView = {
  opening: KardexOpening | null;
  lines: KardexLine[];
  lotCodes: string[];
};

export function kardexDocumentLabel(line: KardexLine) {
  if (line.type === 'purchase') return line.supplier_name || line.purchase_notes || 'Compra';
  return 'Venta';
}
