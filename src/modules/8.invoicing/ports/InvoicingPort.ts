import { formatDateTime, formatPen } from '@/src/modules/_shared/utils';
import type { Sale } from '@/src/modules/2.sales/domain/entities';
import { InvoicingApiAdapter } from '../adapters';
import type { Invoice, IssueInvoiceInput } from '../domain/entities';
import { invoiceLabel, invoiceTypeLabel } from '../domain/entities';

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

const columns =
  'id, organization_id, store_id, sale_id, type, series, number, customer_name, customer_doc, customer_phone, total, status, sunat_status, issued_at';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const InvoicingPort = {
  async getBySale(saleId: string): Promise<Invoice | null> {
    const { data, error } = await InvoicingApiAdapter.from('invoices')
      .select(columns)
      .eq('sale_id', saleId)
      .maybeSingle();
    throwIfError(error);
    return (data as Invoice | null) ?? null;
  },

  async getById(id: string): Promise<Invoice> {
    const { data, error } = await InvoicingApiAdapter.from('invoices').select(columns).eq('id', id).single();
    throwIfError(error);
    return data as Invoice;
  },

  async issue(input: IssueInvoiceInput): Promise<Invoice> {
    const { data, error } = await InvoicingApiAdapter.rpc('issue_invoice', {
      p_sale_id: input.saleId,
      p_type: input.type,
      p_customer_name: input.customerName?.trim() || null,
      p_customer_doc: input.customerDoc?.trim() || null,
      p_customer_phone: input.customerPhone?.trim() || null,
    });
    throwIfError(error);
    return InvoicingPort.getById(data as string);
  },

  buildHtml(invoice: Invoice, sale: Sale, storeName: string) {
    const lines = (sale.sale_items ?? [])
      .map(
        (item) =>
          `<tr>
            <td>${escapeHtml(item.product_name)}</td>
            <td style="text-align:right">${item.quantity}</td>
            <td style="text-align:right">${escapeHtml(formatPen(Number(item.unit_price)))}</td>
            <td style="text-align:right">${escapeHtml(formatPen(Number(item.subtotal)))}</td>
          </tr>`,
      )
      .join('');
    const customer = invoice.customer_name || 'Cliente varios';
    const doc = invoice.customer_doc ? ` · ${escapeHtml(invoice.customer_doc)}` : '';
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(invoiceLabel(invoice))}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #0F172A; padding: 24px; }
      h1 { font-size: 20px; margin: 0; }
      .muted { color: #64748B; font-size: 12px; }
      .badge { margin-top: 8px; color: #C42A1C; font-weight: 700; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border-bottom: 1px solid #E2E8F0; padding: 8px 4px; font-size: 13px; text-align: left; }
      .total { font-size: 18px; font-weight: 700; text-align: right; margin-top: 16px; }
    </style>
  </head>
  <body>
    <h1>RUNAY FARMA</h1>
    <p class="muted">${escapeHtml(storeName)} · ${escapeHtml(formatDateTime(invoice.issued_at))}</p>
    <p><strong>${escapeHtml(invoiceTypeLabel(invoice.type))} ${escapeHtml(invoiceLabel(invoice))}</strong></p>
    <p class="badge">Comprobante interno — no válido para SUNAT</p>
    <p>Cliente: ${escapeHtml(customer)}${doc}</p>
    <table>
      <thead>
        <tr><th>Producto</th><th style="text-align:right">Cant.</th><th style="text-align:right">P. unit.</th><th style="text-align:right">Subtotal</th></tr>
      </thead>
      <tbody>${lines}</tbody>
    </table>
    <p class="total">Total ${escapeHtml(formatPen(Number(invoice.total)))}</p>
  </body>
</html>`;
  },

  shareText(invoice: Invoice, storeName: string) {
    const customer = invoice.customer_name ? `\nCliente: ${invoice.customer_name}` : '';
    return `RUNAY FARMA — ${storeName}
${invoiceTypeLabel(invoice.type)} ${invoiceLabel(invoice)}${customer}
Total ${formatPen(Number(invoice.total))}
Comprobante interno — no válido para SUNAT`;
  },
};
