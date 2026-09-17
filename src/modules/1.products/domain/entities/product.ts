export type Product = {
  id: string;
  organization_id: string;
  sku: string | null;
  barcode: string | null;
  name: string;
  sale_price: number;
  is_active: boolean;
};

export type ProductInput = {
  organization_id: string;
  name: string;
  sale_price: number;
  sku?: string | null;
  barcode?: string | null;
  is_active?: boolean;
};
