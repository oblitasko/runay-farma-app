export type InvoiceType = 'boleta' | 'factura';

export type Invoice = {
  id: string;
  organization_id: string;
  store_id: string;
  sale_id: string;
  type: InvoiceType;
  series: string;
  number: number;
  customer_name: string | null;
  customer_doc: string | null;
  customer_phone: string | null;
  total: number;
  status: string;
  sunat_status: string;
  issued_at: string;
};

export type IssueInvoiceInput = {
  saleId: string;
  type: InvoiceType;
  customerName?: string;
  customerDoc?: string;
  customerPhone?: string;
};

export function invoiceLabel(invoice: Invoice) {
  return `${invoice.series}-${String(invoice.number).padStart(8, '0')}`;
}

export function invoiceTypeLabel(type: InvoiceType) {
  return type === 'factura' ? 'Factura interna' : 'Boleta interna';
}
