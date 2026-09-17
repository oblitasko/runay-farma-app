export type Supplier = {
  id: string;
  organization_id: string;
  name: string;
  ruc: string | null;
  phone: string | null;
  is_active: boolean;
};

export type SupplierInput = {
  organization_id: string;
  name: string;
  ruc?: string | null;
  phone?: string | null;
  is_active?: boolean;
};
