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
