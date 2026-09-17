import { create } from 'zustand';
import type { LoadingStatusProps } from '@/src/modules/_shared/domain/entities';
import { PurchasesPort } from '../../ports';
import type { Purchase, PurchaseItemInput } from '../entities';

type PurchasesState = {
  items: Purchase[];
  loading: LoadingStatusProps;
  error: string | null;
  onLoad: (storeId: string) => Promise<void>;
  onReceive: (storeId: string, supplierId: string, notes: string, lines: PurchaseItemInput[]) => Promise<string>;
};

export const usePurchasesStore = create<PurchasesState>((set, get) => ({
  items: [],
  loading: { status: 'neutral' },
  error: null,

  onLoad: async (storeId) => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const items = await PurchasesPort.list(storeId);
      set({ items, loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudieron cargar las compras',
        loading: { status: 'failed' },
      });
    }
  },

  onReceive: async (storeId, supplierId, notes, lines) => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const id = await PurchasesPort.receive(storeId, supplierId, notes, lines);
      await get().onLoad(storeId);
      return id;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo registrar la compra',
        loading: { status: 'failed' },
      });
      throw error;
    }
  },
}));
