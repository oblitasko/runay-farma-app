import { create } from 'zustand';
import type { LoadingStatusProps } from '@/src/modules/_shared/domain/entities';
import { InvoicingPort } from '../../ports';
import type { Invoice, InvoiceType } from '../entities';

type InvoicingState = {
  invoice: Invoice | null;
  loading: LoadingStatusProps;
  error: string | null;
  onLoadBySale: (saleId: string) => Promise<void>;
  onIssue: (
    saleId: string,
    type: InvoiceType,
    customer: { name: string; doc: string; phone: string },
  ) => Promise<Invoice>;
};

export const useInvoicingStore = create<InvoicingState>((set) => ({
  invoice: null,
  loading: { status: 'neutral' },
  error: null,

  onLoadBySale: async (saleId) => {
    set({ loading: { status: 'loading' }, error: null, invoice: null });
    try {
      const invoice = await InvoicingPort.getBySale(saleId);
      set({ invoice, loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo cargar el comprobante',
        loading: { status: 'failed' },
      });
    }
  },

  onIssue: async (saleId, type, customer) => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const invoice = await InvoicingPort.issue({
        saleId,
        type,
        customerName: customer.name,
        customerDoc: customer.doc,
        customerPhone: customer.phone,
      });
      set({ invoice, loading: { status: 'success' } });
      return invoice;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo emitir el comprobante',
        loading: { status: 'failed' },
      });
      throw error;
    }
  },
}));
