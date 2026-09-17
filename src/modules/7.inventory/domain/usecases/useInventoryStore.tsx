import { create } from 'zustand';
import type { LoadingStatusProps } from '@/src/modules/_shared/domain/entities';
import { InventoryPort } from '../../ports';
import type { Lot, RestockSuggestion, StockRow } from '../entities';

type Filter = 'all' | 'min' | 'expiry';

type InventoryState = {
  stock: StockRow[];
  lots: Lot[];
  restock: RestockSuggestion[];
  filter: Filter;
  alertCount: number;
  loading: LoadingStatusProps;
  error: string | null;
  setFilter: (filter: Filter) => void;
  onLoadStock: (organizationId: string, storeId: string) => Promise<void>;
  onLoadLots: (storeId: string, productId?: string) => Promise<void>;
  onLoadRestock: (organizationId: string, storeId: string) => Promise<void>;
};

export const useInventoryStore = create<InventoryState>((set) => ({
  stock: [],
  lots: [],
  restock: [],
  filter: 'all',
  alertCount: 0,
  loading: { status: 'neutral' },
  error: null,

  setFilter: (filter) => set({ filter }),

  onLoadStock: async (organizationId, storeId) => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const stock = await InventoryPort.listStock(organizationId, storeId);
      set({ stock, alertCount: InventoryPort.alertCount(stock), loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo cargar el inventario',
        loading: { status: 'failed' },
      });
    }
  },

  onLoadLots: async (storeId, productId) => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const lots = await InventoryPort.listLots(storeId, productId);
      set({ lots, loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudieron cargar los lotes',
        loading: { status: 'failed' },
      });
    }
  },

  onLoadRestock: async (organizationId, storeId) => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const restock = await InventoryPort.suggestRestock(organizationId, storeId);
      set({ restock, loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo calcular la reposición',
        loading: { status: 'failed' },
      });
    }
  },
}));
