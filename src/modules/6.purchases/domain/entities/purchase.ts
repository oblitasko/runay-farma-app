export type PurchaseItemInput = {
  product_id: string;
  lot_code: string;
  expires_on: string;
  quantity: number;
  unit_cost: number;
};

export type Purchase = {
  id: string;
  supplier_id: string;
  supplier_name: string;
  notes: string | null;
  received_at: string;
  item_count: number;
};
