export type Organization = {
  id: string;
  name: string;
  ruc: string | null;
  tax_address: string | null;
  phone: string | null;
  email: string | null;
};

export type OrganizationInput = {
  name: string;
  ruc?: string | null;
  tax_address?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type DocumentSeries = {
  id: string;
  store_id: string;
  type: 'boleta' | 'factura';
  series: string;
  next_number: number;
};

export type DocumentSeriesInput = {
  series: string;
  next_number: number;
};

export type IssuerProfile = {
  legalName: string;
  ruc: string | null;
  storeName: string;
  storeAddress: string | null;
};

export function issuerFrom(org: Organization | null, store: { name: string; address?: string | null } | null): IssuerProfile {
  return {
    legalName: org?.name?.trim() || 'RUNAY FARMA',
    ruc: org?.ruc ?? null,
    storeName: store?.name?.trim() || 'Local',
    storeAddress: store?.address?.trim() || null,
  };
}
