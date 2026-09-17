export type SunatUnitCode = 'NIU' | 'PK' | 'BX' | 'BO';
export type ProductPresentation = 'unidad' | 'blister' | 'caja' | 'frasco' | 'tubo';

export const SUNAT_UNITS: { code: SunatUnitCode; label: string }[] = [
  { code: 'NIU', label: 'NIU unidad' },
  { code: 'PK', label: 'PK paquete' },
  { code: 'BX', label: 'BX caja' },
  { code: 'BO', label: 'BO frasco' },
];

export const PRODUCT_PRESENTATIONS: { id: ProductPresentation; label: string }[] = [
  { id: 'unidad', label: 'Unidad' },
  { id: 'blister', label: 'Blister' },
  { id: 'caja', label: 'Caja' },
  { id: 'frasco', label: 'Frasco' },
  { id: 'tubo', label: 'Tubo' },
];

export function presentationLabel(value: ProductPresentation) {
  return PRODUCT_PRESENTATIONS.find((item) => item.id === value)?.label ?? value;
}

export function productPackLabel(product: { presentation: ProductPresentation; sunat_unit_code: SunatUnitCode }) {
  return `${presentationLabel(product.presentation)} · ${product.sunat_unit_code}`;
}

export type Product = {
  id: string;
  organization_id: string;
  sku: string | null;
  barcode: string | null;
  name: string;
  sale_price: number;
  min_stock: number;
  is_active: boolean;
  sunat_unit_code: SunatUnitCode;
  presentation: ProductPresentation;
  sort_order: number;
};

export type ProductInput = {
  organization_id: string;
  name: string;
  sale_price: number;
  sku?: string | null;
  barcode?: string | null;
  min_stock?: number;
  is_active?: boolean;
  sunat_unit_code?: SunatUnitCode;
  presentation?: ProductPresentation;
  sort_order?: number;
};
